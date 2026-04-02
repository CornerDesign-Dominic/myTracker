# Performance / Datenabruf – aktueller Stand und spätere Optimierung

## 1. Kurzfazit

Der aktuelle Datenabruf ist für den jetzigen Launch-Stand grundsätzlich okay. Die App arbeitet mit einem zentralen Live-Abruf für nicht archivierte Subscriptions und ergänzt darauf aufbauend History-Logik, wenn sie fachlich gebraucht wird.

Aus aktueller Sicht liegen die größten potenziellen Optimierungspunkte nicht beim normalen Subscription-Abruf, sondern bei History und Sync:

- History wird an mehreren Stellen breit und live geladen.
- Der globale History-Sync liest pro Subscription die komplette Historie.
- Einige Schreiboperationen lesen vor dem Schreiben zunächst die komplette History.

Für kleine bis mittlere Nutzung ist das funktional sauber und pragmatisch. Bei wachsender Nutzerzahl, längerer Nutzungsdauer und damit größerer History wird genau dieser Bereich voraussichtlich zuerst relevant.

## 2. Aktueller Datenabruf im Projekt

### Subscriptions

Der zentrale Einstieg ist [`src/hooks/useSubscriptions.ts`](C:\Users\domin\Desktop\Tracker\src\hooks\useSubscriptions.ts).

Dieser Hook:

- liest den aktuellen Nutzerzustand aus dem Auth-Kontext,
- bindet den zentralen Subscription-Listener über [`src/presentation/subscriptions/useSubscriptionCollection.ts`](C:\Users\domin\Desktop\Tracker\src\presentation\subscriptions\useSubscriptionCollection.ts) ein,
- startet zusätzlich den globalen History-Sync über [`src/presentation/subscriptions/useSubscriptionHistorySync.ts`](C:\Users\domin\Desktop\Tracker\src\presentation\subscriptions\useSubscriptionHistorySync.ts),
- und berechnet abgeleitete Kennzahlen per `useMemo`.

`useSubscriptionCollection` registriert einen zentralen Listener über `service.observeUserSubscriptions(...)`.

Der konkrete Firestore-Zugriff liegt in [`src/services/firestore/subscriptionFirestore.ts`](C:\Users\domin\Desktop\Tracker\src\services\firestore\subscriptionFirestore.ts), Funktion `subscribeToFirestoreSubscriptions(...)`.

Dort wird eine Live-Query aufgesetzt:

- Collection: `users/{userId}/subscriptions`
- Filter: `where("archivedAt", "==", null)`
- Sortierung: `orderBy("nextPaymentDate", "asc")`
- Technik: `onSnapshot(...)`

Die Service-Schicht dazwischen ist bewusst dünn:

- [`src/application/subscriptions/service.ts`](C:\Users\domin\Desktop\Tracker\src\application\subscriptions\service.ts) mappt die Service-Methoden auf das Repository.
- [`src/services/subscriptionRepository.ts`](C:\Users\domin\Desktop\Tracker\src\services\subscriptionRepository.ts) verweist auf das Infrastruktur-Repository.

### History

Der zentrale Hook für History ist [`src/hooks/useSubscriptionsHistory.ts`](C:\Users\domin\Desktop\Tracker\src\hooks\useSubscriptionsHistory.ts).

Er arbeitet aktuell so:

- Er erhält eine Liste von `subscriptionIds`.
- Die IDs werden stabilisiert (`sort().join("|")`), damit der Effekt nicht unnötig durch andere Array-Reihenfolgen neu startet.
- Für jede Subscription wird ein eigener Live-Listener über `service.observeSubscriptionHistory(...)` registriert.
- Die Events werden pro Subscription in `historyBySubscription` gehalten und anschließend flach als `history` zusammengeführt.

Der konkrete Firestore-Zugriff liegt wieder in [`src/services/firestore/subscriptionFirestore.ts`](C:\Users\domin\Desktop\Tracker\src\services\firestore\subscriptionFirestore.ts), Funktion `subscribeToFirestoreSubscriptionHistory(...)`.

Dort wird pro Subscription ein `onSnapshot(...)` auf `users/{userId}/subscriptions/{subscriptionId}/history` mit `orderBy("createdAt", "desc")` verwendet.

Soft-gelöschte Events werden nicht serverseitig herausgefiltert, sondern im Hook clientseitig entfernt:

- `items.filter((event) => !event.deletedAt)` in `useSubscriptionsHistory`

### Home Screen

Der Home Screen nutzt nicht nur die laufenden Subscriptions, sondern zusätzlich globale History über mehrere Subscriptions:

- [`src/screens/HomeScreen.tsx`](C:\Users\domin\Desktop\Tracker\src\screens\HomeScreen.tsx)

Dort passiert aktuell:

- `useSubscriptions()` lädt die aktiven, nicht archivierten Subscriptions.
- `useSubscriptionsHistory(subscriptions.map((subscription) => subscription.id))` lädt zusätzlich die History aller aktuell geladenen Subscriptions live.
- `buildHomeMonthlySummary(...)` berechnet damit die Header-Werte auf Basis echter History plus offener künftiger Zahlungen.

Das ist fachlich sauber, weil `Bezahlt` im Dashboard auf echten History-Events basiert. Gleichzeitig bedeutet es aber, dass der Home Screen mehr Daten lädt als ein rein listenbasierter Überblick.

### Globaler History-Sync

Der globale Sync wird zentral über [`src/presentation/subscriptions/useSubscriptionHistorySync.ts`](C:\Users\domin\Desktop\Tracker\src\presentation\subscriptions\useSubscriptionHistorySync.ts) angestoßen.

Der Flow:

- Beim ersten erfolgreichen Laden der Subscriptions wird einmal `runGlobalSync()` ausgeführt.
- Zusätzlich wird bei App-Rückkehr aus dem Background erneut synchronisiert, wenn der Cooldown abgelaufen ist.
- Der Cooldown liegt in [`src/presentation/subscriptions/historySync.ts`](C:\Users\domin\Desktop\Tracker\src\presentation\subscriptions\historySync.ts) aktuell bei `8 * 60 * 60 * 1000` Millisekunden.

Der eigentliche Firestore-Teil läuft über:

- `service.syncHistoryForUser(...)` in [`src/application/subscriptions/service.ts`](C:\Users\domin\Desktop\Tracker\src\application\subscriptions\service.ts)
- `syncFirestoreSubscriptionsHistory(...)` in [`src/services/firestore/subscriptionFirestore.ts`](C:\Users\domin\Desktop\Tracker\src\services\firestore\subscriptionFirestore.ts)

Diese Funktion führt aktuell `Promise.all(...)` über alle geladenen Subscriptions aus und ruft für jede Subscription `syncFirestoreSubscriptionHistory(...)` auf.

Innerhalb von `syncFirestoreSubscriptionHistory(...)` wird zuerst die komplette History der jeweiligen Subscription über `readSubscriptionHistory(...)` gelesen. Danach werden fehlende Events über `getMissingPaymentHistoryEvents(...)` bestimmt und per Batch geschrieben.

## 3. Was aktuell schon gut ist

Der jetzige Stand hat bereits mehrere saubere Eigenschaften:

- Subscriptions werden zentral und live geladen statt verteilt in einzelnen Screens.
- Die Firestore-Query für Subscriptions ist fachlich sinnvoll auf `archivedAt == null` begrenzt.
- Listener-Cleanup ist vorhanden.
  In `useSubscriptionCollection` wird der Unsubscribe-Handler des zentralen Subscription-Listeners zurückgegeben.
  In `useSubscriptionsHistory` werden alle History-Unsubscriber gesammelt und im Cleanup sauber aufgerufen.
- Abgeleitete Werte werden an vielen Stellen mit `useMemo` berechnet statt bei jedem Render neu aufgebaut.
  Beispiele: `useSubscriptions.ts`, `HomeScreen.tsx`, `StatsScreen.tsx`, `SavingsScreen.tsx`.
- Der globale Sync hat bereits eine einfache Drosselung über `lastGlobalSyncAt` in AsyncStorage.
- Für kleine bis mittlere Nutzung ist die aktuelle Firestore-Nutzung voraussichtlich unkritisch:
  wenige Subscriptions,
  begrenzte History,
  klarer Live-Abruf,
  nachvollziehbare Datenflüsse.

## 4. Wo später Optimierungsbedarf entstehen kann

### 4.1 Home Screen lädt History zu breit

Der Home Screen lädt aktuell nicht nur die Subscriptions selbst, sondern zusätzlich die History aller geladenen Subscriptions live:

- [`src/screens/HomeScreen.tsx`](C:\Users\domin\Desktop\Tracker\src\screens\HomeScreen.tsx)
- [`src/hooks/useSubscriptionsHistory.ts`](C:\Users\domin\Desktop\Tracker\src\hooks\useSubscriptionsHistory.ts)

Das ist für den aktuellen Stand funktional gut, weil die Monatswerte im Header dadurch auf echter History basieren. Langfristig kann dieser Ansatz aber ineffizient werden:

- Der Home Screen ist ein häufiger Einstiegspunkt.
- Für einen kompakten Überblick werden dabei potenziell viele History-Dokumente geladen.
- Je länger ein Nutzer die App verwendet, desto größer wird genau diese Datenmenge.

Langfristig sollte Home eher mit vorbereiteten oder aggregierten Daten arbeiten, statt komplette Live-History aller Subscriptions zu beobachten.

### 4.2 Globaler History-Sync liest pro Subscription komplette Historie

Der globale Sync läuft aktuell pro Subscription über die komplette History:

- [`src/presentation/subscriptions/useSubscriptionHistorySync.ts`](C:\Users\domin\Desktop\Tracker\src\presentation\subscriptions\useSubscriptionHistorySync.ts)
- [`src/services/firestore/subscriptionFirestore.ts`](C:\Users\domin\Desktop\Tracker\src\services\firestore\subscriptionFirestore.ts)

Konkret:

- `syncFirestoreSubscriptionsHistory(...)` iteriert über alle geladenen Subscriptions.
- `syncFirestoreSubscriptionHistory(...)` liest pro Subscription via `readSubscriptionHistory(...)` die komplette Historie.

Das skaliert funktional korrekt, aber die Kosten steigen mit:

- mehr Subscriptions pro Nutzer,
- längerer Nutzungsdauer,
- mehr History-Events pro Subscription.

Später sollte geprüft werden, ob der Sync inkrementell oder selektiver laufen kann, statt bei jedem Sync-Durchlauf die gesamte History der Subscription erneut zu lesen.

### 4.3 Schreiboperationen lesen vorab oft komplette History

Mehrere Schreiboperationen lesen vor dem Schreiben zunächst die komplette History einer Subscription:

- `createFirestoreManualPayment(...)`
- `updateFirestoreHistoryEvent(...)`
- `deleteFirestoreHistoryEvent(...)`
- `syncFirestoreSubscriptionHistory(...)`

Alle diese Funktionen liegen in [`src/services/firestore/subscriptionFirestore.ts`](C:\Users\domin\Desktop\Tracker\src\services\firestore\subscriptionFirestore.ts).

Funktional ist das aktuell nachvollziehbar:

- Duplikate für manuelle Zahlungen werden gegen die bestehende History geprüft.
- Editierbarkeit und Kollisionsfälle werden anhand realer Events bewertet.
- Fehlende Sync-Events werden aus dem vollständigen Verlauf abgeleitet.

Mit wachsender History wird dieses Muster aber teurer, weil für einzelne fachliche Prüfungen oft mehr Daten gelesen werden als eigentlich nötig.

Spätere Optimierungsoptionen wären:

- gezieltere Prüf-Queries,
- selektive Zeitfenster,
- vorbereitete Metadaten oder Summary-Felder,
- explizite Sync-Anker statt kompletter Verlaufsauswertung.

## 5. Priorisierte spätere Optimierungen

### Priorität 1

Home Screen entlasten:

- möglichst keine komplette Live-History aller Subscriptions auf Home laden
- stattdessen eher aggregierte Werte, Summary-Felder oder gezielte Daten für den Monatsheader nutzen
- History möglichst dort live halten, wo sie fachlich wirklich primär gebraucht wird

### Priorität 2

History-Sync selektiver machen:

- nicht immer komplette History pro Subscription lesen
- stattdessen später auf Delta-, Zeitfenster- oder Stempel-Logik umstellen
- vorhandene Sync-Metadaten oder Anker gezielter nutzen

### Priorität 3

History-bezogene Validierungen gezielter machen:

- bei Aktionen wie manuellen Zahlungen oder Event-Updates nicht pauschal komplette History lesen
- lieber spezifische Queries oder vorbereitete Metadaten verwenden
- besonders dort optimieren, wo nur einzelne fachliche Kollisionen geprüft werden müssen

## 6. Aktuelle Einschätzung für Launch

Der aktuelle Stand ist kein Launch-Blocker.

Für kleine Nutzerzahlen und moderate History ist die Lösung ausreichend:

- der zentrale Subscription-Abruf ist sauber,
- der Datenfluss ist gut nachvollziehbar,
- History und Sync sind fachlich korrekt,
- und die aktuelle Komplexität ist für ein frühes Produktstadium vertretbar.

Die relevanten Optimierungen sind eher spätere Skalierungsmaßnahmen als ein sofortiges Muss.

## 7. Mögliche spätere technische Richtungen

Mögliche spätere Optimierungsrichtungen im bestehenden Projektkontext:

- Summary- oder Aggregate-Felder direkt auf Subscription-Dokumenten oder auf User-Ebene pflegen
- Home mit weniger Listenern und weniger breitem History-Abruf betreiben
- History primär auf Detail-Screens live laden statt global auf Übersichtsseiten
- inkrementellen History-Sync einführen
- gezieltere Firestore-Queries statt vollständiger History-Reads nutzen
- technische Metadaten für letzte verarbeitete Fälligkeit oder letzten Sync-Anker ergänzen

Die aktuelle Architektur ist dafür grundsätzlich geeignet, weil der Datenzugriff bereits zentral über Hooks, Service und Repository organisiert ist.

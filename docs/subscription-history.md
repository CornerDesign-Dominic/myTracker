# Subscription History & Payment Sync Behavior

## Grundprinzip

- Die `Subscription` bleibt die aktuelle Wahrheit eines Abos.
- Die `History` ist eine zusaetzliche Ebene fuer Ereignisse und vergangene Nachvollziehbarkeit.
- Die History wird **nicht** vollstaendig automatisch fuer die gesamte Vergangenheit aufgebaut.
- `payment_booked` bedeutet: die Zahlung wurde tatsaechlich gebucht.
- `payment_skipped_inactive` bedeutet: die Zahlung war faellig, wurde aber wegen eines inaktiven Status ausgesetzt.

## Wichtige Regel

Die automatische Generierung von

- `payment_booked`
- `payment_skipped_inactive`

erfolgt **nur fuer bereits faellige Termine im gueltigen Auto-History-Fenster**.

Kernregel:

- Es wird nur dann automatisch ein Event erzeugt, wenn gleichzeitig gilt:
- `dueDate <= today`
- `dueDate >= createdAt` der Subscription, auf Kalendertag normalisiert

Das bedeutet:

- Zukunft bleibt **Forecast** und wird nicht als echte History angelegt.
- Vor `createdAt` wird **niemals** automatisch History erzeugt.
- Wenn mehrere Monate waehrend Offline-Zeit fehlen, duerfen diese nur innerhalb dieses gueltigen Fensters nachgezogen werden.

## Kein Backfill

Es findet **keine automatische rueckwirkende Erstellung von Zahlungen** statt.

Das gilt auch dann, wenn:

- ein Startdatum in der Vergangenheit liegt
- `nextPaymentDate` in der Vergangenheit liegt
- ein Abo spaeter rueckdatiert wird
- Betrag oder Faelligkeit nachtraeglich geaendert werden

Die automatische Sync-Logik erstellt keine historischen Payment- oder Skipped-Payment-Events fuer Zeitraeume vor `createdAt`.
Zukuenftige Termine werden ebenfalls nicht automatisch als echte History angelegt.

## Payment-Events pro Due Date

Fachlich gilt:

- pro `dueDate` gibt es hoechstens **ein aktives gueltiges Payment-Event**
- entweder `payment_booked`
- oder `payment_skipped_inactive`

Eine Zahlung bleibt dabei **immer derselbe Datensatz**.

Stattdessen:

- Typ, `dueDate`, Betrag und Notiz werden direkt auf demselben Event aktualisiert
- es gibt keine Replace-Ketten und keine `replacedEventId`-/`replacementEventId`-Historie mehr fuer normale Payment-Edits
- wenn ein User dieselbe Zahlung zehnmal bearbeitet, bleibt es fachlich dieselbe Zahlung

## Manuelle Korrekturen und Auto-Sync

Manuelle Korrekturen duerfen spaeteren Auto-Sync nicht kaputt machen.

Das bedeutet:

- manuelle Korrekturen laufen direkt auf dem bestehenden Payment-Datensatz
- Loeschen ist fuer echte Fehlfaelle gedacht, zum Beispiel doppelte oder versehentlich angelegte Zahlungen
- geloeschte Zahlungen werden fuer die Anzeige ausgeblendet
- Auto-Sync richtet sich fachlich nach der letzten noch vorhandenen Payment-Historie
- dadurch darf eine geloeschte **letzte** Zahlung spaeter wieder entstehen, waehrend geloeschte **aeltere** Zahlungen vor der letzten vorhandenen Zahlung normalerweise geloescht bleiben

## Gruende fuer dieses Verhalten

- Vermeidung falscher oder erfundener Historie
- Nutzer koennten alte Daten unvollstaendig oder falsch eingegeben haben
- Das System bleibt deterministisch, kontrollierbar und nachvollziehbar
- Automatische History-Sync soll nur sichere, bereits faellige Termine erfassen
- Zukunft soll sauber Forecast bleiben und nicht mit echter Historie vermischt werden
- Manuelle Korrekturen muessen spaetere Auto-Sync-Laeufe ueberleben

## Statuslogik fuer Auto-Sync

Fuer bereits faellige Termine innerhalb des gueltigen Auto-History-Fensters gilt:

- `active` -> `payment_booked`
- `paused` -> `payment_skipped_inactive`
- `cancelled` -> kein neues Payment-Event

Wichtig:

- `paused` bedeutet voruebergehend ausgesetzt und zaehlt spaeter als Ersparnis
- `cancelled` bedeutet beendet; ab dann werden keine weiteren automatischen Payment- oder Skipped-Events erzeugt

## Monatsend-Logik bei wiederkehrenden Faelligkeiten

Bei monatlichen und quartalsweisen Faelligkeiten gilt ein fester Soll-Tag im Monat.

Wenn dieser Soll-Tag im Zielmonat nicht existiert, wird automatisch der letzte gueltige Tag des Monats verwendet.

Beispiele:

- `31. Januar -> 28./29. Februar`
- `31. Maerz -> 30. April`
- `31. Mai -> 30. Juni`

Wichtig:

- Diese Regel gilt fuer die wiederkehrende Fortschreibung von Faelligkeiten.
- Die Logik verwendet weiter den urspruenglichen Soll-Tag, damit nach einem kurzen Monat wieder korrekt auf spaetere Monatsenden zurueckgesprungen werden kann.

## Konsequenzen

Historie ausserhalb des gueltigen Auto-History-Fensters ist nur vorhanden, wenn sie:

- manuell angelegt wurde
- oder spaeter bewusst durch eine explizite Backfill-Funktion erzeugt wird

Ohne einen solchen expliziten Schritt darf die App keine historischen Zahlungen selbst rekonstruieren.

## Zukuenftige Erweiterung

Spaeter kann die App erweitert werden um:

- manuelles Nachtragen von Zahlungen
- manuelles Nachtragen ausgesetzter Zahlungen
- expliziten Backfill auf bewusste Nutzerentscheidung

Wichtig:

- Ein solcher Backfill darf nicht still oder automatisch beim normalen App-Start passieren.

## Code-Referenz

Die zentrale Regel ist in folgender Datei implementiert:

- [paymentSync.ts](/C:/Users/domin/Desktop/Tracker/src/domain/subscriptionHistory/paymentSync.ts)
- [recurringDates.ts](/C:/Users/domin/Desktop/Tracker/src/utils/recurringDates.ts)

Dort wird die automatische Event-Erzeugung abgebrochen, sobald gilt:

- `dueDate > today`
- oder `dueDate < createdAt`

Der Sync orientiert sich dabei primaer an der zuletzt bekannten fachlichen Kette:

- letzter noch vorhandener gebuchter / ausgesetzter Zahlungstermin
- oder explizit neu gesetzte Faelligkeitsbasis
- erst danach faellt er auf `nextPaymentDate` zurueck

Die wiederkehrende Monatsend-Logik fuer sichtbare und zukuenftige Faelligkeiten liegt zentral in:

- `getRecurringDueDateForMonth(...)`
- `getRecurringDueDateInputForMonth(...)`

## Tests

Dieses Verhalten ist durch Unit Tests abgesichert in:

- [paymentSync.test.ts](/C:/Users/domin/Desktop/Tracker/tests/subscriptionHistory/paymentSync.test.ts)
- [editablePaymentEvents.test.ts](/C:/Users/domin/Desktop/Tracker/tests/subscriptionHistory/editablePaymentEvents.test.ts)

Die Tests pruefen unter anderem:

- keine automatische Erzeugung vor Erreichen des Faelligkeitstags
- Erzeugung am Faelligkeitstag selbst
- keine automatische Erzeugung vor `createdAt`
- `payment_skipped_inactive` nur fuer bereits faellige pausierte Termine
- keine automatische Erzeugung mehr fuer `cancelled`
- kein rueckwirkender Backfill vor `createdAt`
- Mehrmonats-Sync nach Offline-Zeit innerhalb des App-Zeitraums
- Sync orientiert sich an der realen Faelligkeitskette und nicht nur stumpf an `nextPaymentDate`
- direkte Bearbeitung desselben Payment-Datensatzes bei Typwechsel `booked <-> skipped`
- geloeschte letzte Zahlungen duerfen durch spaeteren Sync wieder entstehen

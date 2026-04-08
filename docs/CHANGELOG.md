# Changelog

## Regeln

Diese Datei wird fortlaufend von Codex gepflegt und soll bewusst knapp, lesbar und release-tauglich bleiben.

- Immer den **aktuellen Versionsstand** oben sichtbar halten.
- Neue Eintraege immer **oben** ergaenzen.
- Nur Aenderungen aufnehmen, die fuer Produkt, Release, Build, Backend oder Nutzerverhalten relevant sind.
- Keine kleinen internen Refactors, Formatierungen, Zwischenversuche oder temporaeren Debug-Schritte dokumentieren, wenn sie fachlich nichts aendern.
- Eintraege kurz halten: lieber wenige klare Punkte statt langer Detail-Logs.
- Pro Version nur das erfassen, was am Ende wirklich wichtig ist.
- Dateilisten nur dann nennen, wenn sie fuer das Verstaendnis wirklich helfen.
- Wenn etwas nur mit neuem Build sichtbar wird, kurz dazuschreiben.
- Wenn etwas nur nach Deploy von Functions/Backend aktiv ist, kurz dazuschreiben.
- Keine Duplikate: dieselbe Aenderung spaeter nicht noch einmal anders formuliert eintragen.

## Aktueller Stand

- App-Name: `OctoVault`
- Aktuelle Version: `1.1.3`
- Expo-Slug: `subscription-tracker-mvp`
- Letzte Changelog-Pflege: `2026-04-09`

---

## Version 1.1.3

Stand: `2026-04-09`

### Wichtige Aktualisierungen

- Seite `Alle Abos` visuell auf echte einzelne Abo-Cards umgestellt statt einer grossen Sammelliste in einer Gesamt-Card.
- Card-Layout auf `Alle Abos` neu geordnet: Status sitzt jetzt oben links ueber dem Abo-Icon, Betrag ist in Akzentfarbe direkt unter der Kategorie platziert und das Intervall steht naeher am Betrag in derselben Zeile.
- Meta-Angaben in den `Alle Abos`-Cards vereinfacht: Ueberschriften fuer Betrag und Intervall sowie die Faelligkeit in der Card entfernt; unten rechts fuehrt jetzt ein verlinkter Text `Detailsansicht >` in die Detailseite.

## Version 1.1.2

Stand: `2026-04-09`

### Wichtige Aktualisierungen

- Abo-Detailseite visuell verfeinert: Haupt-Card kompakter gestaltet, Titel kleiner gesetzt und Titel sowie Hauptbetrag in Akzentfarbe hervorgehoben.
- Uebersichts-Card auf der Abo-Detailseite klarer strukturiert: neuer Titel `Uebersicht`, Status jetzt in derselben Kopfzeile und darunter eine Trennlinie.
- Historie-Card in der Abo-Detailseite ausgebaut: zeigt jetzt die letzten drei Eintraege direkt an, inklusive Link `Alle anzeigen & bearbeiten` sowie bereinigter Divider- und Spacing-Logik.

## Version 1.1.1

Stand: `2026-04-09`

### Wichtige Aktualisierungen

- Home-Seite weiter verfeinert: Timeline-Positionen und Datumsmarker in beiden Monatsbloecken optisch nachgezogen, damit die Linien exakt an den Monats-Cards starten und nur durch die zugehoerigen Abo-Listen laufen.
- Home-Abo-Cards weiter verdichtet: Faelligkeit, Intervall und Betragslabel aus den Startseiten-Cards entfernt; Betrag und Chevron jetzt kompakter direkt im Kopfbereich.
- Historie in der Abo-Detailansicht erweitert: die Card zeigt jetzt die letzten drei Historien-Eintraege direkt an, inklusive Link `Alle anzeigen & bearbeiten` zur Vollansicht.

## Version 1.1.0

Stand: `2026-04-08`

### Wichtige Aktualisierungen

- Home-Seite deutlich erweitert: beide Monatsbloecke haben jetzt eine vertikale Timeline zwischen den Abo-Cards, inklusive Datumsmarker nur bei echten Datumswechseln.
- Die Timeline ist visuell in die App integriert: Akzentfarbe, Datumsmarker rechts der Linie und saubere Begrenzung exakt an den Monats-Cards ohne in diese hineinzuragen.
- Home-Abo-Cards kompakter gemacht: Faelligkeit aus den einzelnen Cards entfernt, weil diese Information jetzt ueber die Timeline gefuehrt wird.

## Version 1.0.2

Stand: `2026-04-08`

### Wichtige Aktualisierungen

- Notification-Berechtigung wird jetzt beim ersten echten App-Start vor dem Onboarding direkt ueber den nativen Systemdialog angefragt.
- Premium-Button in den Einstellungen an den normalen App-Standard angeglichen; keine gesonderte Textfarbe mehr in der Premium-Card.
- Interne Ideensammlung als nicht nutzersichtbare Datei ergaenzt, damit kuenftige Produktideen getrennt von Release-Doku und Changelog gepflegt werden koennen.

## Version 1.0.1

Stand: `2026-04-08`

### Wichtige Aktualisierungen

- Home-Startkarte korrigiert: globales Monatslabel wieder auf nur `MMMM` gesetzt und fuer die erste Card eine eigene Datumsanzeige `00.MMMM` eingefuehrt.
- Home-Monatssummen werden wieder aktuell gehalten: der History-Sync reagiert jetzt auch auf spaeter nachgeladene Subscription-Staende statt nur auf den ersten Cache-Stand nach App-Start.
- Daily-Due-Notifications gehaertet: bei Rueckkehr in die App wird die Planung neu aufgebaut, und fehlgeschlagene Planungen blockieren keinen spaeteren Neuversuch mehr.
- Zahlen- und Waehrungsformat vereinheitlicht: `EUR` nutzt `1.234,56`, `Dollar` nutzt `1,234.56`; das gilt jetzt konsistent fuer Anzeigen und Betragseingaben.
- Rechtstexte aktualisiert: die vollstaendige Adresse von Dominic Franz wurde in Impressum sowie an den relevanten Anbieter-/Verantwortlichenstellen ergaenzt.

## Version 1.0.0

Stand: `2026-04-08`

### Aktueller Produktstand

- Local-First v1 fuer Subscriptions, History und Settings mit AsyncStorage, Pending-Queue und Retry bei App-Start/App-Foreground.
- Auth- und Mail-Flows auf Firebase Functions + Resend ausgebaut, inklusive Pending-Registrierung, Passwort-Reset in die App und Bestaetigungsmails.
- Kontaktfunktion als eigener Screen mit Support-Versand und automatischer Eingangs-Mail.
- Daily-Due-Notifications lokal eingebaut, regulaer auf `06:00` gestellt und ohne sichtbare Test-Buttons im Release-UI.
- Premium-Produkt fuer Android auf `octovault_lifetime_premium` vorbereitet; sichtbare Debug-Schalter in den Einstellungen entfernt.
- Branding auf das finale OctoVault-Logo umgestellt. Splash- und Notification-Assets brauchen dafuer einen neuen Build.

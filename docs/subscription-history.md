# Subscription History & Payment Sync Behavior

## Grundprinzip

- Die `Subscription` bleibt die aktuelle Wahrheit eines Abos.
- Die `History` ist eine zusaetzliche Ebene fuer Ereignisse und vergangene Nachvollziehbarkeit.
- Die History wird **nicht** vollstaendig automatisch fuer die gesamte Vergangenheit aufgebaut.

## Wichtige Regel

Die automatische Generierung von

- `payment_booked`
- `payment_skipped_inactive`

erfolgt **nur fuer heute und Zukunft**.

Kernregel:

- Wenn `dueDate < today`, wird **kein Event erzeugt**.

## Kein Backfill

Es findet **keine automatische rueckwirkende Erstellung von Zahlungen** statt.

Das gilt auch dann, wenn:

- ein Startdatum in der Vergangenheit liegt
- `nextPaymentDate` in der Vergangenheit liegt
- ein Abo spaeter rueckdatiert wird
- Betrag oder Faelligkeit nachtraeglich geaendert werden

Die automatische Sync-Logik erstellt keine historischen Payment- oder Skipped-Payment-Events fuer vergangene Zeitraeume.

## Gruende fuer dieses Verhalten

- Vermeidung falscher oder erfundener Historie
- Nutzer koennten alte Daten unvollstaendig oder falsch eingegeben haben
- Das System bleibt deterministisch, kontrollierbar und nachvollziehbar
- Automatische History-Sync soll nur sichere, aktuelle oder zukuenftige Termine erfassen

## Konsequenzen

Historie vor dem heutigen Tag ist nur vorhanden, wenn sie:

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

Dort wird die automatische Event-Erzeugung abgebrochen, sobald gilt:

- `dueDate < today`

## Tests

Dieses Verhalten ist durch Unit Tests abgesichert in:

- [paymentSync.test.ts](/C:/Users/domin/Desktop/Tracker/tests/subscriptionHistory/paymentSync.test.ts)

Die Tests pruefen unter anderem:

- keine automatische Erzeugung fuer vergangene Faelligkeiten
- Erzeugung fuer zukuenftige Faelligkeiten
- `payment_skipped_inactive` nur fuer zukuenftige deaktivierte Termine
- kein rueckwirkender Backfill durch spaetere Aenderungen

# Payment Rules

Diese Datei ist die verbindliche fachliche Quelle fuer Payment-, History- und Sync-Regeln.

## 1) Grundprinzip Payment-Events

- eine Zahlung = genau ein Datensatz
- eine Zahlung wird nicht ersetzt, sondern direkt bearbeitet
- keine Replace-/Kettenlogik
- keine `replacementEventId`
- keine `replacedEventId`
- eine einzelne Zahlung kann mehrfach geaendert werden
- moegliche direkte Aenderungen sind:
- `payment_booked` ↔ `payment_skipped_inactive`
- `dueDate`
- `amount`
- `notes`

## 2) Gueltige Payment-Events

- echte gebuchte Zahlung = `payment_booked`
- ausgesetzte Zahlung wegen inaktivem Status = `payment_skipped_inactive`
- geloeschte Events (`deletedAt`) gelten fachlich nicht mehr als aktiv
- pro `dueDate` soll es fachlich hoechstens ein aktives Payment-Event geben

## 3) Loeschen von Zahlungen

- loescht der User eine Zahlung, wird sie entfernt
- es gibt keine Tombstone-Logik fuer geloeschte Zahlungen
- es gibt keine Suppression-Logik fuer geloeschte Zahlungen
- geloeschte Zahlungen werden nicht kuenstlich vor spaeterem Sync geschuetzt

### Verhalten mit Sync

- loescht der User die letzte vorhandene Zahlung, kann sie beim naechsten Sync wieder entstehen
- loescht der User eine aeltere Zahlung vor der letzten vorhandenen Zahlung, wird sie in der Regel nicht wieder erzeugt
- Grund: Sync arbeitet nur fuer Faelligkeiten nach dem aktuellen Sync-Anker

## 4) Sync-Ausloesung

- Sync wird beim Login ausgelost
- Sync laeuft ueber alle Abos des Users

## 5) Sync-Anker

- primaerer Sync-Anker ist die letzte vorhandene Zahlung
- relevant ist der neueste `payment_booked` oder `payment_skipped_inactive`
- Grundlage ist das `dueDate`
- wenn eine neuere explizite `due_date_changed`-Basis nach der letzten Zahlung existiert, wird diese als neue Sync-Basis verwendet
- wenn noch keine Payment-Historie existiert, wird auf `nextPaymentDate` oder auf `initialNextPaymentDate` aus `subscription_created` zurueckgegriffen

## 6) Sync-Zeitraum

- Sync erzeugt nur fehlende Faelligkeiten nach dem aktuellen Sync-Anker bis heute
- es wird keine komplette Altvergangenheit automatisch erzeugt
- es werden keine zukuenftigen Payment-Events automatisch erzeugt
- Sync erzeugt keine Termine vor `createdAt` der Subscription

## 7) Verhalten pro fehlender Faelligkeit

- `active` → `payment_booked`
- `paused` → `payment_skipped_inactive`
- `cancelled` → kein neues Payment-Event
- der Status wird pro Faelligkeit auf dem jeweiligen Datum bewertet

## 8) Rolle von `nextPaymentDate`

- `nextPaymentDate` ist nicht der normale laufende Sync-Anker
- `nextPaymentDate` dient als Initial-/Fallback-Basis, wenn noch keine Payment-Historie existiert
- bei Intervall- oder Faelligkeitsaenderungen kann `nextPaymentDate` Teil der neuen Basis fuer den weiteren Zyklus sein

## 9) Intervallaenderung

- bei Aenderung des `billingCycle` muss `nextPaymentDate` neu gesetzt oder bestaetigt werden
- dieses Datum ist die neue Basis fuer den kuenftigen Zahlungszyklus
- Sync und weitere Faelligkeiten orientieren sich ab dann an dieser aktualisierten Basis

## 10) Ziele der Logik

- einfache, nachvollziehbare Payment-Historie
- keine versteckten technischen Sonderfaelle
- keine stillen Suppression-Mechaniken
- klare Trennung zwischen:
- echten Zahlungen
- ausgesetzten Zahlungen
- nicht erzeugten Terminen

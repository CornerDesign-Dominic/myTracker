# Payment Rules

## 1) Grundprinzip Payment-Events

- eine Zahlung = genau ein Datensatz
- eine Zahlung wird nicht ersetzt, sondern immer direkt bearbeitet
- keine Replace-/Kettenlogik
- keine `replacementEventId` / `replacedEventId`
- eine Zahlung kann beliebig oft geändert werden
- bezahlt ↔ ausgesetzt
- Datum ändern
- Betrag ändern
- Notiz ändern

## 2) Löschen von Zahlungen

- löscht der User eine Zahlung, wird sie entfernt
- es gibt keine Tombstone- oder Suppression-Logik für Sync
- gelöschte Zahlungen werden nicht künstlich geschützt

### Verhalten im Zusammenspiel mit Sync

- löscht der User die letzte Zahlung, kann sie beim nächsten Sync wieder entstehen
- löscht der User eine ältere Zahlung vor der letzten vorhandenen Zahlung, wird sie nicht wieder erzeugt
- Grund: sie liegt außerhalb des Sync-Zeitraums

## 3) Sync-Auslösung

- Sync wird beim Login ausgelöst
- Sync läuft über alle Abos des Users

## 4) Sync-Logik (zentrale Regel)

- für jedes Abo wird die letzte vorhandene Zahlung bestimmt
- relevant ist der neueste `payment_booked` oder `payment_skipped_inactive`
- Grundlage ist das `dueDate`
- danach wird geprüft, welche Fälligkeiten nach dieser Zahlung bis heute fehlen
- für jede fehlende Fälligkeit wird genau ein Payment-Event erzeugt

## 5) Verhalten nach Status

- `active` → `payment_booked`
- `paused` → `payment_skipped_inactive`
- `cancelled` → kein neues Payment-Event
- `paused` = temporär deaktiviert und kann wieder aktiviert werden
- `cancelled` = beendet und erzeugt keine weiteren Zahlungen oder skipped Events

## 6) Rolle von `nextPaymentDate`

- `nextPaymentDate` ist nicht der primäre Sync-Anker
- `nextPaymentDate` wird nur verwendet, wenn noch keine Payment-Historie existiert
- `nextPaymentDate` wird nur als initiale Basis beim Anlegen oder Reset verwendet
- der normale Sync basiert auf der letzten vorhandenen Zahlung

## 7) Sync-Zeitraum

- Sync läuft von der letzten vorhandenen Zahlung bis heute
- es wird keine komplette Altvergangenheit automatisch erzeugt
- nur der relevante Zeitraum innerhalb der App wird betrachtet

## 8) Statusänderungen von Abos

- Status beeinflusst zukünftige Zahlungen
- aktiv → Zahlungen werden gebucht
- pausiert → Zahlungen werden ausgesetzt (`payment_skipped_inactive`)
- gekündigt → keine weiteren Zahlungen
- der Status wird pro Fälligkeit berücksichtigt

## 9) Intervalländerung

- bei Änderung des `billingCycle` muss `nextPaymentDate` neu gesetzt oder bestätigt werden
- dieses Datum ist die neue Basis für den Zahlungszyklus
- zukünftige Zahlungen werden ab diesem Datum berechnet

## 10) Ziel der Logik

- einfache, nachvollziehbare Payment-Historie
- keine versteckten technischen Sonderfälle
- keine impliziten Suppression-Mechaniken
- klare Trennung zwischen echten Zahlungen, ausgesetzten Zahlungen und keiner künstlichen Rekonstruktion außerhalb des relevanten Zeitraums

## Widersprüche im aktuellen Code

- `src/domain/subscriptionHistory/paymentSync.ts` nutzt neben der letzten vorhandenen Zahlung aktuell auch `due_date_changed` als mögliche neuere Sync-Basis
- `src/domain/subscriptionHistory/paymentSync.ts` fällt auf `subscription.nextPaymentDate` zurück, wenn keine Payment-Historie vorhanden ist; das passt zur Regel, ist aber aktuell nicht als eigener Reset-/Initialfall getrennt modelliert

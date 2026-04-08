# Payment-Regeln

Diese Datei ist die verbindliche fachliche Quelle fuer Payment-, History- und Sync-Regeln.

## Grundregeln

- Eine Zahlung ist genau ein Datensatz.
- Eine bestehende Zahlung wird direkt bearbeitet, nicht ersetzt.
- Es gibt keine Replace-/Kettenlogik.
- Pro `dueDate` soll fachlich hoechstens ein aktives Payment-Event existieren.
- `deletedAt` bedeutet: Event ist nicht mehr aktiv.

## Gueltige aktive Payment-Events

- `payment_booked`
- `payment_skipped_inactive`

## Direkte Aenderungen an einem Payment

Direkt aenderbar sind:

- `type`
- `dueDate`
- `amount`
- `notes`

Mehrere Aenderungen desselben editierbaren Eintrags werden vor dem Sync auf den letzten relevanten Stand verdichtet.

## Delete-Regeln

- Loeschen entfernt das Event fachlich aus der aktiven History.
- Ein lokal geloeschtes Payment darf bei der Duplicate-Pruefung nicht mehr als aktive Zahlung zaehlen.
- `create + delete` vor dem ersten erfolgreichen Sync soll nicht unnoetig in Firestore landen.

## Sync-Regeln

- Sync erzeugt nur fehlende vergangene Faelligkeiten bis heute.
- Der Sync-Anker orientiert sich an der vorhandenen aktiven Payment-History.
- Ohne vorhandene History dient `nextPaymentDate` als Initial-/Fallback-Basis.
- Sync erzeugt keine zukuenftigen Events.

## Status-Regeln

- aktives Abo -> `payment_booked`
- pausiertes Abo -> `payment_skipped_inactive`
- gekuendigtes Abo -> keine weiteren Payment-Events

# Subscription History

Diese Datei beschreibt die History als Daten- und UI-Ebene.
Verbindliche Payment-/Sync-Regeln stehen in [`payment-rules.md`](payment-rules.md).

## Rolle der History

- die Subscription ist der aktuelle Stand eines Abos
- die History ergaenzt diesen Stand um nachvollziehbare Ereignisse
- die History dient fuer:
- Anzeige vergangener Zahlungen
- manuelle Korrekturen einzelner Zahlungen
- Sync-Anker fuer fehlende Faelligkeiten
- Auswertungen auf Basis echter Payment-Events

## Relevante Event-Typen

- `payment_booked`
- `payment_skipped_inactive`
- `subscription_created`
- `subscription_deactivated`
- `subscription_reactivated`
- `amount_changed`
- `billing_cycle_changed`
- `due_date_changed`

## Wichtige Eigenschaften

- Payment-Events koennen direkt bearbeitet werden
- geloeschte Events gelten nicht mehr als aktive History
- Sorting in der UI orientiert sich an Aktualisierung, Erstellungszeit und fachlichem Datum
- die History ist die Basis fuer fachliche Rueckblicke auf echte Zahlungen

## Was diese Datei bewusst nicht festlegt

- keine vollstaendigen Sync-Regeln
- keine Sonderregeln fuer Delete-Verhalten
- keine Statuslogik pro Faelligkeit

Diese Regeln stehen zentral in [`payment-rules.md`](payment-rules.md), damit es nur eine verbindliche Quelle gibt.

# Payments & History

## Rolle der History

- Die Subscription ist der aktuelle Stand eines Abos.
- Die History ergaenzt diesen Stand um Zahlungen und relevante Aenderungen.
- Auswertungen, Kalender und Savings nutzen diese fachliche History.

## Relevante Event-Typen

- `payment_booked`
- `payment_skipped_inactive`
- `subscription_created`
- `subscription_deactivated`
- `subscription_reactivated`
- `amount_changed`
- `billing_cycle_changed`
- `due_date_changed`

## Nutzerfluesse

### Zahlung anlegen

- Zahlungen werden zuerst lokal sichtbar.
- Danach folgt sofort ein Sync-Versuch.
- Bei Offline oder Fehler bleibt der Eintrag lokal pending.

### Zahlung bearbeiten

- Eine Zahlung bleibt derselbe Datensatz.
- Es entsteht keine Replace-Kette.
- Mehrere lokale Aenderungen werden vor dem Sync auf den letzten relevanten Stand verdichtet.

### Zahlung loeschen

- Geloeschte Eintraege gelten lokal nicht mehr als aktive Zahlungen.
- Dadurch blockieren sie keine neue Zahlung fuer denselben `dueDate`.

## Sync-Verhalten

- Sync arbeitet nur fuer vergangene Faelligkeiten bis heute.
- Vorhandene aktive Events fuer denselben `dueDate` werden nicht dupliziert.
- Bei aktivem Abo entsteht `payment_booked`.
- Bei pausiertem Abo entsteht `payment_skipped_inactive`.
- Bei gekuendigtem Abo entstehen keine weiteren Payment-Events.

## Local-First-Hinweis

- Die UI arbeitet auf einer gemergten Sicht aus Remote-Daten und offenen lokalen Aenderungen.
- Dadurch bleiben History und Subscription auch offline fachlich konsistent.
- Lokale Sync-Metadaten duerfen nicht in Firestore landen.

Die verbindlichen Detailregeln stehen in [payments-rules.md](./payments-rules.md).

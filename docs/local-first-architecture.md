# Local-First-Architektur

## Zielbild im aktuellen Build

Firestore bleibt der primaere persistente Speicher. Lokal dient das Geraet als Arbeitskopie, Cache, Pending-Queue und Retry-Puffer.

## Bereits umgesetzt

### Subscriptions

- lokale Arbeitskopie mit AsyncStorage
- Outbox fuer offene Aenderungen
- sofort sichtbare lokale Aenderungen
- anschliessend direkter Sync-Versuch
- Retry bei App-Start und App-Foreground

### History

- manuelle Payment-Aenderungen laufen ebenfalls Local-First
- lokale Merged View aus Remote-Stand und Pending-Aenderungen
- Duplicate-Pruefung arbeitet gegen die effektive aktive lokale History
- lokale Change-Events fuer relevante Subscription-Aenderungen sind sichtbar, bevor Firestore bestaetigt

### Settings

- `language`
- `currency`
- `theme`
- `weekStart`
- `notificationsEnabled`
- `accentColor`

Jede dieser Einstellungen wird einzeln lokal gespeichert und einzeln synchronisiert. Es gibt bewusst keine Buendelung mehrerer Settings in einen Sammel-Write.

## Was das fuer die UI bedeutet

- Nutzer sehen sofort den letzten relevanten Stand.
- Pending-/Retry-Zustaende koennen lokal sichtbar bleiben, bis Firestore bestaetigt.
- Offline-Aenderungen ueberleben App-Neustarts.

## Bewusst einfach gehalten

- kein SQLite
- keine komplexe Mehrgeraete-Konfliktlogik
- keine grosse Background-Sync-Engine
- Fokus auf robuste v1 mit AsyncStorage

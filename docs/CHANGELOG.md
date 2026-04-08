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
- Aktuelle Version: `1.0.0`
- Expo-Slug: `subscription-tracker-mvp`
- Letzte Changelog-Pflege: `2026-04-08`

---

## Version 1.0.0

Stand: `2026-04-08`

### Aktueller Produktstand

- Local-First v1 fuer Subscriptions, History und Settings mit AsyncStorage, Pending-Queue und Retry bei App-Start/App-Foreground.
- Auth- und Mail-Flows auf Firebase Functions + Resend ausgebaut, inklusive Pending-Registrierung, Passwort-Reset in die App und Bestaetigungsmails.
- Kontaktfunktion als eigener Screen mit Support-Versand und automatischer Eingangs-Mail.
- Daily-Due-Notifications lokal eingebaut, regulaer auf `06:00` gestellt und ohne sichtbare Test-Buttons im Release-UI.
- Premium-Produkt fuer Android auf `octovault_lifetime_premium` vorbereitet; sichtbare Debug-Schalter in den Einstellungen entfernt.
- Branding auf das finale OctoVault-Logo umgestellt. Splash- und Notification-Assets brauchen dafuer einen neuen Build.

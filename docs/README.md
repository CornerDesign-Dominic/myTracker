# Docs Uebersicht

Kompakter Einstieg in die Projektdokumentation von OctoVault.

## Aktueller Stand

- App-Name: `OctoVault`
- Version: `1.1.0`
- Expo-Slug: `subscription-tracker-mvp`
- Android-Paket: `com.cornerdesign.mytracker`

## Schnell finden

- [CHANGELOG.md](./CHANGELOG.md) - kompakte Release- und Aenderungshistorie
- [auth-email-flows.md](./auth-email-flows.md) - Login, Registrierung, Passwort-Reset und System-Mails
- [payments-overview.md](./payments-overview.md) - Payment-History, Sync-Verhalten und Nutzerfluesse
- [payments-rules.md](./payments-rules.md) - verbindliche fachliche Payment-Regeln
- [local-first-architecture.md](./local-first-architecture.md) - aktueller Local-First-Stand fuer Daten und Settings
- [release-readiness.md](./release-readiness.md) - Build-, Firebase-, Play-Store- und Release-relevanter Stand
- [firebase-crashlytics.md](./firebase-crashlytics.md) - Crashlytics-Status und Testhinweise
- [design-system.md](./design-system.md) - visuelle Leitlinien

## Leseregel

Wenn sich zwei Dateien ueberschneiden, gilt:

1. `payments-rules.md` ist die fachlich verbindliche Quelle fuer Payments.
2. `auth-email-flows.md` ist die fachlich verbindliche Quelle fuer Auth- und Mail-Flows.
3. `CHANGELOG.md` beschreibt nur wichtige Aenderungen, nicht jede interne Umsetzung.

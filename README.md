# OctoVault

Schlanke Expo-/React-Native-App zur Verwaltung von Abonnements mit Firebase Auth, Firestore, Payment-History, Local-First-Sync und lokalem Fallback fuer schwaches Netz oder Offline-Situationen.

## Projektueberblick

- Uebersicht ueber aktive und inaktive Abos
- Kalender-, Statistik- und Verwaltungsansichten
- Formulare zum Anlegen, Bearbeiten und Nachpflegen von Abos
- Payment-History mit gebuchten und ausgesetzten Zahlungen
- Local-First fuer Subscriptions, History und Settings
- Sync fuer fehlende vergangene Payment-Events bis heute
- Firebase Auth mit anonymem Start sowie E-Mail-/Passwort-Login
- Pending-Registrierung, Passwort-Reset in die App und System-Mails ueber Firebase Functions
- lokale Daily-Due-Notifications
- Premium-Lifetime-Kauf fuer Android vorbereitet
- Fallback auf lokale Mock-/Seed-Daten, wenn Firebase nicht konfiguriert ist

## Setup

1. Abhaengigkeiten installieren

```bash
npm install
```

2. `.env` anlegen

```bash
Copy-Item .env.example .env
```

3. Firebase-Werte in `.env` eintragen

4. App starten

```bash
npm run start
```

Optional:

```bash
npm run android
npm run ios
npm run web
```

## Umgebungsvariablen

Die App nutzt Expo Public Env Variablen:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
```

Wenn diese Werte fehlen, arbeitet die App mit lokalen Seed-Daten weiter. Das ist fuer UI- und Flow-Entwicklung beabsichtigt.

## Firebase und Datenmodell

- Auth nutzt persistente Speicherung ueber `@react-native-async-storage/async-storage`
- Nutzer starten anonym und koennen spaeter auf E-Mail + Passwort aufgewertet werden
- Firestore-Daten liegen user-bezogen unter:

```text
users/{userId}
users/{userId}/settings/app
users/{userId}/subscriptions/{subscriptionId}
users/{userId}/subscriptions/{subscriptionId}/history/{eventId}
```

- Abos werden ueber `archivedAt` soft archiviert

## Local-First in Kurzform

- Firestore bleibt der primaere persistente Speicher.
- Lokal haelt die App eine Arbeitskopie, Pending-Queue und Retry-Basis.
- Aenderungen an Subscriptions, History und Settings wirken sofort lokal.
- Wenn kein Netz verfuegbar ist, bleiben Aenderungen erhalten und werden spaeter erneut synchronisiert.

## Scripts

- `npm run start` startet Expo
- `npm run android` startet Android
- `npm run ios` startet iOS
- `npm run web` startet Web
- `npm run lint` fuehrt `tsc --noEmit` aus

## Architektur in Kurzform

- `src/context/` enthaelt globalen Auth- und Settings-State
- `src/screens/` bildet die App-Screens
- `src/components/` enthaelt wiederverwendbare UI-Bausteine
- `src/domain/` kapselt fachliche Regeln fuer Subscriptions, History und Statistik
- `src/services/` und `src/infrastructure/` binden Firestore, Local-First-Stores und Sync an
- `src/hooks/` verbindet Domain-Logik mit der UI
- `src/theme/` enthaelt Design-Tokens und gemeinsame Pattern

## Payment- und Sync-Logik

Kurzfassung:

- Payment-History besteht aus echten Events wie `payment_booked` und `payment_skipped_inactive`
- Sync erzeugt fehlende vergangene Payment-Events bis heute
- der normale Sync orientiert sich primaer an der letzten vorhandenen Payment-Historie
- `nextPaymentDate` dient als Initial-/Fallback-Basis, wenn noch keine Payment-History existiert

Die verbindlichen Regeln stehen in den Dateien unter `docs/`.

## Weiterfuehrende Doku

- [`docs/README.md`](docs/README.md) - kompakter Doku-Index
- [`docs/payments-rules.md`](docs/payments-rules.md) - verbindliche Payment-/Sync-Regeln
- [`docs/payments-overview.md`](docs/payments-overview.md) - Payments, History und Nutzerfluesse
- [`docs/auth-email-flows.md`](docs/auth-email-flows.md) - Registrierung, Login, Passwort-Reset und Mail-Flows
- [`docs/local-first-architecture.md`](docs/local-first-architecture.md) - aktueller Local-First-Stand
- [`docs/firebase-crashlytics.md`](docs/firebase-crashlytics.md) - Crashlytics-Status und Testschritte
- [`docs/design-system.md`](docs/design-system.md) - visuelle Regeln und UI-System
- [`docs/release-readiness.md`](docs/release-readiness.md) - Build-, Play-Store- und Release-Status

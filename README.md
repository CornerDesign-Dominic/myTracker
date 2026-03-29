# Tracker

Schlanke Expo-/React-Native-App zur Verwaltung von Abonnements mit Firebase Auth, user-bezogener Firestore-Datenhaltung, Payment-History und Sync fuer fehlende Faelligkeiten.

## Projektueberblick

- Uebersicht ueber aktive und inaktive Abos
- Kalender-, Statistik- und Verwaltungsansichten
- Formulare zum Anlegen, Bearbeiten und Nachpflegen von Abos
- Payment-History mit gebuchten und ausgesetzten Zahlungen
- Sync fuer fehlende vergangene Payment-Events bis heute
- Firebase Auth mit anonymem Start sowie E-Mail-/Passwort-Login
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
- `src/services/` und `src/infrastructure/` binden Firestore und lokale Stores an
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

- [`docs/payment-rules.md`](docs/payment-rules.md) - verbindliche Payment-/Sync-Regeln
- [`docs/payment-flows.md`](docs/payment-flows.md) - fachliche Flows aus Produkt-/User-Sicht
- [`docs/subscription-history.md`](docs/subscription-history.md) - Event-Modell und History-spezifische Hinweise
- [`docs/crashlytics.md`](docs/crashlytics.md) - vorbereitete Crashlytics-Integration und echte Testschritte
- [`docs/design-system.md`](docs/design-system.md) - visuelle Regeln und UI-System

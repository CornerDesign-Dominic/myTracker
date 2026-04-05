# Dev Build Readiness

## Vorbereitet

- `app.config.ts` ersetzt die starre `app.json` und buendelt Branding, Splash, Deep-Link-Scheme, Android App Links, Notifications und Plugins.
- Branding ist auf `OctoVault` vorbereitet. Platzhalter-Assets liegen unter `assets/app/`.
- Deep Links sind zentral vorbereitet: `reset-password`, `confirm-email`, `purchase-success`, `purchase-cancelled`, `open-subscription/:subscriptionId`.
- `expo-notifications` ist integriert. Notification-Channels, Permission-/Token-/Scheduling-Services und Debug-Helper sind angelegt.
- Billing ist als Lifetime-Premium-Modell vorbereitet. Legacy-Kaufdaten bleiben fuer Restore und Bestandsnutzer lesbar.
- Analytics-Wrapper und Event-Konstanten sind vorbereitet. Crashlytics bleibt die bestehende Fehlerbasis.
- Ein kleiner `secureStorage`-Adapter ist vorhanden, aber bewusst nicht in Firebase Auth eingeklinkt.

## Vor Dem Naechsten Dev Build Noch Extern Noetig

- Finale App-Bilder fuer `assets/app/octovault-icon.png`, `assets/app/octovault-adaptive-icon.png`, `assets/app/octovault-splash-icon.png`, `assets/app/octovault-notification-icon.png`.
- Optional finale Universal-Link-/App-Link-Domain in `EXPO_PUBLIC_APP_LINK_HOST`.
- Google-Play-One-Time-Produkt fuer `octovault_lifetime_premium` anlegen.
- Push-Credentials/FCM fuer Expo Notifications und spaetere serverseitige Push-Zustellung einrichten.
- Falls Analytics produktiv senden soll: finalen Adapter und Consent-UX anschliessen.

## Danach Ohne Neuen Native Build Gut Weiterbaubar

- Finaler Reset-Password-, Confirm-Email- und Purchase-Return-UX in React Navigation.
- Reminder-Produktlogik, Scheduling-Regeln und In-App-Debug-Entry-Points.
- Finale Premium-Screens, Restore-UX, Kauftexte und Entitlement-Darstellung.
- Backend-Anbindung fuer Push-Token-Registrierung, serverseitige Push-Ausloesung und Kaufverifikation.
- Analytics-Consent, Event-Mapping und Dashboard-Anbindung.

## Bewusst Offen Gelassen

- Keine Aenderung an `src/firebase/config.ts` oder am anonymen Firebase-Persistenzverhalten.
- Keine aggressive Secure-Storage-Migration fuer Auth.
- Keine fertige Reminder-Engine und keine Fake-Serverlogik fuer Push oder Billing.
- iOS Universal Links bleiben neutral vorbereitet, bis die finale Domain feststeht.

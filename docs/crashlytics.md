# Crashlytics

Crashlytics ist im Projekt vorbereitet über:

- `@react-native-firebase/app`
- `@react-native-firebase/crashlytics`
- Expo Config Plugins in `app.json`

## Bereits vorbereitet

- Android `googleServicesFile` ist in `app.json` gesetzt
- Crashlytics ist zentral gekapselt in `src/services/crashlytics/crashlytics.ts`
- Firestore-Fehler laufen zusätzlich in Crashlytics ein
- die aktuelle Firebase Auth `uid` wird als Crashlytics User ID gesetzt

## Was noch real getestet werden muss

- nativer Android Build über EAS oder Development Build
- App auf echtem Android-Gerät starten
- einen echten nicht-fatalen Fehlerpfad auslösen und in Firebase Crashlytics prüfen
- optional einen Test-Crash nur in einem Test-Build auslösen

## Wichtig

- Expo Go reicht für Crashlytics nicht
- Verifikation ist erst mit nativer App sinnvoll

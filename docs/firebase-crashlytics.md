# Firebase Crashlytics

## Aktueller Stand

Crashlytics ist im Projekt vorbereitet und in die native Konfiguration eingebunden.

- `@react-native-firebase/app`
- `@react-native-firebase/crashlytics`
- `google-services.json` ist im Android-Build verknuepft
- Expo Config laeuft ueber `app.config.ts`

## Bereits eingebunden

- Crashlytics-Service ist zentral gekapselt.
- Firestore-Fehler koennen zusaetzlich dorthin gemeldet werden.
- Die aktuelle Firebase-UID wird als Crashlytics User ID gesetzt.

## Wichtig fuer echte Verifikation

- Expo Go reicht nicht.
- Aussagekraeftig ist nur ein nativer Android-Build.
- Der Test sollte auf einem echten Geraet oder mindestens einem nativen Build erfolgen.

## Manuell pruefen

1. Android-Build installieren.
2. App starten und einloggen.
3. Einen echten nicht-fatalen Fehlerpfad ausloesen.
4. In Firebase Crashlytics pruefen, ob das Event ankommt.

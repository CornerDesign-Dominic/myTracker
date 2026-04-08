# Release Readiness

## Aktueller Repo-Stand

- App-Name: `OctoVault`
- Version: `1.0.1`
- Expo-Slug: `subscription-tracker-mvp`
- Android-Paket: `com.cornerdesign.mytracker`
- zentrale Native-Konfiguration ueber `app.config.ts`

## Android / Firebase

- `google-services.json` ist vorhanden
- `android.googleServicesFile` ist gesetzt
- Paketname und Firebase-Konfiguration passen zusammen

## Notifications

- lokale Daily-Due-Notifications sind eingebaut
- regulaere Uhrzeit: `06:00`
- Navigation oeffnet den Kalender mit Tagesfokus
- Debug-Testbuttons sind aus der Settings-UI entfernt

## Premium / Billing

- Android-Lifetime-Produkt im Code: `octovault_lifetime_premium`
- Legacy-SKU fuer Restore bleibt lesbar
- sichtbare Premium-Debug-Schalter sind aus der Settings-UI entfernt
- fuer echte Kauefe bleibt die Google Play Console weiterhin zwingend noetig

## Branding

- finale OctoVault-Logos sind im Repo hinterlegt
- Splash- und Notification-Assets nutzen das finale Branding
- Aenderungen an nativen Assets werden erst nach neuem Build sichtbar

## Mail / Backend

- System-Mails laufen ueber Firebase Functions + Resend
- Kontakt-Mails sind auf Support-Konfiguration getrennt
- direkte sichtbare Links statt Button-CTAs in System-Mails
- fuer live wirksame Function-Aenderungen ist ein Functions-Deploy noetig

## Vor Release weiter ausserhalb des Repos pruefen

- Google Play Produkt in der Play Console
- Internal-Testing-Kaufpfad
- Resend-Domain und Mail-Absender
- nativer Android-Build mit finalen Assets

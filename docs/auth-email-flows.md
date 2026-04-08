# Auth & E-Mail-Flows

## Aktueller Stand

Die App nutzt Firebase Auth mit anonymem Start. Registrierung, Passwort-Reset und mehrere System-Mails laufen serverseitig ueber Firebase Functions und Resend.

## Auth-Flow

- App startet mit anonymem Firebase-User.
- Spaeteres Upgrade auf E-Mail + Passwort erfolgt kontrolliert ueber den Pending-Registration-Flow.
- Login mit E-Mail + Passwort bleibt ein normaler Firebase-Login.

## Registrierung

- `registrationStart` startet eine Pending-Registrierung.
- Die Bestaetigungs-Mail wird ueber Resend versendet.
- Nach Link-Klick wird die Registrierung serverseitig bestaetigt.
- Die App finalisiert danach die Verknuepfung mit Passwort.

## Passwort setzen und aendern

- Nach erfolgreicher Konto-Verknuepfung kann der Nutzer sein Passwort normal aendern.
- Nach erfolgreicher Passwort-Aenderung wird eine Bestaetigungs-Mail ueber `accountMailEvent` ausgelost.

## Passwort vergessen / Passwort neu setzen

- Der Reset laeuft nicht mehr ueber den alten direkten Firebase-Standardpfad im UI.
- Die App nutzt dafuer serverseitige Endpunkte:
  - `passwordResetStart`
  - `passwordResetOpen`
- Der Link fuehrt per Deep Link in die App auf den Reset-Screen.
- Dort wird das neue Passwort doppelt eingegeben und bestaetigt.
- Danach wird eine Abschluss-Mail fuer das erfolgreiche Zuruecksetzen versendet.

## Besonderheit ohne gesetztes Passwort

- Auch bestaetigte Konten ohne bisher gesetztes Passwort koennen ueber denselben Reset-Flow ein Passwort setzen.
- Der Nutzer muss dafuer nicht zuerst einen klassischen Login geschafft haben.

## Kontakt-Mails

- Der Kontakt-Screen sendet intern ueber `contactSubmit`.
- Es geht eine interne Support-Mail raus.
- Zusaetzlich erhaelt der Nutzer eine Eingangsbestaetigung.

## Mail-Darstellung

- System-Mails verwenden keine Buttons mehr.
- Wichtige Aktionen werden ueber direkte sichtbare Links dargestellt.
- Das erhoeht Robustheit in restriktiven Mailclients.

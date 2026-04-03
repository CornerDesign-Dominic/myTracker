# E-Mail- und Registrierungs-Flow

## 1. Überblick

Die App startet mit einem anonymen Firebase-Auth-User. Solange der User anonym ist, werden seine Daten lokal und in Firestore unter seiner anonymen UID geführt, ohne dass bereits ein E-Mail/Passwort-Konto existiert. Wenn der User in der App auf Registrieren klickt, wird keine direkte Kontoerstellung durchgeführt. Stattdessen startet die App eine "pending registration", die eine E-Mail-Adresse prüft, eine Bestätigungs-Mail versendet und einen temporären Pending-Status im User-Dokument speichert.

Nach dem Klick auf den Bestätigungslink wird der Pending-Status serverseitig auf `confirmed` gesetzt. Die App erkennt diese Änderung über einen Firestore-Listener und bietet anschließend die Finalisierung an. Erst dann wird per `linkWithCredential(...)` aus dem anonymen User ein dauerhaftes Firebase-E-Mail/Passwort-Konto. Der Passwort-Reset ist davon getrennt und nutzt direkt `sendPasswordResetEmail(...)` aus Firebase Auth.

## 2. Architektur

Am Flow sind folgende Teile beteiligt:

- App (React Native / Expo): Startet Registrierung, zeigt Pending-Status an, reagiert auf Firestore-Updates, finalisiert die Verknüpfung und bietet Passwort-Reset an.
- Firebase Auth: Verwaltet den anonymen Einstieg, das spätere `email/password`-Login, `linkWithCredential(...)` und `sendPasswordResetEmail(...)`.
- Firestore: Speichert im User-Dokument den aktuellen `pendingRegistration`-Status für den anonymen Benutzer.
- Firebase Functions: Stellen die serverseitigen Schritte bereit.
- `registrationStart`: Prüft den anonymen Caller, validiert die E-Mail, erzeugt Token und sendet die Bestätigungs-Mail.
- `registrationResend`: Sendet für eine bestehende Pending-Registrierung eine neue Bestätigungs-Mail.
- `registrationConfirm`: Wird über den Link im Browser aufgerufen und setzt den Pending-Status auf `confirmed`.
- `registrationFinalize`: Gibt bei bestätigter Registrierung die E-Mail für die finale Verknüpfung an die App zurück.
- Resend: Externer Mail-Service, der die Bestätigungs-Mail über die HTTP-API versendet.

## 3. Pending Registration Flow (Step-by-Step)

1. Der User klickt in der App auf Registrieren. Das passiert in [RegisterScreen.tsx](/Users/domin/Desktop/Tracker/src/screens/RegisterScreen.tsx).
2. `RegisterScreen` ruft `startPendingRegistration(email)` aus [AuthContext.tsx](/Users/domin/Desktop/Tracker/src/context/AuthContext.tsx) auf.
3. `AuthContext` prüft zuerst lokal über `fetchSignInMethodsForEmail(...)`, ob bereits ein Login-Verfahren für diese E-Mail existiert. Falls ja, wird `auth/email-already-in-use` geworfen.
4. Danach wird vom aktuellen anonymen User ein Firebase-ID-Token via `currentUser.getIdToken()` geholt.
5. Dieses Token wird zusammen mit der E-Mail per `fetch(...)` an `https://europe-west1-mytracker-0.cloudfunctions.net/registrationStart` gesendet. Der HTTP-Client dafür liegt in [pendingRegistrationApi.ts](/Users/domin/Desktop/Tracker/src/services/auth/pendingRegistrationApi.ts).
6. Die Function `registrationStart` in [functions/index.js](/Users/domin/Desktop/Tracker/functions/index.js) liest den `Authorization: Bearer <token>`-Header, verifiziert das ID-Token und erlaubt nur anonyme Nutzer.
7. Die Function validiert die E-Mail-Adresse und prüft zusätzlich serverseitig über `auth.getUserByEmail(...)`, ob die E-Mail bereits belegt ist.
8. Danach wird ein zufälliges Bestätigungs-Token erzeugt, gehasht und als Dokument in `registrationConfirmations/{tokenHash}` gespeichert.
9. Zusätzlich speichert `registrationStart` im Firestore-User-Dokument unter `users/{uid}` ein `pendingRegistration`-Objekt mit Status und Ablaufzeit.
10. Anschließend versendet die Function eine E-Mail über Resend. Der Bestätigungslink zeigt auf `registrationConfirm?token=...`.
11. Nach erfolgreicher Function-Antwort setzt die App lokal ebenfalls `pendingRegistration` im User-Dokument, damit der Status sofort sichtbar ist.
12. Klickt der User im Browser auf den Link, ruft er `registrationConfirm` auf. Diese Function prüft Token, Ablaufzeit und den aktuellen Pending-Status.
13. Wenn alles passt, setzt `registrationConfirm` im User-Dokument den Status auf `confirmed` und markiert auch das Token-Dokument als verwendet.
14. Die App hört über `subscribeToUserDocument(...)` auf Änderungen am User-Dokument. Dadurch wechselt der Pending-Status automatisch von `pending` zu `confirmed`.
15. In [SettingsScreen.tsx](/Users/domin/Desktop/Tracker/src/screens/SettingsScreen.tsx) kann der User danach die Registrierung abschließen und ein Passwort festlegen.
16. `completePendingRegistration(password)` in [AuthContext.tsx](/Users/domin/Desktop/Tracker/src/context/AuthContext.tsx) ruft zuerst `registrationFinalize` auf.
17. `registrationFinalize` prüft serverseitig erneut, ob überhaupt eine Pending-Registrierung vorliegt, ob sie `confirmed` ist, ob sie noch nicht abgelaufen ist und ob die E-Mail inzwischen nicht anderweitig belegt wurde.
18. Ist alles gültig, liefert die Function die bestätigte E-Mail an die App zurück.
19. Die App ruft danach `upgradeAnonymousAccount(...)` auf, erstellt `EmailAuthProvider.credential(email, password)` und verknüpft den aktuellen anonymen User per `linkWithCredential(...)`.
20. Nach erfolgreicher Verknüpfung entfernt die App `pendingRegistration` wieder aus dem User-Dokument.

## 4. Datenstruktur

Die Pending-Daten liegen im Firestore-Dokument `users/{uid}`. Die Typdefinition steht in [userFirestore.ts](/Users/domin/Desktop/Tracker/src/services/firestore/userFirestore.ts).

Das Objekt hat aktuell folgende Struktur:

- `status`: `"pending" | "confirmed" | "cancelled" | "expired"`
- `pendingEmail`: die E-Mail-Adresse, die bestätigt werden soll
- `startedAt`: ISO-Zeitstempel des Starts
- `expiresAt`: ISO-Zeitstempel des Ablaufs
- `lastRequestedAt`: ISO-Zeitstempel der letzten Bestätigungs-Mail
- `confirmedAt`: optional, wenn die E-Mail bestätigt wurde
- `cancelledAt`: optional, wenn der Vorgang abgebrochen wurde

Die Daten werden an mehreren Stellen geschrieben:

- Serverseitig in `registrationStart`, `registrationResend`, `registrationConfirm` und `registrationFinalize` in [functions/index.js](/Users/domin/Desktop/Tracker/functions/index.js)
- Clientseitig über `updateUserPendingRegistration(...)` in [userFirestore.ts](/Users/domin/Desktop/Tracker/src/services/firestore/userFirestore.ts)

Zusätzlich gibt es die Collection `registrationConfirmations`. Dort speichert die Function pro Bestätigungslink ein Dokument unter `registrationConfirmations/{tokenHash}` mit `uid`, `email`, `status`, `createdAt`, `expiresAt` und später `usedAt`.

## 5. E-Mail-System (Resend)

Die Bestätigungs-Mail wird aktuell ohne zusätzliche SDK direkt über die Resend-HTTP-API versendet. Der relevante Code liegt in `sendConfirmationEmail(...)` in [functions/index.js](/Users/domin/Desktop/Tracker/functions/index.js).

Die Function ruft dafür `fetch("https://api.resend.com/emails", { ... })` auf und sendet:

- `Authorization: Bearer <RESEND_API_KEY>`
- `Content-Type: application/json`
- `from`
- `to`
- `subject`
- `html`

Benötigte ENV-Variablen im aktuellen Code:

- `RESEND_API_KEY`: zwingend notwendig für den API-Aufruf
- `REGISTRATION_MAIL_FROM`: zwingend notwendig für den `from`-Header
- `REGISTRATION_CONFIRMATION_URL`: optional; wenn nicht gesetzt, wird `https://europe-west1-mytracker-0.cloudfunctions.net/registrationConfirm` verwendet

Eine Vorlage liegt in [functions/.env.example](/Users/domin/Desktop/Tracker/functions/.env.example).

Für den Versand sind aus dem aktuellen Setup praktisch folgende Voraussetzungen nötig:

- Die Absenderdomain muss bei Resend verifiziert sein.
- `REGISTRATION_MAIL_FROM` muss im Format `Name <email@domain>` gesetzt sein, weil dieser Wert unverändert an Resend weitergereicht wird.
- `RESEND_API_KEY` muss gültig sein und zur Resend-Umgebung passen.

## 6. Fehlerfälle & Handling

Typische Fehler im aktuellen System:

- `missing-auth-token`: Wenn der Bearer-Header fehlt.
- `registration-requires-anonymous-user`: Wenn kein anonymer Firebase-User die Function aufruft.
- `invalid-email`: Wenn die E-Mail serverseitig nicht dem einfachen Regex entspricht.
- `auth/email-already-in-use`: Wenn die E-Mail bereits vergeben ist.
- `registration-mail-not-configured`: Wenn `RESEND_API_KEY` oder `REGISTRATION_MAIL_FROM` fehlen.
- `registration-mail-send-failed`: Wenn Resend den Versand ablehnt, z. B. wegen ungültigem API-Key, nicht verifizierter Domain oder ungültigem `from`-Feld.
- `registration-not-pending`: Wenn `registrationResend` aufgerufen wird, obwohl kein offener Pending-Status existiert.
- `pending-registration-missing`: Wenn `registrationFinalize` keine Pending-Daten findet.
- `pending-registration-not-confirmed`: Wenn finalisiert werden soll, obwohl die E-Mail noch nicht bestätigt wurde.
- `pending-registration-expired`: Wenn die Registrierung abgelaufen ist.

Backend-Verhalten:

- Die Functions antworten mit JSON im Format `{ error: { code, message } }`.
- `registrationStart`, `registrationResend` und `registrationFinalize` mappen bekannte Fehler auf passende HTTP-Statuscodes.
- Wenn der Mail-Versand in `registrationStart` fehlschlägt, räumt die Function die zuvor geschriebenen Pending-Daten und das Token-Dokument wieder auf.
- Resend-Fehler werden in den Function-Logs mit Response-Body geloggt.

Client-Verhalten:

- [pendingRegistrationApi.ts](/Users/domin/Desktop/Tracker/src/services/auth/pendingRegistrationApi.ts) liest bei Fehlern jetzt `status`, `body`, `contentType`, `error.code` und `error.message` aus der HTTP-Antwort.
- [AuthContext.tsx](/Users/domin/Desktop/Tracker/src/context/AuthContext.tsx) loggt bei Pending-Fehlern zusätzlich `code`, `status` und `body`.
- [RegisterScreen.tsx](/Users/domin/Desktop/Tracker/src/screens/RegisterScreen.tsx) behandelt `auth/email-already-in-use` speziell und zeigt sonst den Fehlercode im UI mit an.
- [SettingsScreen.tsx](/Users/domin/Desktop/Tracker/src/screens/SettingsScreen.tsx) behandelt beim Finalisieren gezielt `auth/email-already-in-use`, `pending-registration-not-confirmed` und `pending-registration-expired`.

Zu den konkret angefragten Resend-Fällen gilt im aktuellen Code:

- Invalid API key: führt voraussichtlich zu `registration-mail-send-failed`.
- Domain not verified: führt voraussichtlich zu `registration-mail-send-failed`.
- Invalid from field: führt voraussichtlich zu `registration-mail-send-failed`.
- Registration not pending: führt bei `registrationResend` zu `registration-not-pending`.

Die genaue Resend-Fehlermeldung landet im Function-Log, der Client bekommt den normierten Fehlercode zurück.

## 7. Passwort-Reset

Der Passwort-Reset ist in [LoginScreen.tsx](/Users/domin/Desktop/Tracker/src/screens/LoginScreen.tsx) eingebunden. Dort ruft `handlePasswordReset()` die Methode `requestPasswordReset(email)` aus [AuthContext.tsx](/Users/domin/Desktop/Tracker/src/context/AuthContext.tsx) auf.

`requestPasswordReset(...)` nutzt direkt `sendPasswordResetEmail(auth, trimmedEmail)` aus Firebase Auth. Es gibt dafür keine eigene Cloud Function, keinen Firestore-Pending-Status und kein Resend. Der Flow unterscheidet sich also klar von der Registrierung:

- Registrierung: eigener mehrstufiger Pending-Flow mit anonymer Session, Firestore-Status und Functions
- Passwort-Reset: direkter Firebase-Auth-Standardfluss

Im aktuellen Code ist kein Deep Link in die App dafür erforderlich, weil die App nur den Versand des Reset-Links anstößt. Die eigentliche Passwort-Zurücksetzung wird von Firebase über den per E-Mail zugestellten Link außerhalb des App-Flows abgewickelt. In `LoginScreen` wird `auth/user-not-found` absichtlich wie ein Erfolg behandelt, damit kein Unterschied in der UI sichtbar wird.

## 8. Sicherheit & Design-Entscheidungen

Die Registrierung erstellt nicht sofort ein dauerhaftes E-Mail/Passwort-Konto. Stattdessen bleibt der Nutzer zunächst anonym. Damit kann die App Daten schon vorher unter einer UID verwalten, ohne direkt eine bestätigte E-Mail-Bindung anzunehmen.

Die eigentliche Verknüpfung passiert erst nach bestätigter E-Mail über `linkWithCredential(...)`. Dadurch wird die E-Mail erst dann dauerhaft an das bestehende anonyme Konto gebunden, wenn die Bestätigung bereits abgeschlossen ist. Das verhindert, dass unbestätigte oder falsch eingegebene Adressen sofort zum Login-Identifier werden.

Token-Handling:

- Die Functions erwarten den Firebase-ID-Token im Header `Authorization: Bearer <token>`.
- `verifyAnonymousCaller(...)` verifiziert dieses Token serverseitig und erlaubt nur anonyme Caller für Start, Resend und Finalize.
- Der E-Mail-Bestätigungslink selbst nutzt ein separates Bestätigungs-Token in der URL, das serverseitig gehasht gespeichert wird.

Zum Thema User-Enumeration zeigt der Code gemischtes Verhalten:

- Positiv: Beim Passwort-Reset wird `auth/user-not-found` im Client als generischer Erfolg behandelt.
- Nicht vollständig verborgen: Bei Registrierung und Finalisierung wird `auth/email-already-in-use` bewusst als spezifischer Fehler bis in die App durchgereicht.

## 9. Offene Punkte / mögliche Verbesserungen

- Deep Linking: `registrationConfirm` läuft aktuell komplett im Browser/Web und schickt den User nicht zurück in die App.
- Pending-UX: Resend, Ablauf und bestätigter Status sind bereits sichtbar, könnten aber noch stärker geführt werden.
- Cleanup von abgelaufenen Registrierungen: Es gibt aktuell keine separate Routine, die alte `registrationConfirmations`-Dokumente oder abgelaufene Pending-Zustände regelmäßig aufräumt.
- Rate Limits: Im aktuellen Code sind keine zusätzlichen Limits für `registrationStart` oder `registrationResend` sichtbar.
- Doppelte Schreiblogik: Sowohl Function als auch Client schreiben `pendingRegistration`, was für schnellen UI-Status hilfreich ist, aber auf Dauer bewusst beobachtet werden sollte.
- Fehlertexte: Für viele Backend-Codes gibt es bisher noch keine nutzerfreundliche, gezielte UI-Meldung.

## 10. Relevante Dateien

- [AuthContext.tsx](/Users/domin/Desktop/Tracker/src/context/AuthContext.tsx): Zentrale Auth-Logik für anonymous sign-in, Login, Start/Resend/Finalize der Pending-Registrierung, Passwort-Reset und `linkWithCredential(...)`.
- [pendingRegistrationApi.ts](/Users/domin/Desktop/Tracker/src/services/auth/pendingRegistrationApi.ts): HTTP-Client für `registrationStart`, `registrationResend` und `registrationFinalize` inklusive Fehlerauswertung.
- [SettingsScreen.tsx](/Users/domin/Desktop/Tracker/src/screens/SettingsScreen.tsx): Zeigt Pending-Status, Resend, Cancel und Finalisierung der Registrierung in der UI an.
- [RegisterScreen.tsx](/Users/domin/Desktop/Tracker/src/screens/RegisterScreen.tsx): Einstiegspunkt zum Starten der Registrierung.
- [LoginScreen.tsx](/Users/domin/Desktop/Tracker/src/screens/LoginScreen.tsx): Login mit E-Mail/Passwort und Auslösen des Passwort-Resets.
- [functions/index.js](/Users/domin/Desktop/Tracker/functions/index.js): Serverlogik für Bestätigungs-Token, Pending-Status, Mailversand und Finalisierungsprüfungen.
- [userFirestore.ts](/Users/domin/Desktop/Tracker/src/services/firestore/userFirestore.ts): Typen und Hilfsfunktionen für `users/{uid}` sowie `pendingRegistration`.

## Kurzfassung des gesamten Flows

Die App startet Nutzer zunächst anonym über Firebase Auth. Beim Registrieren wird kein direktes E-Mail-Konto erstellt, sondern eine Pending-Registrierung mit Firestore-Status und Bestätigungs-Mail über Firebase Functions und Resend angelegt. Der Bestätigungslink läuft im Browser über `registrationConfirm` und setzt den Status serverseitig auf `confirmed`. Die App erkennt diese Änderung per Firestore-Listener und erlaubt danach in den Einstellungen die Finalisierung mit Passwort. Erst in diesem letzten Schritt wird der anonyme User per `linkWithCredential(...)` mit der bestätigten E-Mail verknüpft. Der Passwort-Reset ist davon unabhängig und nutzt direkt `sendPasswordResetEmail(...)` aus Firebase Auth.

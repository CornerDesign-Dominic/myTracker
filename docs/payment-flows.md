# Payment- und Subscription-Flows

Diese Datei beschreibt die wichtigsten fachlichen Zahlungs- und Status-Flows der App in kurzer Form.

## 1. Normale aktive Zahlungskette

Auslöser:
- Der User legt ein Abo an.
- Das Abo ist aktiv.
- Ein Fälligkeitstermin wird erreicht.

Erwartetes Verhalten:
- Für den fälligen Termin wird eine Zahlung als gebucht gespeichert.
- Die Zahlung wird als `payment_booked` in der History abgelegt.
- Der nächste Termin folgt aus dem Intervall des Abos.

Ergebnis:
- Die History enthält pro fälligem Termin eine gebuchte Zahlung.
- Der Zahlungszyklus läuft im gewählten Intervall weiter.

## 2. Abo pausiert / gekündigt / nicht aktiv

Auslöser:
- Der User setzt ein Abo auf pausiert, gekündigt oder anderweitig nicht aktiv.
- Ein theoretischer Fälligkeitstermin wird erreicht.

Erwartetes Verhalten:
- Die Zahlung wird nicht als gebucht gespeichert.
- Stattdessen wird sie als ausgesetzt gespeichert.
- In der History entsteht ein `payment_skipped_inactive`.

Ergebnis:
- Der Termin gilt fachlich als ausgesetzte Zahlung.
- Diese ausgesetzte Zahlung kann später in die Sparsumme einfließen.

## 3. Zahlung wurde wegen falschem Status falsch verbucht

Auslöser:
- Der Status eines Abos wurde zu spät oder zu früh geändert.
- Eine Zahlung wurde dadurch falsch als gebucht oder ausgesetzt gespeichert.

Erwartetes Verhalten:
- Der User kann die einzelne Zahlung in der History nachträglich korrigieren.
- Mögliche Korrekturen:
- `payment_booked` zu `payment_skipped_inactive`
- `payment_skipped_inactive` zu `payment_booked`

Ergebnis:
- Der einzelne Termin wird fachlich korrekt berichtigt.
- Die History bleibt konsistent.

## 4. Manuelle Zahlung bei Fälligkeit heute

Auslöser:
- Der User legt eine Zahlung manuell an.
- Die Fälligkeit ist heute.

Erwartetes Verhalten:
- Die Zahlung wird direkt gespeichert.
- Sie wird als gebuchte Zahlung angelegt.
- In der History entsteht ein `payment_booked`.

Ergebnis:
- Der heutige Termin ist sofort korrekt in der History erfasst.

## 5. Intervall wird geändert

Auslöser:
- Der User ändert das Intervall eines Abos.

Erwartetes Verhalten:
- Der User gibt die nächste Zahlung neu an.
- Diese nächste Zahlung wird zur neuen Basis für den weiteren Zyklus.
- Alle weiteren Termine bauen auf diesem neuen Startpunkt und dem neuen Intervall auf.

Ergebnis:
- Der künftige Zahlungsrhythmus richtet sich nach dem neuen Intervall und der neu gesetzten nächsten Zahlung.

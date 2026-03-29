# Payment Flows

Diese Datei beschreibt die wichtigsten fachlichen Flows aus Produkt- und User-Sicht.
Die verbindlichen Detailregeln stehen in [`payment-rules.md`](payment-rules.md).

## 1) Erstes Sync-Verhalten ohne Payment-Historie

- der User hat ein Abo ohne vorhandene Payment-History
- die App nutzt `nextPaymentDate` bzw. die initiale Due-Date-Basis als Startpunkt
- beim Sync werden fehlende vergangene Faelligkeiten bis heute erzeugt
- zukuenftige Termine werden dabei nicht angelegt

## 2) Normaler laufender Sync

- es existiert bereits Payment-History fuer das Abo
- Sync orientiert sich an der letzten aktiven Zahlung in der History
- nur fehlende Faelligkeiten nach diesem Anker bis heute werden erzeugt
- vorhandene Payment-Events fuer dieselbe Due-Date werden nicht dupliziert

## 3) Verhalten nach Status

- aktives Abo erzeugt fuer fehlende vergangene Faelligkeiten `payment_booked`
- pausiertes Abo erzeugt fuer fehlende vergangene Faelligkeiten `payment_skipped_inactive`
- gekuendigtes Abo erzeugt keine weiteren Payment-Events

## 4) Manuelle Korrektur einer Zahlung

- der User bearbeitet eine bestehende Zahlung direkt
- dieselbe Zahlung bleibt derselbe Datensatz
- moegliche direkte Korrekturen sind Typ, Betrag, Due-Date und Notiz
- es entsteht keine Replace-Kette

## 5) Loeschen einer Zahlung

- loescht der User die letzte vorhandene Zahlung, kann sie beim naechsten Sync wieder auftauchen
- loescht der User eine aeltere Zahlung vor dem letzten aktiven Sync-Anker, bleibt sie in der Regel geloescht
- Grund ist der begrenzte Sync-Zeitraum ab der letzten vorhandenen Zahlung

## 6) Wechsel von Intervall oder Due-Date

- bei Intervallaenderung muss die naechste Due-Date neu gesetzt oder bestaetigt werden
- diese Basis steuert den weiteren Zahlungszyklus
- eine spaetere Due-Date-Aenderung kann fuer den Sync zur neueren fachlichen Basis werden

# Tracker Design System

## Zielbild

Die App soll ruhig, hell, modern und hochwertig wirken. Das Interface orientiert sich an einer klaren iOS-/Expo-Produktfamilie mit viel Luft, weichen Schatten, sanften Borders und einer präzisen typografischen Hierarchie. Neue Screens sollen sich nahtlos in dieses System einfügen, statt eigene visuelle Regeln einzuführen.

## Stilcharakter

- Sehr heller, entspannter Hintergrund im Light Theme.
- Weiße oder leicht abgesetzte Flächen für Panels, Cards und Inputs.
- Dezente Borders statt harter Kontraste.
- Indigo/Violett als Akzentfarbe für Primäraktionen und aktive Zustände.
- Große, kräftige Seitentitel mit klarer Hierarchie.
- Sekundäre Texte immer gedeckt und zurückhaltend.
- Großzügige Innenabstände und gleichmäßige vertikale Rhythmen.

## Farbrollen

- `background`: ruhiger App-Hintergrund für Screens.
- `surface`: primäre Card- und Panel-Fläche.
- `surfaceSoft`: sanfte Sekundärfläche für Inputs, Filter und passive Elemente.
- `surfaceMuted`: leicht stärkere abgesetzte Fläche für Subpanels.
- `border`: Standardlinie für Cards, Inputs und Segmente.
- `borderStrong`: nur für bewusst stärkere Trennung.
- `textPrimary`: Haupttext, Titel, wichtige Werte.
- `textSecondary`: erklärender Text, Metainformationen, Hilfetexte.
- `textMuted`: nur für sehr leise Informationen.
- `accent`: Primäraktion und aktive Auswahl.
- `accentSoft`: dezente Hinterlegung für akzentnahe Zustände.
- `success`, `warning`, `danger`: Statusfarben sparsam einsetzen.

## Spacing-Regeln

- Standard-Screen-Padding: `spacing.lg`.
- Standard-Abstand zwischen Inhaltsblöcken: `spacing.lg`.
- Inneres Card-Padding: `spacing.lg`.
- Kompakter Abstand innerhalb kleiner UI-Gruppen: `spacing.sm` bis `spacing.md`.
- Keine willkürlichen Einzelwerte verwenden, wenn ein Token existiert.

## Radius-Regeln

- Kleine Controls und Inputs: `radius.md`.
- Standard-Cards und Panels: `radius.lg`.
- Große heroartige Flächen: `radius.lg` oder `radius.xl`.
- Pills und Segment-Buttons: `radius.pill`.

## Shadow-Regeln

- Standard-Cards verwenden das `panel`-Pattern mit weichem Card-Shadow.
- Kleinere aktive Controls nutzen `soft` Shadow.
- Schatten sind immer weich und diffus, nie hart oder dunkel dominant.
- Shadow nur auf Surface-Elementen mit klarer Hierarchie einsetzen.

## Typografie-Hierarchie

- `pageTitle`: für Haupttitel eines Screens.
- `sectionTitle`: für Bereichsüberschriften.
- `cardTitle`: für Titel innerhalb von Panels.
- `metric`: für große Zahlen und Key Metrics.
- `body`: für wichtigen Lesetext und Hauptinhalte.
- `secondary`: für erläuternde und unterstützende Texte.
- `meta`: für Labels, Status, Mini-Beschriftungen.

## Regeln für Cards

- Cards nutzen immer die zentrale `panel`-Fläche.
- Cards haben helle Surface, dezente Border, großzügigen Radius und weichen Shadow.
- Keine harten Sonderformen pro Screen einführen.
- Unterschiedliche Inhalte dürfen innerhalb derselben Card-Familie leben, aber nicht mit völlig abweichender Optik.

## Regeln für Buttons

- Primäraktionen nutzen `accent` als Hintergrund.
- Sekundäraktionen bleiben auf `surface` mit Border.
- Subtile Auswahl-Buttons nutzen `surfaceSoft`.
- Alle Buttons teilen dieselbe Höhe, denselben Radius und dieselbe Typografie.

## Regeln für Inputs

- Inputs immer auf `surface` mit dezenter Border.
- Keine dunklen, grauen oder stark kontrastierenden Input-Flächen im Light Theme.
- Labels über dem Feld, Hilfetexte darunter.
- Multiline-Felder behalten denselben visuellen Rahmen wie normale Inputs.

## Regeln für Screen-Layouts

- Jeder Screen nutzt den zentralen Screen-Container aus `src/theme/patterns.ts`.
- Safe Areas oben und unten immer respektieren.
- Der Content-Rhythmus kommt aus dem Spacing-System, nicht aus zufälligen Einzelwerten.
- Große Seiten beginnen mit einem klaren Titel und danach mit deutlich getrennten Inhaltssektionen.

## Regeln für neue Screens und Komponenten

- Immer zuerst vorhandene Tokens und Pattern prüfen.
- Neue Cards nicht lokal neu gestalten, sondern auf `panel` oder `subtlePanel` aufbauen.
- Neue Buttons immer aus dem gemeinsamen Button-Stil ableiten.
- Typografische Rollen aus dem Theme verwenden statt eigene Fontgrößen zu definieren.
- Wenn ein neues visuelles Muster mehrfach gebraucht wird, in `src/theme/` oder in eine wiederverwendbare Komponente auslagern.

## Do

- Nutze zentrale Tokens für Farbe, Spacing, Radius und Typografie.
- Halte Hintergründe hell und Flächen ruhig.
- Verwende klare Hierarchien mit großzügigem Weißraum.
- Lasse neue Komponenten wie Teil derselben Produktfamilie wirken.

## Don't

- Keine Magic Numbers für Standardabstände, Radius oder Schriftgrößen einstreuen.
- Keine harten Schatten, dunklen Borders oder stark kontrastierenden Panels im Light Theme.
- Keine neuen Button-Stile pro Screen erfinden.
- Keine Karten ohne Border und ohne klares Padding einsetzen.
- Keine ungeplanten Stil-Ausnahmen auf Hauptscreens stehen lassen.

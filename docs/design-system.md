# Design System

## Zielbild

- ruhiges, helles, modernes UI
- hochwertige Cards mit weichen Schatten und klaren Borders
- konsistente Typografie und gleichmaessige Abstaende
- keine stilistischen Ausnahmen pro Screen ohne klaren Grund

## Farbrollen

- `background`: Screen-Hintergrund
- `surface`: primare Card- und Panel-Flaeche
- `surfaceSoft`: subtile Flaeche fuer passive Controls
- `surfaceMuted`: etwas staerkere Sekundaerflaeche
- `border`: Standard-Border fuer Panels, Inputs und Controls
- `textPrimary`: Haupttext und wichtige Werte
- `textSecondary`: Hilfs- und Metatext
- `textMuted`: sehr leise Informationen
- `accent`: aktive Zustaende, Borders, Highlights, Icons
- `accentSoft`: dezente aktive Hinterlegung

## Accent-System

- die App nutzt eine kuratierte Accent-Palette
- Accent-Farben werden zentral ueber Theme und Premium-Freigabe gesteuert
- Accent wird dezent eingesetzt, vor allem fuer:
- aktive Zustaende
- Borders
- kleine Highlights
- Icons

## UX-Leitlinie

- klare Card-Struktur
- wenig visuelles Rauschen
- kurze, direkt verstaendliche Texte
- robuste Interaktionen vor dekorativen Spezialloesungen

## Typografie

- `pageTitle`: Haupttitel eines Screens
- `sectionTitle`: Bereichsueberschriften
- `cardTitle`: Titel innerhalb von Panels
- `metric`: grosse Kennzahlen
- `body`: Hauptinhalt
- `secondary`: erklaerende Texte
- `meta`: Labels, Status, Mini-Beschriftungen

## Layout und Komponenten

- Screens verwenden die gemeinsamen Layout-Pattern aus `src/theme/`
- Panels und Cards nutzen den gemeinsamen Surface-Rahmen
- Buttons und Inputs leiten sich aus dem zentralen Theme ab
- neue Komponenten sollen vorhandene Tokens und Pattern bevorzugen

## Buttons

- primaere Buttons verwenden `accentSoft` plus Accent-Border
- sekundaere Buttons bleiben auf `surface` mit Standard-Border
- subtile Buttons verwenden `surfaceSoft`
- Hoehe, Radius und Typografie bleiben appweit konsistent

## Do

- Tokens fuer Farbe, Spacing, Radius und Typografie wiederverwenden
- Oberflaechen ruhig und hell halten
- visuelle Hierarchie ueber Abstaende und Typografie steuern

## Don't

- keine Magic Numbers fuer Standardabstaende und Groessen
- keine harten Schatten oder dunklen Heavy-Borders
- keine neuen Stil-Systeme pro Screen einfuehren

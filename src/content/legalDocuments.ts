import { AppLanguage } from "@/i18n/translations";

export type LegalDocumentKey = "terms" | "privacy" | "imprint";

type LegalSection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

type LegalDocument = {
  updatedAt: string;
  intro: string[];
  sections: LegalSection[];
};

const germanDocuments: Record<LegalDocumentKey, LegalDocument> = {
  terms: {
    updatedAt: "Stand: 29.03.2026",
    intro: [
      "Diese AGB sind als umfassend vorbereitete Vorlage fuer die Tracker-App nach deutschem Recht formuliert. Vor einer Veroeffentlichung muessen alle eckigen Klammern mit den echten Unternehmens- und Kontaktdaten ersetzt und die Inhalte rechtlich geprueft werden.",
      "Anbieter der App ist [Vollstaendiger Name / Firma], [Rechtsform], [Anschrift], [E-Mail-Adresse], [weitere Kontaktmoeglichkeit].",
    ],
    sections: [
      {
        title: "1. Geltungsbereich",
        bullets: [
          "Diese Allgemeinen Geschaeftsbedingungen regeln die Nutzung der mobilen Anwendung \"Tracker\" sowie aller damit zusammenhaengenden Leistungen zwischen [Anbietername] und den Nutzerinnen und Nutzern der App.",
          "Die App dient der privaten Organisation, Dokumentation und Auswertung von Abonnements, wiederkehrenden Zahlungen, Zahlungsereignissen und Einsparungen.",
          "Abweichende Bedingungen der Nutzerinnen oder Nutzer werden nicht Vertragsbestandteil, es sei denn, [Anbietername] stimmt ihrer Geltung ausdruecklich zu.",
        ],
      },
      {
        title: "2. Leistungsbeschreibung",
        bullets: [
          "Die App ermoeglicht insbesondere das Anlegen, Bearbeiten, Archivieren und Auswerten von Abonnements sowie die Erfassung und Historisierung von Zahlungsereignissen.",
          "Die App kann sowohl ohne dauerhaftes Benutzerkonto als auch mit optionaler Registrierung oder Anmeldung genutzt werden, soweit die jeweils bereitgestellten Funktionen dies vorsehen.",
          "Ohne Registrierung koennen Daten je nach Geraet, Betriebssystem, App-Deinstallation oder Speicherloeschung verloren gehen; eine geraeteuebergreifende Synchronisation ist regelmaessig nur mit Kontoanbindung moeglich.",
          "Ein Anspruch auf einen bestimmten Funktionsumfang, eine bestimmte Verfuegbarkeit oder die dauerhafte Bereitstellung einzelner kostenloser Funktionen besteht nur, soweit dies zwingend gesetzlich vorgeschrieben oder ausdruecklich zugesagt ist.",
        ],
      },
      {
        title: "3. Vertragsschluss und Nutzerkonto",
        bullets: [
          "Der Nutzungsvertrag ueber kostenlose Basisfunktionen kommt mit dem Download der App und spaetestens mit der ersten Nutzung zustande.",
          "Soweit die App eine anonyme Nutzung vorsieht, kann zunaechst ein technisches Gast- oder Anonymous-Konto verwendet werden, das spaeter in ein dauerhaftes Konto ueberfuehrt werden kann.",
          "Bei einer Registrierung mit E-Mail-Adresse muessen die angegebenen Daten wahrheitsgemaess und aktuell sein.",
          "Zugangsdaten sind geheim zu halten und vor dem Zugriff unbefugter Dritter zu schuetzen.",
          "Ein Anspruch auf Registrierung oder auf Aufrechterhaltung eines Kontos besteht nicht, wenn berechtigte Gruende, insbesondere Missbrauch, Sicherheitsbedenken oder Rechtsverletzungen, entgegenstehen.",
        ],
      },
      {
        title: "4. Zulaessige Nutzung",
        bullets: [
          "Die App darf nur im Rahmen der geltenden Gesetze und dieser AGB genutzt werden.",
          "Unzulaessig sind insbesondere Manipulationen an der App, automatisierte Massenabfragen, Umgehungen technischer Schutzmassnahmen, missbraeuchliche Belastung der Infrastruktur und die Nutzung fuer rechtswidrige Inhalte oder Zwecke.",
          "Die Nutzerinnen und Nutzer sind fuer die Richtigkeit, Vollstaendigkeit und Rechtmaessigkeit der von ihnen eingegebenen Inhalte selbst verantwortlich.",
          "Es duerfen keine Inhalte gespeichert werden, fuer deren Verarbeitung keine Berechtigung besteht oder die Rechte Dritter verletzen.",
        ],
      },
      {
        title: "5. Inhalte und Verantwortung der Nutzerinnen und Nutzer",
        bullets: [
          "Zu den durch Nutzerinnen und Nutzer eingegebenen Inhalten koennen insbesondere Namen von Abonnements, Kategorien, Betraege, Faelligkeitsdaten, Statusangaben, Notizen sowie manuell erfasste Zahlungshistorien gehoeren.",
          "Die Nutzerinnen und Nutzer sind selbst dafuer verantwortlich, ob und in welchem Umfang sie in Freitextfeldern personenbezogene, vertrauliche oder sonst sensible Informationen speichern.",
          "Die App ist nicht fuer die Speicherung besonderer Kategorien personenbezogener Daten im Sinne von Art. 9 DSGVO vorgesehen.",
          "Die Nutzerinnen und Nutzer sind selbst dafuer verantwortlich, wichtige Daten bei Bedarf zusaetzlich ausserhalb der App zu sichern.",
        ],
      },
      {
        title: "6. Hinweise zur Datenverfuegbarkeit und Synchronisation",
        bullets: [
          "Soweit Daten lokal auf dem Geraet gespeichert werden, haengt ihre Verfuegbarkeit insbesondere vom Zustand des Geraets, des Betriebssystems, lokaler Speicherberechtigungen und etwaigen Sicherungen des Nutzers ab.",
          "Soweit eine Kontofunktion mit Cloud-Synchronisation angeboten wird, erfolgt die Speicherung und Bereitstellung nach dem jeweils aktuellen technischen Stand, jedoch ohne Garantie fuer eine jederzeit unterbrechungsfreie Verfuegbarkeit.",
          "Bei anonymer Nutzung oder geloeschten lokalen Daten kann eine Wiederherstellung ausgeschlossen sein.",
          "Bei gemeinsamer Geraetenutzung oder unzureichender Geraetesicherung koennen lokal gespeicherte Daten fuer andere Personen einsehbar sein.",
        ],
      },
      {
        title: "7. Aenderungen, Updates und Weiterentwicklung",
        bullets: [
          "[Anbietername] ist berechtigt, die App technisch und inhaltlich weiterzuentwickeln, Fehler zu beheben, Funktionen anzupassen oder einzelne Funktionen aus sachlichen Gruenden zu aendern, sofern dadurch wesentliche Vertragspflichten gegenueber Verbraucherinnen und Verbrauchern nicht unzumutbar eingeschraenkt werden.",
          "Sicherheitsrelevante Updates duerfen jederzeit eingespielt werden.",
          "Soweit kuenftig kostenpflichtige Funktionen, Supporter-Features oder In-App-Kaeufe angeboten werden, gelten hierfuer zusaetzlich die im jeweiligen Buchungs- oder Kaufprozess dargestellten Bedingungen.",
        ],
      },
      {
        title: "8. Verfuegbarkeit und technische Stoerungen",
        bullets: [
          "[Anbietername] schuldet keine stoerungsfreie oder jederzeit ununterbrochene Verfuegbarkeit der App.",
          "Wartungen, Sicherheitsupdates, technische Probleme bei Drittanbietern, Netzstoerungen, App-Store-Einschraenkungen oder Umstaende ausserhalb des Einflussbereichs von [Anbietername] koennen die Nutzung voruebergehend einschraenken.",
          "[Anbietername] wird berechtigte Interessen der Nutzerinnen und Nutzer bei planbaren Einschraenkungen angemessen beruecksichtigen.",
        ],
      },
      {
        title: "9. Haftung",
        bullets: [
          "[Anbietername] haftet unbeschraenkt bei Vorsatz und grober Fahrlaessigkeit, bei Verletzung von Leben, Koerper oder Gesundheit sowie nach den Vorschriften des Produkthaftungsrechts.",
          "Bei leicht fahrlaessiger Verletzung wesentlicher Vertragspflichten ist die Haftung auf den vertragstypischen, vorhersehbaren Schaden begrenzt; wesentliche Vertragspflichten sind solche, deren Erfuellung die ordnungsgemaesse Nutzung der App ueberhaupt erst ermoeglicht und auf deren Einhaltung Nutzerinnen und Nutzer regelmaessig vertrauen duerfen.",
          "Im Uebrigen ist die Haftung fuer leicht fahrlaessig verursachte Schaeden ausgeschlossen.",
          "Die App stellt Organisations- und Auswertungsfunktionen bereit, ersetzt aber keine steuerliche, rechtliche, buchhalterische oder finanzielle Beratung und keine eigenstaendige Pruefung durch die Nutzerin oder den Nutzer.",
        ],
      },
      {
        title: "10. Rechte an der App",
        bullets: [
          "Saemtliche Rechte an der App, an ihrer Gestaltung, an Texten, Grafiken, Marken, Datenbanken und am Quellcode verbleiben bei [Anbietername] oder den jeweiligen Rechteinhabern.",
          "Nutzerinnen und Nutzer erhalten ein einfaches, nicht ausschliessliches, nicht uebertragbares und widerrufliches Recht zur Nutzung der App fuer eigene Zwecke im Rahmen dieser AGB.",
          "Eine Dekompilierung, Bearbeitung, Vervielfaeltigung oder Verbreitung ausserhalb der gesetzlich zulaessigen Grenzen bedarf der vorherigen Zustimmung von [Anbietername].",
        ],
      },
      {
        title: "11. Laufzeit, Kuendigung und Sperrung",
        bullets: [
          "Der Vertrag ueber kostenlose Funktionen laeuft auf unbestimmte Zeit und kann von den Nutzerinnen und Nutzern jederzeit durch Nichtnutzung, Loeschen des Kontos oder Deinstallation der App beendet werden.",
          "[Anbietername] kann den Nutzungsvertrag aus wichtigem Grund kuendigen oder Zugriffe sperren, wenn erhebliche Pflichtverletzungen, Sicherheitsrisiken, Missbrauch oder Rechtsverstoesse vorliegen.",
          "Gesetzliche Ansprueche und Rechte der Parteien bleiben unberuehrt.",
        ],
      },
      {
        title: "12. Datenschutz",
        bullets: [
          "Informationen zur Verarbeitung personenbezogener Daten finden sich in der Datenschutzerklaerung innerhalb der App.",
          "Soweit fuer einzelne Verarbeitungen eine Einwilligung erforderlich ist, wird diese gesondert eingeholt.",
        ],
      },
      {
        title: "13. Verbraucherhinweise",
        bullets: [
          "[Anbietername] nimmt [nicht / doch] an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teil. Falls eine Teilnahme erfolgt, ist die zustaendige Stelle hier zu benennen: [Name, Anschrift, Website der Verbraucherschlichtungsstelle].",
          "Die ehemalige EU-Online-Streitbeilegungsplattform ist seit dem 20.07.2025 nicht mehr in Betrieb und wird deshalb in dieser App nicht mehr als Kontaktweg angegeben.",
        ],
      },
      {
        title: "14. Schlussbestimmungen",
        bullets: [
          "Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts, soweit dem keine zwingenden verbraucherschuetzenden Vorschriften des Staates entgegenstehen, in dem die Verbraucherin oder der Verbraucher seinen gewoehnlichen Aufenthalt hat.",
          "Ist die Nutzerin oder der Nutzer Kaufmann, juristische Person des oeffentlichen Rechts oder oeffentlich-rechtliches Sondervermoegen, ist Gerichtsstand fuer alle Streitigkeiten aus dem Vertragsverhaeltnis [Sitz des Anbieters], soweit gesetzlich zulaessig.",
          "Sollten einzelne Bestimmungen dieser AGB ganz oder teilweise unwirksam sein oder werden, bleibt die Wirksamkeit der uebrigen Bestimmungen unberuehrt.",
        ],
      },
    ],
  },
  privacy: {
    updatedAt: "Stand: 29.03.2026",
    intro: [
      "Diese Datenschutzerklaerung ist fuer die aktuelle Tracker-App moeglichst vollstaendig vorbereitet und orientiert sich an den derzeit erkennbaren Datenfluesse der App. Vor der Veroeffentlichung muessen saemtliche Platzhalter ersetzt, die eingesetzten Firebase-/Google-Vertragsdaten geprueft und die Angaben mit den tatsaechlich produktiv genutzten Diensten abgeglichen werden.",
      "Verantwortlicher im Sinne der DSGVO ist [Vollstaendiger Name / Firma], [Rechtsform], [ladungsfaehige Anschrift], [E-Mail-Adresse], [Telefon], [Vertretungsberechtigte Person]. Datenschutzkontakt: [Datenschutz-E-Mail]. Falls ein Datenschutzbeauftragter bestellt ist: [Name und Kontaktdaten Datenschutzbeauftragter].",
    ],
    sections: [
      {
        title: "1. Allgemeine Hinweise",
        bullets: [
          "Die App verarbeitet personenbezogene Daten nur, soweit dies fuer die Bereitstellung der App, die Kontofunktion, die Datensicherung, die Fehleranalyse, die Sicherheit und die Kommunikation mit Nutzerinnen und Nutzern erforderlich ist oder eine Einwilligung vorliegt.",
          "Personenbezogene Daten sind alle Informationen, die sich auf eine identifizierte oder identifizierbare natuerliche Person beziehen. Dazu koennen in dieser App insbesondere Konto-, Nutzungs-, Inhalts-, Zahlungs- und technische Geraetedaten gehoeren.",
          "Die App ist nicht auf die Verarbeitung besonders sensibler Daten ausgelegt. Nutzerinnen und Nutzer sollten in Freitextfeldern keine unnoetigen sensiblen Daten hinterlegen.",
        ],
      },
      {
        title: "2. Verarbeitete Datenkategorien in der App",
        bullets: [
          "Kontodaten: Benutzer-ID, E-Mail-Adresse, Status als anonymer oder registrierter Nutzer, verknuepfte Anmeldemethoden, Zeitpunkte technischer Kontoereignisse.",
          "Abo- und Inhaltsdaten: Name des Abonnements, Kategorie, Betrag, Intervall, Faelligkeitsdatum, Status, Enddatum, Notizen, Archivierungsstatus sowie Zeitstempel fuer Erstellung und Aenderung.",
          "Historien- und Zahlungsdaten: gebuchte Zahlungen, ausgesetzte Zahlungen, manuelle Korrekturen, Due Dates, Betragsaenderungen, Intervallwechsel, Statuswechsel, Notizen und technische Metadaten zu Ereignissen.",
          "Einstellungsdaten: Sprache, Waehrung, Theme, Akzentfarbe, gespeicherte Kategorien, gespeicherte Vorlagen und Onboarding-Status.",
          "Technische Daten: App-Version, Betriebssystem, Geraetemodell, Fehler- und Absturzinformationen, pseudonyme technische Kennungen sowie weitere fuer die Fehlerdiagnose notwendige Umgebungsdaten.",
        ],
      },
      {
        title: "3. Zwecke und Rechtsgrundlagen der Verarbeitung",
        bullets: [
          "Bereitstellung der Kernfunktionen der App, Verwaltung von Abonnements und Anzeige der Historie: Art. 6 Abs. 1 lit. b DSGVO, soweit ein Nutzungsvertrag besteht, im Uebrigen Art. 6 Abs. 1 lit. f DSGVO auf Grundlage des berechtigten Interesses an einer funktionsfaehigen App.",
          "Anlage und Verwaltung von Nutzerkonten, Anmeldung, anonyme Kontonutzung und Verknuepfung eines anonymen Kontos mit einer E-Mail-Adresse: Art. 6 Abs. 1 lit. b DSGVO.",
          "Synchronisation und Datensicherung ueber mehrere Geraete: Art. 6 Abs. 1 lit. b DSGVO beziehungsweise Art. 6 Abs. 1 lit. f DSGVO, wenn die Funktion auf Wunsch der Nutzerin oder des Nutzers genutzt wird.",
          "Speicherung lokaler Einstellungen, Kategorien, Vorlagen und Onboarding-Informationen auf dem Endgeraet: Art. 6 Abs. 1 lit. b DSGVO beziehungsweise Art. 6 Abs. 1 lit. f DSGVO sowie gegebenenfalls § 25 Abs. 2 Nr. 2 TDDDG, soweit die Speicherung unbedingt erforderlich ist.",
          "Sicherheits-, Fehler- und Stabilitaetsanalyse einschliesslich Crash-Reports: Art. 6 Abs. 1 lit. f DSGVO auf Grundlage des berechtigten Interesses an einem sicheren, stabilen und fehlerarmen App-Betrieb.",
          "Erfuellung gesetzlicher Aufbewahrungs-, Nachweis- oder Verteidigungspflichten: Art. 6 Abs. 1 lit. c DSGVO sowie Art. 6 Abs. 1 lit. f DSGVO.",
        ],
      },
      {
        title: "4. Nutzung ohne registriertes Konto",
        bullets: [
          "Die App kann zumindest teilweise ohne dauerhaft registriertes Konto genutzt werden.",
          "Hierfuer kann technisch ein anonymes Firebase-Konto erzeugt werden, damit Daten app-intern einer Benutzer-ID zugeordnet und spaeter gegebenenfalls in ein dauerhaftes Konto ueberfuehrt werden koennen.",
          "Bei rein lokaler oder anonymer Nutzung besteht ein erhoehtes Risiko, dass Daten bei Geraetewechsel, Loeschen lokaler Speicher oder Deinstallation nicht wiederhergestellt werden koennen.",
        ],
      },
      {
        title: "5. Registrierung, Login und Kontoverwaltung",
        bullets: [
          "Bei einer Registrierung oder Anmeldung mit E-Mail-Adresse verarbeitet die App die von Ihnen angegebene E-Mail-Adresse, Ihre technische Benutzer-ID und Informationen ueber den Authentifizierungsstatus.",
          "Bei einer Aufwertung eines anonymen Kontos werden das bisherige anonyme Konto und das neu angelegte E-Mail-/Passwort-Konto technisch miteinander verknuepft, damit bestehende Daten erhalten bleiben.",
          "Die Verarbeitung dient dazu, den Zugang abzusichern, Daten Ihrem Konto zuzuordnen und eine Wiederherstellung oder Synchronisation ueber mehrere Geraete zu ermoeglichen.",
        ],
      },
      {
        title: "6. Speicherung von Abonnement-, Historien- und Einstellungsdaten",
        bullets: [
          "Abonnementsdaten und Zahlungshistorien werden je nach Nutzungsart lokal auf dem Geraet und/oder in der Cloud gespeichert.",
          "Bei angemeldeten oder technisch zugeordneten Nutzerkonten werden Daten derzeit in einer Firebase-/Firestore-Struktur unter einer nutzerbezogenen Kennung gespeichert.",
          "In der Cloud koennen insbesondere Benutzer-ID, E-Mail-Bezug, Einstellungen, Abonnementsdaten und Historienereignisse verarbeitet werden.",
          "Die lokale Speicherung erfolgt aktuell insbesondere fuer App-Einstellungen, Akzentfarbe, Kategorien, Vorlagen und Onboarding-Status ueber AsyncStorage auf dem Endgeraet.",
        ],
      },
      {
        title: "7. Fehlerberichte und Crashlytics",
        bullets: [
          "Die App nutzt derzeit Firebase Crashlytics fuer die Erkennung, Priorisierung und Analyse von Abstuerzen und Fehlern.",
          "Dabei koennen je nach Fehlerfall insbesondere Stacktraces, technische App- und Geraeteinformationen, Zeitpunkte von Fehlern, eine pseudonyme Crashlytics- oder Installationskennung sowie eine app-interne Benutzer-ID verarbeitet werden.",
          "Die App setzt fuer Crash-Reports derzeit eine interne Benutzer-ID, damit Fehler einem Konto technisch zugeordnet und besser analysiert werden koennen.",
          "Nach dem derzeitigen Code-Stand werden ueber Crashlytics vor allem technische Fehlerdaten sowie allgemeine Fehlerkontexte verarbeitet; inhaltliche Abo- oder Notizdaten sollen nicht gezielt an Crashlytics uebermittelt werden.",
          "Falls Sie eine ausdrueckliche Einwilligungsloesung fuer Crash-Reports einsetzen wollen, muss die technische Implementierung vor Livegang entsprechend angepasst werden.",
        ],
      },
      {
        title: "8. Empfaenger und eingesetzte Dienstleister",
        bullets: [
          "Empfaenger der Daten ist zunaechst [Anbietername] als Verantwortlicher.",
          "Zusaetzlich koennen Daten an technisch eingesetzte Auftragsverarbeiter oder Unterauftragsverarbeiter uebermittelt werden, insbesondere an Anbieter von Authentifizierungs-, Datenbank-, Hosting-, Speicher- und Fehleranalyseleistungen.",
          "Nach dem derzeitigen technischen Stand nutzt die App insbesondere Dienste aus der Firebase-/Google-Produktfamilie, darunter Firebase Authentication, Cloud Firestore und Firebase Crashlytics.",
          "Die genaue vertragsrelevante Gesellschaft, Anschrift, Datenverarbeitungsrolle und der jeweils aktuelle Auftragsverarbeitungsvertrag muessen anhand Ihrer produktiv abgeschlossenen Google-/Firebase-Unterlagen ergaenzt und dokumentiert werden: [Vertragspartei, Anschrift, AV-Vertrag, Support-Link].",
        ],
      },
      {
        title: "9. Drittlanduebermittlungen",
        bullets: [
          "Bei dem Einsatz von Google-/Firebase-Diensten kann nicht ausgeschlossen werden, dass personenbezogene Daten auch in Staaten ausserhalb der EU beziehungsweise des EWR verarbeitet oder dorthin uebermittelt werden, insbesondere in die USA.",
          "Solche Uebermittlungen duerfen nur auf eine geeignete Rechtsgrundlage gestuetzt werden, zum Beispiel auf einen Angemessenheitsbeschluss, Standardvertragsklauseln oder andere nach Kapitel V DSGVO zulaessige Garantien.",
          "Vor Livegang ist zu pruefen und in Ihren Vertragsunterlagen zu dokumentieren, auf welche konkrete Uebermittlungsgrundlage Sie sich fuer die produktiv eingesetzten Dienste stuetzen: [EU-U.S. Data Privacy Framework / SCC / sonstige Grundlage].",
        ],
      },
      {
        title: "10. Speicherdauer",
        bullets: [
          "Lokale Einstellungsdaten bleiben grundsaetzlich auf dem Geraet gespeichert, bis sie innerhalb der App geaendert, die App-Daten geloescht oder die App deinstalliert wird.",
          "Kontodaten, Abo-Daten und Historien werden grundsaetzlich so lange gespeichert, wie dies fuer die Bereitstellung der App und der vom Nutzer gewuenschten Funktionen erforderlich ist oder berechtigte Interessen beziehungsweise gesetzliche Pflichten eine laengere Speicherung rechtfertigen.",
          "Geloeschte oder als geloescht markierte Historienereignisse koennen aus technischen und Nachweisgruenden noch fuer einen begrenzten Zeitraum in Datenbanken, Backups oder Revisionskontexten verbleiben, bis turnusgemaesse Bereinigungen erfolgen.",
          "Soweit Sie gesonderte Loeschkonzepte, Backup-Fristen oder Account-Loeschprozesse vorsehen, muessen diese hier konkretisiert werden: [Loeschfristen / Backup-Fristen / Account-Deletion-Prozess].",
        ],
      },
      {
        title: "11. Pflicht zur Bereitstellung von Daten",
        bullets: [
          "Die Bereitstellung von Daten ist grundsaetzlich freiwillig.",
          "Ohne bestimmte Angaben, etwa Anmeldedaten oder Abonnementsdaten, koennen einzelne Funktionen der App jedoch nicht oder nicht sinnvoll bereitgestellt werden.",
          "Soweit eine Registrierung erfolgt, sind diejenigen Daten verpflichtend, die fuer die Kontofuehrung und Authentifizierung technisch erforderlich sind.",
        ],
      },
      {
        title: "12. Ihre Rechte",
        bullets: [
          "Sie haben nach Massgabe der gesetzlichen Voraussetzungen das Recht auf Auskunft ueber die verarbeiteten personenbezogenen Daten, auf Berichtigung unrichtiger Daten, auf Loeschung, auf Einschraenkung der Verarbeitung und auf Datenuebertragbarkeit.",
          "Sie haben das Recht, einer Verarbeitung zu widersprechen, soweit diese auf Art. 6 Abs. 1 lit. e oder lit. f DSGVO beruht und Gruende vorliegen, die sich aus Ihrer besonderen Situation ergeben.",
          "Soweit eine Verarbeitung auf Ihrer Einwilligung beruht, koennen Sie diese jederzeit mit Wirkung fuer die Zukunft widerrufen.",
          "Sie haben zudem das Recht, sich bei einer Datenschutzaufsichtsbehoerde zu beschweren. Zustaendig ist insbesondere die Aufsichtsbehoerde Ihres gewoehnlichen Aufenthaltsorts, Ihres Arbeitsplatzes oder des Orts des mutmasslichen Verstosses sowie die fuer [Anbietername] zustaendige Aufsichtsbehoerde: [Name und Anschrift der zustaendigen Aufsichtsbehoerde ergaenzen].",
        ],
      },
      {
        title: "13. Keine automatisierte Entscheidungsfindung",
        bullets: [
          "Eine automatisierte Entscheidungsfindung einschliesslich Profiling im Sinne von Art. 22 DSGVO findet nach dem derzeitigen Stand der App nicht statt.",
        ],
      },
      {
        title: "14. Datensicherheit",
        bullets: [
          "[Anbietername] trifft angemessene technische und organisatorische Massnahmen, um personenbezogene Daten gegen Verlust, Missbrauch, unbefugten Zugriff und sonstige unberechtigte Verarbeitungen zu schuetzen.",
          "Trotzdem ist keine elektronische Datenuebertragung und keine digitale Speicherung vollstaendig sicher.",
          "Nutzerinnen und Nutzer sollten ihr Endgeraet durch Passcode, Biometrie, aktuelle Software, sichere Backups und vertrauliche Behandlung ihrer Zugangsdaten schuetzen.",
        ],
      },
      {
        title: "15. Aenderungen dieser Datenschutzerklaerung",
        bullets: [
          "[Anbietername] kann diese Datenschutzerklaerung anpassen, wenn sich die App, die eingesetzten Dienste, gesetzliche Anforderungen oder die Datenverarbeitung aendern.",
          "Massgeblich ist die jeweils in der App veroeffentlichte Fassung.",
        ],
      },
    ],
  },
  imprint: {
    updatedAt: "Stand: 29.03.2026",
    intro: [
      "Dieses Impressum ist fuer eine in Deutschland angebotene App vorbereitet. Alle Platzhalter muessen vor der Veroeffentlichung mit den echten Pflichtangaben ersetzt werden.",
    ],
    sections: [
      {
        title: "Anbieterkennzeichnung nach deutschem Recht",
        bullets: [
          "[Vollstaendiger Name / Firma]",
          "[Rechtsform, falls vorhanden]",
          "[Vertretungsberechtigte Person(en)]",
          "[Strasse und Hausnummer]",
          "[PLZ Ort]",
          "[Land]",
          "E-Mail: [E-Mail-Adresse]",
          "Telefon: [Telefonnummer]",
          "Weitere schnelle elektronische Kontaktmoeglichkeit, falls vorhanden: [Kontaktformular / weitere Kontaktadresse]",
        ],
      },
      {
        title: "Registerangaben",
        bullets: [
          "Eintragung im Handels-, Vereins-, Partnerschafts- oder Genossenschaftsregister: [Registerart, Registergericht, Registernummer].",
          "Falls keine Registereintragung besteht: [Keine Registereintragung vorhanden].",
        ],
      },
      {
        title: "Umsatzsteuer und wirtschaftliche Angaben",
        bullets: [
          "Umsatzsteuer-Identifikationsnummer gemaess § 27a UStG: [USt-IdNr., falls vorhanden].",
          "Wirtschafts-Identifikationsnummer gemaess § 139c AO: [W-IdNr., falls vorhanden].",
        ],
      },
      {
        title: "Verantwortlich fuer den Inhalt",
        bullets: [
          "Inhaltlich verantwortlich fuer diese App und die innerhalb der App bereitgestellten Rechtstexte: [Name, Anschrift, E-Mail].",
        ],
      },
      {
        title: "Verbraucherstreitbeilegung",
        bullets: [
          "[Anbietername] ist [nicht / bereit / verpflichtet], an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.",
          "Falls Teilnahme besteht, ist die zustaendige Verbraucherschlichtungsstelle zu benennen: [Name, Anschrift, Website].",
          "Die fruehere EU-Online-Streitbeilegungsplattform wird nicht mehr angegeben, da sie seit dem 20.07.2025 nicht mehr betrieben wird.",
        ],
      },
      {
        title: "Berufsrechtliche Angaben, falls einschlaegig",
        bullets: [
          "Falls fuer den Anbieter eine reglementierte Taetigkeit besteht, muessen hier zusaetzlich Kammer, Berufsbezeichnung, verleihender Staat und die einschlaegigen berufsrechtlichen Regelungen ergaenzt werden: [Pflichtangaben nur falls einschlaegig].",
        ],
      },
    ],
  },
};

const englishIntro = {
  terms:
    "The following legal text is provided in German because the app is currently prepared for operation under German law. Replace all placeholders before publishing.",
  privacy:
    "The following privacy notice is provided in German because the app is currently prepared for operation under German law. Replace all placeholders and verify all provider details before publishing.",
  imprint:
    "The following imprint is provided in German because the app is currently prepared for operation under German law. Replace all placeholders before publishing.",
} satisfies Record<LegalDocumentKey, string>;

export const getLegalDocument = (
  key: LegalDocumentKey,
  language: AppLanguage,
): LegalDocument => {
  const document = germanDocuments[key];

  if (language === "de") {
    return document;
  }

  return {
    ...document,
    intro: [englishIntro[key], ...document.intro],
  };
};

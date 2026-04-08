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
    updatedAt: "Stand: 07.04.2026",
    intro: [
      "Diese Nutzungsbedingungen regeln die Nutzung der App OctoVault zwischen Ihnen und dem Anbieter CornerDesign - Dominic Franz, Erbschlöer Str. 70c, 42369 Wuppertal, Deutschland, erreichbar unter info@corner-design.de.",
      "Mit dem Download, der Installation oder der Nutzung von OctoVault akzeptieren Sie diese Nutzungsbedingungen.",
    ],
    sections: [
      {
        title: "1. Gegenstand der App",
        bullets: [
          "OctoVault ist eine App zur Verwaltung von Abonnements und wiederkehrenden Zahlungen.",
          "Die App ermÃ¶glicht insbesondere das Erfassen von Abonnements, Kategorien, Preisen, Zahlungsintervallen, Notizen, Zahlungs-Historien sowie persÃ¶nlichen Einstellungen.",
          "Die App kann lokal auf dem GerÃ¤t und - je nach Nutzung - auch Ã¼ber eine Cloud-Anbindung mit Firebase genutzt werden.",
        ],
      },
      {
        title: "2. Nutzung der App",
        bullets: [
          "Die Nutzung der kostenlosen Grundfunktionen ist nur fÃ¼r rechtmÃ¤ÃŸige private oder beruflich-organisatorische Zwecke gestattet.",
          "Sie dÃ¼rfen keine rechtswidrigen, irrefÃ¼hrenden oder missbrÃ¤uchlichen Inhalte in der App speichern.",
          "Sie sind fÃ¼r die Richtigkeit und VollstÃ¤ndigkeit Ihrer eingegebenen Daten selbst verantwortlich.",
        ],
      },
      {
        title: "3. Konto und Anmeldung",
        bullets: [
          "OctoVault kann teilweise anonym genutzt werden.",
          "FÃ¼r Backup, Wiederherstellung und Cloud-Speicherung kann ein Konto Ã¼ber Firebase Authentication eingerichtet oder mit einer E-Mail-Adresse verknÃ¼pft werden.",
          "Sie sind dafÃ¼r verantwortlich, Ihre Zugangsdaten vertraulich zu behandeln und vor dem Zugriff unbefugter Dritter zu schÃ¼tzen.",
        ],
      },
      {
        title: "4. Premium-Funktion",
        bullets: [
          "OctoVault kann eine kostenpflichtige Premium-Funktion als In-App-Kauf enthalten.",
          "Die Premium-Freischaltung erfolgt als Einmalzahlung und schaltet insbesondere eine unbegrenzte Anzahl an Abonnements frei.",
          "Die Abwicklung von In-App-KÃ¤ufen erfolgt Ã¼ber den jeweiligen App-Store-Anbieter. FÃ¼r Zahlung, Abrechnung, Widerruf und RÃ¼ckerstattungen gelten zusÃ¤tzlich die Bedingungen des jeweiligen Stores.",
          "Ein Anspruch auf jederzeit unverÃ¤nderte Premium-Funktionen besteht nicht, soweit Ã„nderungen aus technischen, rechtlichen oder sicherheitsbezogenen GrÃ¼nden erforderlich sind.",
        ],
      },
      {
        title: "5. VerfÃ¼gbarkeit und technische Voraussetzungen",
        bullets: [
          "OctoVault wird nach dem jeweils aktuellen technischen Stand bereitgestellt.",
          "Eine jederzeit unterbrechungsfreie, fehlerfreie und vollstÃ¤ndig verfÃ¼gbare Nutzung kann nicht garantiert werden.",
          "EinschrÃ¤nkungen kÃ¶nnen insbesondere durch Wartung, technische StÃ¶rungen, Netzwerkprobleme, App-Store-Vorgaben oder AusfÃ¤lle von Drittanbietern wie Firebase entstehen.",
        ],
      },
      {
        title: "6. Daten und Eigenverantwortung",
        bullets: [
          "Sie sind selbst dafÃ¼r verantwortlich, welche Inhalte Sie in OctoVault speichern, insbesondere in Freitext- oder Notizfeldern.",
          "OctoVault ist nicht fÃ¼r die Speicherung besonders sensibler Daten bestimmt.",
          "Trotz technischer SchutzmaÃŸnahmen kann kein vollstÃ¤ndiger Schutz vor Datenverlust, Fehlfunktionen oder unbefugtem Zugriff garantiert werden.",
          "Bei rein lokaler oder anonymer Nutzung kann ein Datenverlust insbesondere bei GerÃ¤tewechsel, Deinstallation oder ZurÃ¼cksetzen des GerÃ¤ts eintreten.",
        ],
      },
      {
        title: "7. Kein Beratungsangebot",
        bullets: [
          "OctoVault dient ausschlieÃŸlich der Organisation und Ãœbersicht Ihrer Abonnements und Zahlungen.",
          "Die App stellt keine Finanzberatung, Anlageberatung, Steuerberatung, Rechtsberatung oder sonstige professionelle Beratung dar.",
          "Entscheidungen Ã¼ber VertragsabschlÃ¼sse, KÃ¼ndigungen, Zahlungen oder finanzielle Verpflichtungen treffen Sie ausschlieÃŸlich eigenverantwortlich.",
        ],
      },
      {
        title: "8. Haftung",
        bullets: [
          "Der Anbieter haftet unbeschrÃ¤nkt bei Vorsatz und grober FahrlÃ¤ssigkeit sowie bei Verletzung von Leben, KÃ¶rper oder Gesundheit.",
          "Bei leicht fahrlÃ¤ssiger Verletzung wesentlicher Vertragspflichten ist die Haftung auf den vorhersehbaren, vertragstypischen Schaden begrenzt.",
          "Im Ãœbrigen ist die Haftung fÃ¼r leicht fahrlÃ¤ssig verursachte SchÃ¤den ausgeschlossen.",
          "Insbesondere wird keine Haftung fÃ¼r Datenverluste, entgangene Einsparungen, falsche Eingaben, verspÃ¤tete Erinnerungen, unterbliebene KÃ¼ndigungen oder wirtschaftliche Entscheidungen Ã¼bernommen.",
        ],
      },
      {
        title: "9. Ã„nderungen und Weiterentwicklung",
        bullets: [
          "Der Anbieter darf OctoVault weiterentwickeln, Ã¤ndern, anpassen oder einzelne Funktionen einstellen, soweit berechtigte Interessen der Nutzer berÃ¼cksichtigt werden.",
          "Sicherheitsrelevante, technische oder rechtlich notwendige Ã„nderungen dÃ¼rfen jederzeit vorgenommen werden.",
        ],
      },
      {
        title: "10. Beendigung der Nutzung",
        bullets: [
          "Sie kÃ¶nnen die Nutzung der App jederzeit beenden, indem Sie die App nicht weiter verwenden oder deinstallieren.",
          "Der Anbieter kann die Nutzung aus wichtigem Grund einschrÃ¤nken oder beenden, insbesondere bei Missbrauch, Sicherheitsrisiken oder RechtsverstÃ¶ÃŸen.",
        ],
      },
      {
        title: "11. Anwendbares Recht",
        bullets: [
          "Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts.",
          "Zwingende Verbraucherschutzvorschriften des Landes, in dem Sie Ihren gewÃ¶hnlichen Aufenthalt haben, bleiben unberÃ¼hrt.",
        ],
      },
      {
        title: "12. Verbraucherstreitbeilegung",
        bullets: [
          "Der Anbieter ist nicht verpflichtet und nicht bereit, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.",
        ],
      },
    ],
  },
  privacy: {
    updatedAt: "Stand: 07.04.2026",
    intro: [
      "Diese DatenschutzerklÃ¤rung informiert Ã¼ber die Verarbeitung personenbezogener Daten im Zusammenhang mit der App OctoVault.",
      "Verantwortlich für die Datenverarbeitung ist CornerDesign - Dominic Franz, Erbschlöer Str. 70c, 42369 Wuppertal, Deutschland, E-Mail: info@corner-design.de.",
      "Bei Fragen zum Datenschutz oder zur LÃ¶schung Ihrer Daten kÃ¶nnen Sie sich jederzeit an info@corner-design.de wenden.",
    ],
    sections: [
      {
        title: "1. Allgemeines",
        bullets: [
          "Personenbezogene Daten werden nur verarbeitet, soweit dies fÃ¼r die Bereitstellung der App, die Nutzung einzelner Funktionen, die Sicherheit, die Abwicklung von KÃ¤ufen oder die Kommunikation mit Ihnen erforderlich ist.",
          "OctoVault richtet sich nicht gezielt an Kinder unter 13 Jahren.",
          "Bitte speichern Sie keine unnÃ¶tig sensiblen personenbezogenen Daten in Notizfeldern oder Freitexten.",
        ],
      },
      {
        title: "2. Welche Daten verarbeitet werden",
        bullets: [
          "Kontodaten: technische Benutzer-ID, E-Mail-Adresse, Authentifizierungsstatus, anonyme oder registrierte Nutzung.",
          "Abo-Daten: Name, Kategorie, Preis, Intervall, nÃ¤chste Zahlung, Status, Enddatum, Notizen und weitere von Ihnen eingegebene Inhalte.",
          "Historien-Daten: ZahlungseintrÃ¤ge, ausgelÃ¶ste oder Ã¼bersprungene Zahlungen, manuelle Anpassungen und andere Verlaufsdaten innerhalb der App.",
          "Einstellungsdaten: Sprache, Theme, WÃ¤hrung, Wochenstart, Akzentfarbe, Notification-Einstellungen und Onboarding-Status.",
          "Technische Daten: App-Version, Betriebssystem, GerÃ¤tebezug, Fehlerkontexte und weitere technisch notwendige Diagnosedaten.",
          "Kaufdaten: Informationen Ã¼ber Premium-Freischaltungen, soweit diese Ã¼ber den jeweiligen Store technisch bereitgestellt werden.",
        ],
      },
      {
        title: "3. Zwecke und Rechtsgrundlagen",
        bullets: [
          "Bereitstellung und Nutzung der App-Funktionen: Art. 6 Abs. 1 lit. b DSGVO.",
          "Technischer Betrieb, StabilitÃ¤t, Sicherheit und Missbrauchsverhinderung: Art. 6 Abs. 1 lit. f DSGVO.",
          "Bearbeitung von Support- und Datenschutzanfragen: Art. 6 Abs. 1 lit. b oder lit. f DSGVO.",
          "ErfÃ¼llung rechtlicher Pflichten: Art. 6 Abs. 1 lit. c DSGVO.",
          "Soweit kÃ¼nftig Einwilligungen erforderlich werden, insbesondere fÃ¼r weitergehende Analyse- oder Tracking-Funktionen, erfolgt die Verarbeitung auf Grundlage von Art. 6 Abs. 1 lit. a DSGVO.",
        ],
      },
      {
        title: "4. Kontaktaufnahme per E-Mail",
        bullets: [
          "Wenn Sie per E-Mail Kontakt mit uns aufnehmen, verarbeiten wir die von Ihnen Ã¼bermittelten Daten, insbesondere Ihre E-Mail-Adresse, Ihren Namen, den Inhalt Ihrer Nachricht und gegebenenfalls weitere von Ihnen freiwillig mitgeteilte Informationen.",
          "Diese Daten werden ausschlieÃŸlich verwendet, um Ihre Anfrage zu bearbeiten, RÃ¼ckfragen zu beantworten und Ihr Anliegen zu lÃ¶sen.",
          "Eine aktive Weitergabe dieser Daten an sonstige Dritte erfolgt nicht.",
          "Eine Ãœbermittlung kann nur insoweit stattfinden, wie dies technisch oder rechtlich erforderlich ist, etwa im Rahmen der Ã¼blichen E-Mail-Infrastruktur oder gesetzlicher Verpflichtungen.",
        ],
      },
      {
        title: "5. Lokale Speicherung auf dem GerÃ¤t",
        bullets: [
          "Ein Teil der Daten wird lokal auf Ihrem EndgerÃ¤t gespeichert, damit die App schnell und offline nutzbar bleibt.",
          "Dazu kÃ¶nnen insbesondere Einstellungen, Vorlagen, Onboarding-Status und weitere app-bezogene Nutzungsdaten gehÃ¶ren.",
          "Bei rein lokaler Nutzung kann ein Datenverlust bei GerÃ¤tewechsel, Deinstallation oder SpeicherlÃ¶schung nicht ausgeschlossen werden.",
        ],
      },
      {
        title: "6. Cloud-Speicherung und Konto",
        bullets: [
          "FÃ¼r Konto-, Backup- und Wiederherstellungsfunktionen nutzt OctoVault Firebase Authentication und Firebase Firestore.",
          "Dabei werden Daten Ã¼ber die Infrastruktur von Google Firebase verarbeitet.",
          "Bei anonymer Nutzung kann technisch bereits eine Firebase-Benutzer-ID verwendet werden, damit Daten einer Sitzung zugeordnet werden kÃ¶nnen.",
          "Bei Nutzung mit E-Mail-Adresse werden Kontodaten und zugeordnete App-Daten in Firestore gespeichert, um eine Wiederherstellung und Synchronisation zu ermÃ¶glichen.",
        ],
      },
      {
        title: "7. Firebase als Dienstleister",
        bullets: [
          "Firebase ist ein Dienst der Google-Unternehmensgruppe und wird als technische Infrastruktur fÃ¼r Authentifizierung, Datenbank und App-Betrieb eingesetzt.",
          "Dabei kÃ¶nnen personenbezogene Daten in Rechenzentren innerhalb und auÃŸerhalb der EuropÃ¤ischen Union verarbeitet werden.",
          "Soweit Daten auÃŸerhalb der EU bzw. des EWR verarbeitet werden, erfolgt dies nur auf Grundlage der von Google angebotenen Datenschutz- und Vertragsmechanismen.",
          "Weitere Informationen finden Sie in den Datenschutz- und Firebase-Informationen von Google.",
        ],
      },
      {
        title: "8. Premium-KÃ¤ufe",
        bullets: [
          "Premium-Funktionen werden als In-App-Kauf Ã¼ber den jeweiligen App-Store angeboten.",
          "Die Zahlungsabwicklung selbst erfolgt nicht durch OctoVault, sondern Ã¼ber den jeweiligen Store-Anbieter.",
          "OctoVault verarbeitet nur die fÃ¼r die technische Freischaltung erforderlichen Kauf- und Statusinformationen.",
        ],
      },
      {
        title: "9. Benachrichtigungen",
        bullets: [
          "OctoVault nutzt lokale Benachrichtigungen auf Ihrem GerÃ¤t.",
          "Es werden keine serverseitigen Push-Nachrichten Ã¼ber einen eigenen Push-Backend-Dienst versendet.",
          "Die Steuerung lokaler Benachrichtigungen erfolgt Ã¼ber die App und die Einstellungen Ihres Betriebssystems.",
        ],
      },
      {
        title: "10. Analytics und Crashlytics",
        bullets: [
          "Weitergehende Analyse- und Crash-Tools sind geplant, befinden sich jedoch noch im Aufbau.",
          "Sobald Firebase Analytics, Firebase Crashlytics oder vergleichbare Dienste produktiv aktiviert werden, wird diese DatenschutzerklÃ¤rung entsprechend aktualisiert.",
          "Soweit rechtlich erforderlich, wird vor der Aktivierung eine Einwilligung eingeholt.",
        ],
      },
      {
        title: "11. Werbung und Tracking",
        bullets: [
          "OctoVault schaltet keine Werbung.",
          "Es findet kein externes Werbe-Tracking statt.",
          "Ausgenommen sind technisch notwendige Verarbeitungen Ã¼ber die eingesetzte Firebase-Infrastruktur.",
        ],
      },
      {
        title: "12. Weitergabe von Daten",
        bullets: [
          "Eine aktive Weitergabe Ihrer Daten an sonstige Dritte erfolgt nicht.",
          "Daten werden jedoch an technische Dienstleister Ã¼bermittelt, soweit dies fÃ¼r Hosting, Authentifizierung, Datenbankbetrieb, Store-Abwicklung oder andere Infrastrukturleistungen erforderlich ist.",
          "Zu diesen EmpfÃ¤ngern kann insbesondere Google Firebase gehÃ¶ren.",
        ],
      },
      {
        title: "13. Speicherdauer",
        bullets: [
          "Lokal gespeicherte Daten bleiben auf Ihrem GerÃ¤t, bis Sie diese lÃ¶schen, die App deinstallieren oder der lokale Speicher zurÃ¼ckgesetzt wird.",
          "Cloud-Daten bleiben grundsÃ¤tzlich gespeichert, solange sie fÃ¼r die Bereitstellung Ihres Kontos und der App-Funktionen erforderlich sind.",
          "Eine LÃ¶schung erfolgt derzeit auf Anfrage per E-Mail an info@corner-design.de, soweit keine gesetzlichen Aufbewahrungspflichten entgegenstehen.",
        ],
      },
      {
        title: "14. Ihre Rechte",
        bullets: [
          "Sie haben nach den gesetzlichen Voraussetzungen das Recht auf Auskunft Ã¼ber Ihre gespeicherten personenbezogenen Daten.",
          "Sie haben das Recht auf Berichtigung unrichtiger Daten.",
          "Sie haben das Recht auf LÃ¶schung, EinschrÃ¤nkung der Verarbeitung und DatenÃ¼bertragbarkeit.",
          "Sie haben das Recht, einer Verarbeitung auf Grundlage berechtigter Interessen zu widersprechen.",
          "Sie haben das Recht, eine erteilte Einwilligung jederzeit mit Wirkung fÃ¼r die Zukunft zu widerrufen.",
          "Sie haben das Recht, sich bei einer DatenschutzaufsichtsbehÃ¶rde zu beschweren.",
        ],
      },
      {
        title: "15. Datensicherheit",
        bullets: [
          "Es werden angemessene technische und organisatorische MaÃŸnahmen getroffen, um Ihre Daten zu schÃ¼tzen.",
          "Dennoch ist keine elektronische Speicherung oder Ãœbertragung vollstÃ¤ndig sicher.",
          "Bitte schÃ¼tzen Sie Ihr GerÃ¤t und Ihre Zugangsdaten selbst durch sichere PasswÃ¶rter, Displaysperren und aktuelle Software.",
        ],
      },
      {
        title: "16. Ã„nderungen dieser DatenschutzerklÃ¤rung",
        bullets: [
          "Diese DatenschutzerklÃ¤rung kann angepasst werden, wenn sich die App, die eingesetzten Dienste oder die rechtlichen Anforderungen Ã¤ndern.",
          "MaÃŸgeblich ist die jeweils in der App verÃ¶ffentlichte aktuelle Fassung.",
        ],
      },
    ],
  },
  imprint: {
    updatedAt: "Stand: 07.04.2026",
    intro: [
      "Impressum fÃ¼r die App OctoVault.",
    ],
    sections: [
      {
        title: "Angaben gemÃ¤ÃŸ Â§5 TMG",
        bullets: [
          "CornerDesign",
          "Dominic Franz",
          "Erbschlöer Str. 70c",
          "42369 Wuppertal",
          "Deutschland",
          "E-Mail: info@corner-design.de",
          "Umsatzsteuer-Identifikationsnummer gemÃ¤ÃŸ Â§27a UStG: DE460253596",
          "Kleinunternehmer gemÃ¤ÃŸ Â§19 UStG",
        ],
      },
      {
        title: "Inhaltlich verantwortlich",
        bullets: [
          "Verantwortlich für den Inhalt der App OctoVault: CornerDesign, Dominic Franz, Erbschlöer Str. 70c, 42369 Wuppertal, Deutschland, info@corner-design.de.",
        ],
      },
      {
        title: "Verbraucherstreitbeilegung",
        bullets: [
          "Der Anbieter ist nicht verpflichtet und nicht bereit, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.",
        ],
      },
    ],
  },
};

const englishIntro = {
  terms:
    "The following legal text is provided in German because the app is currently prepared for operation under German law.",
  privacy:
    "The following privacy notice is provided in German because the app is currently prepared for operation under German law.",
  imprint:
    "The following imprint is provided in German because the app is currently prepared for operation under German law.",
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

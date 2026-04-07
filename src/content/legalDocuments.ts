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
      "Diese Nutzungsbedingungen regeln die Nutzung der App OctoVault zwischen Ihnen und dem Anbieter CornerDesign - Dominic Franz, Deutschland, erreichbar unter info@corner-design.de.",
      "Mit dem Download, der Installation oder der Nutzung von OctoVault akzeptieren Sie diese Nutzungsbedingungen.",
    ],
    sections: [
      {
        title: "1. Gegenstand der App",
        bullets: [
          "OctoVault ist eine App zur Verwaltung von Abonnements und wiederkehrenden Zahlungen.",
          "Die App ermöglicht insbesondere das Erfassen von Abonnements, Kategorien, Preisen, Zahlungsintervallen, Notizen, Zahlungs-Historien sowie persönlichen Einstellungen.",
          "Die App kann lokal auf dem Gerät und - je nach Nutzung - auch über eine Cloud-Anbindung mit Firebase genutzt werden.",
        ],
      },
      {
        title: "2. Nutzung der App",
        bullets: [
          "Die Nutzung der kostenlosen Grundfunktionen ist nur für rechtmäßige private oder beruflich-organisatorische Zwecke gestattet.",
          "Sie dürfen keine rechtswidrigen, irreführenden oder missbräuchlichen Inhalte in der App speichern.",
          "Sie sind für die Richtigkeit und Vollständigkeit Ihrer eingegebenen Daten selbst verantwortlich.",
        ],
      },
      {
        title: "3. Konto und Anmeldung",
        bullets: [
          "OctoVault kann teilweise anonym genutzt werden.",
          "Für Backup, Wiederherstellung und Cloud-Speicherung kann ein Konto über Firebase Authentication eingerichtet oder mit einer E-Mail-Adresse verknüpft werden.",
          "Sie sind dafür verantwortlich, Ihre Zugangsdaten vertraulich zu behandeln und vor dem Zugriff unbefugter Dritter zu schützen.",
        ],
      },
      {
        title: "4. Premium-Funktion",
        bullets: [
          "OctoVault kann eine kostenpflichtige Premium-Funktion als In-App-Kauf enthalten.",
          "Die Premium-Freischaltung erfolgt als Einmalzahlung und schaltet insbesondere eine unbegrenzte Anzahl an Abonnements frei.",
          "Die Abwicklung von In-App-Käufen erfolgt über den jeweiligen App-Store-Anbieter. Für Zahlung, Abrechnung, Widerruf und Rückerstattungen gelten zusätzlich die Bedingungen des jeweiligen Stores.",
          "Ein Anspruch auf jederzeit unveränderte Premium-Funktionen besteht nicht, soweit Änderungen aus technischen, rechtlichen oder sicherheitsbezogenen Gründen erforderlich sind.",
        ],
      },
      {
        title: "5. Verfügbarkeit und technische Voraussetzungen",
        bullets: [
          "OctoVault wird nach dem jeweils aktuellen technischen Stand bereitgestellt.",
          "Eine jederzeit unterbrechungsfreie, fehlerfreie und vollständig verfügbare Nutzung kann nicht garantiert werden.",
          "Einschränkungen können insbesondere durch Wartung, technische Störungen, Netzwerkprobleme, App-Store-Vorgaben oder Ausfälle von Drittanbietern wie Firebase entstehen.",
        ],
      },
      {
        title: "6. Daten und Eigenverantwortung",
        bullets: [
          "Sie sind selbst dafür verantwortlich, welche Inhalte Sie in OctoVault speichern, insbesondere in Freitext- oder Notizfeldern.",
          "OctoVault ist nicht für die Speicherung besonders sensibler Daten bestimmt.",
          "Trotz technischer Schutzmaßnahmen kann kein vollständiger Schutz vor Datenverlust, Fehlfunktionen oder unbefugtem Zugriff garantiert werden.",
          "Bei rein lokaler oder anonymer Nutzung kann ein Datenverlust insbesondere bei Gerätewechsel, Deinstallation oder Zurücksetzen des Geräts eintreten.",
        ],
      },
      {
        title: "7. Kein Beratungsangebot",
        bullets: [
          "OctoVault dient ausschließlich der Organisation und Übersicht Ihrer Abonnements und Zahlungen.",
          "Die App stellt keine Finanzberatung, Anlageberatung, Steuerberatung, Rechtsberatung oder sonstige professionelle Beratung dar.",
          "Entscheidungen über Vertragsabschlüsse, Kündigungen, Zahlungen oder finanzielle Verpflichtungen treffen Sie ausschließlich eigenverantwortlich.",
        ],
      },
      {
        title: "8. Haftung",
        bullets: [
          "Der Anbieter haftet unbeschränkt bei Vorsatz und grober Fahrlässigkeit sowie bei Verletzung von Leben, Körper oder Gesundheit.",
          "Bei leicht fahrlässiger Verletzung wesentlicher Vertragspflichten ist die Haftung auf den vorhersehbaren, vertragstypischen Schaden begrenzt.",
          "Im Übrigen ist die Haftung für leicht fahrlässig verursachte Schäden ausgeschlossen.",
          "Insbesondere wird keine Haftung für Datenverluste, entgangene Einsparungen, falsche Eingaben, verspätete Erinnerungen, unterbliebene Kündigungen oder wirtschaftliche Entscheidungen übernommen.",
        ],
      },
      {
        title: "9. Änderungen und Weiterentwicklung",
        bullets: [
          "Der Anbieter darf OctoVault weiterentwickeln, ändern, anpassen oder einzelne Funktionen einstellen, soweit berechtigte Interessen der Nutzer berücksichtigt werden.",
          "Sicherheitsrelevante, technische oder rechtlich notwendige Änderungen dürfen jederzeit vorgenommen werden.",
        ],
      },
      {
        title: "10. Beendigung der Nutzung",
        bullets: [
          "Sie können die Nutzung der App jederzeit beenden, indem Sie die App nicht weiter verwenden oder deinstallieren.",
          "Der Anbieter kann die Nutzung aus wichtigem Grund einschränken oder beenden, insbesondere bei Missbrauch, Sicherheitsrisiken oder Rechtsverstößen.",
        ],
      },
      {
        title: "11. Anwendbares Recht",
        bullets: [
          "Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts.",
          "Zwingende Verbraucherschutzvorschriften des Landes, in dem Sie Ihren gewöhnlichen Aufenthalt haben, bleiben unberührt.",
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
      "Diese Datenschutzerklärung informiert über die Verarbeitung personenbezogener Daten im Zusammenhang mit der App OctoVault.",
      "Verantwortlich für die Datenverarbeitung ist CornerDesign - Dominic Franz, Deutschland, E-Mail: info@corner-design.de.",
      "Bei Fragen zum Datenschutz oder zur Löschung Ihrer Daten können Sie sich jederzeit an info@corner-design.de wenden.",
    ],
    sections: [
      {
        title: "1. Allgemeines",
        bullets: [
          "Personenbezogene Daten werden nur verarbeitet, soweit dies für die Bereitstellung der App, die Nutzung einzelner Funktionen, die Sicherheit, die Abwicklung von Käufen oder die Kommunikation mit Ihnen erforderlich ist.",
          "OctoVault richtet sich nicht gezielt an Kinder unter 13 Jahren.",
          "Bitte speichern Sie keine unnötig sensiblen personenbezogenen Daten in Notizfeldern oder Freitexten.",
        ],
      },
      {
        title: "2. Welche Daten verarbeitet werden",
        bullets: [
          "Kontodaten: technische Benutzer-ID, E-Mail-Adresse, Authentifizierungsstatus, anonyme oder registrierte Nutzung.",
          "Abo-Daten: Name, Kategorie, Preis, Intervall, nächste Zahlung, Status, Enddatum, Notizen und weitere von Ihnen eingegebene Inhalte.",
          "Historien-Daten: Zahlungseinträge, ausgelöste oder übersprungene Zahlungen, manuelle Anpassungen und andere Verlaufsdaten innerhalb der App.",
          "Einstellungsdaten: Sprache, Theme, Währung, Wochenstart, Akzentfarbe, Notification-Einstellungen und Onboarding-Status.",
          "Technische Daten: App-Version, Betriebssystem, Gerätebezug, Fehlerkontexte und weitere technisch notwendige Diagnosedaten.",
          "Kaufdaten: Informationen über Premium-Freischaltungen, soweit diese über den jeweiligen Store technisch bereitgestellt werden.",
        ],
      },
      {
        title: "3. Zwecke und Rechtsgrundlagen",
        bullets: [
          "Bereitstellung und Nutzung der App-Funktionen: Art. 6 Abs. 1 lit. b DSGVO.",
          "Technischer Betrieb, Stabilität, Sicherheit und Missbrauchsverhinderung: Art. 6 Abs. 1 lit. f DSGVO.",
          "Bearbeitung von Support- und Datenschutzanfragen: Art. 6 Abs. 1 lit. b oder lit. f DSGVO.",
          "Erfüllung rechtlicher Pflichten: Art. 6 Abs. 1 lit. c DSGVO.",
          "Soweit künftig Einwilligungen erforderlich werden, insbesondere für weitergehende Analyse- oder Tracking-Funktionen, erfolgt die Verarbeitung auf Grundlage von Art. 6 Abs. 1 lit. a DSGVO.",
        ],
      },
      {
        title: "4. Kontaktaufnahme per E-Mail",
        bullets: [
          "Wenn Sie per E-Mail Kontakt mit uns aufnehmen, verarbeiten wir die von Ihnen übermittelten Daten, insbesondere Ihre E-Mail-Adresse, Ihren Namen, den Inhalt Ihrer Nachricht und gegebenenfalls weitere von Ihnen freiwillig mitgeteilte Informationen.",
          "Diese Daten werden ausschließlich verwendet, um Ihre Anfrage zu bearbeiten, Rückfragen zu beantworten und Ihr Anliegen zu lösen.",
          "Eine aktive Weitergabe dieser Daten an sonstige Dritte erfolgt nicht.",
          "Eine Übermittlung kann nur insoweit stattfinden, wie dies technisch oder rechtlich erforderlich ist, etwa im Rahmen der üblichen E-Mail-Infrastruktur oder gesetzlicher Verpflichtungen.",
        ],
      },
      {
        title: "5. Lokale Speicherung auf dem Gerät",
        bullets: [
          "Ein Teil der Daten wird lokal auf Ihrem Endgerät gespeichert, damit die App schnell und offline nutzbar bleibt.",
          "Dazu können insbesondere Einstellungen, Vorlagen, Onboarding-Status und weitere app-bezogene Nutzungsdaten gehören.",
          "Bei rein lokaler Nutzung kann ein Datenverlust bei Gerätewechsel, Deinstallation oder Speicherlöschung nicht ausgeschlossen werden.",
        ],
      },
      {
        title: "6. Cloud-Speicherung und Konto",
        bullets: [
          "Für Konto-, Backup- und Wiederherstellungsfunktionen nutzt OctoVault Firebase Authentication und Firebase Firestore.",
          "Dabei werden Daten über die Infrastruktur von Google Firebase verarbeitet.",
          "Bei anonymer Nutzung kann technisch bereits eine Firebase-Benutzer-ID verwendet werden, damit Daten einer Sitzung zugeordnet werden können.",
          "Bei Nutzung mit E-Mail-Adresse werden Kontodaten und zugeordnete App-Daten in Firestore gespeichert, um eine Wiederherstellung und Synchronisation zu ermöglichen.",
        ],
      },
      {
        title: "7. Firebase als Dienstleister",
        bullets: [
          "Firebase ist ein Dienst der Google-Unternehmensgruppe und wird als technische Infrastruktur für Authentifizierung, Datenbank und App-Betrieb eingesetzt.",
          "Dabei können personenbezogene Daten in Rechenzentren innerhalb und außerhalb der Europäischen Union verarbeitet werden.",
          "Soweit Daten außerhalb der EU bzw. des EWR verarbeitet werden, erfolgt dies nur auf Grundlage der von Google angebotenen Datenschutz- und Vertragsmechanismen.",
          "Weitere Informationen finden Sie in den Datenschutz- und Firebase-Informationen von Google.",
        ],
      },
      {
        title: "8. Premium-Käufe",
        bullets: [
          "Premium-Funktionen werden als In-App-Kauf über den jeweiligen App-Store angeboten.",
          "Die Zahlungsabwicklung selbst erfolgt nicht durch OctoVault, sondern über den jeweiligen Store-Anbieter.",
          "OctoVault verarbeitet nur die für die technische Freischaltung erforderlichen Kauf- und Statusinformationen.",
        ],
      },
      {
        title: "9. Benachrichtigungen",
        bullets: [
          "OctoVault nutzt lokale Benachrichtigungen auf Ihrem Gerät.",
          "Es werden keine serverseitigen Push-Nachrichten über einen eigenen Push-Backend-Dienst versendet.",
          "Die Steuerung lokaler Benachrichtigungen erfolgt über die App und die Einstellungen Ihres Betriebssystems.",
        ],
      },
      {
        title: "10. Analytics und Crashlytics",
        bullets: [
          "Weitergehende Analyse- und Crash-Tools sind geplant, befinden sich jedoch noch im Aufbau.",
          "Sobald Firebase Analytics, Firebase Crashlytics oder vergleichbare Dienste produktiv aktiviert werden, wird diese Datenschutzerklärung entsprechend aktualisiert.",
          "Soweit rechtlich erforderlich, wird vor der Aktivierung eine Einwilligung eingeholt.",
        ],
      },
      {
        title: "11. Werbung und Tracking",
        bullets: [
          "OctoVault schaltet keine Werbung.",
          "Es findet kein externes Werbe-Tracking statt.",
          "Ausgenommen sind technisch notwendige Verarbeitungen über die eingesetzte Firebase-Infrastruktur.",
        ],
      },
      {
        title: "12. Weitergabe von Daten",
        bullets: [
          "Eine aktive Weitergabe Ihrer Daten an sonstige Dritte erfolgt nicht.",
          "Daten werden jedoch an technische Dienstleister übermittelt, soweit dies für Hosting, Authentifizierung, Datenbankbetrieb, Store-Abwicklung oder andere Infrastrukturleistungen erforderlich ist.",
          "Zu diesen Empfängern kann insbesondere Google Firebase gehören.",
        ],
      },
      {
        title: "13. Speicherdauer",
        bullets: [
          "Lokal gespeicherte Daten bleiben auf Ihrem Gerät, bis Sie diese löschen, die App deinstallieren oder der lokale Speicher zurückgesetzt wird.",
          "Cloud-Daten bleiben grundsätzlich gespeichert, solange sie für die Bereitstellung Ihres Kontos und der App-Funktionen erforderlich sind.",
          "Eine Löschung erfolgt derzeit auf Anfrage per E-Mail an info@corner-design.de, soweit keine gesetzlichen Aufbewahrungspflichten entgegenstehen.",
        ],
      },
      {
        title: "14. Ihre Rechte",
        bullets: [
          "Sie haben nach den gesetzlichen Voraussetzungen das Recht auf Auskunft über Ihre gespeicherten personenbezogenen Daten.",
          "Sie haben das Recht auf Berichtigung unrichtiger Daten.",
          "Sie haben das Recht auf Löschung, Einschränkung der Verarbeitung und Datenübertragbarkeit.",
          "Sie haben das Recht, einer Verarbeitung auf Grundlage berechtigter Interessen zu widersprechen.",
          "Sie haben das Recht, eine erteilte Einwilligung jederzeit mit Wirkung für die Zukunft zu widerrufen.",
          "Sie haben das Recht, sich bei einer Datenschutzaufsichtsbehörde zu beschweren.",
        ],
      },
      {
        title: "15. Datensicherheit",
        bullets: [
          "Es werden angemessene technische und organisatorische Maßnahmen getroffen, um Ihre Daten zu schützen.",
          "Dennoch ist keine elektronische Speicherung oder Übertragung vollständig sicher.",
          "Bitte schützen Sie Ihr Gerät und Ihre Zugangsdaten selbst durch sichere Passwörter, Displaysperren und aktuelle Software.",
        ],
      },
      {
        title: "16. Änderungen dieser Datenschutzerklärung",
        bullets: [
          "Diese Datenschutzerklärung kann angepasst werden, wenn sich die App, die eingesetzten Dienste oder die rechtlichen Anforderungen ändern.",
          "Maßgeblich ist die jeweils in der App veröffentlichte aktuelle Fassung.",
        ],
      },
    ],
  },
  imprint: {
    updatedAt: "Stand: 07.04.2026",
    intro: [
      "Impressum für die App OctoVault.",
    ],
    sections: [
      {
        title: "Angaben gemäß §5 TMG",
        bullets: [
          "CornerDesign",
          "Dominic Franz",
          "E-Mail: info@corner-design.de",
          "Umsatzsteuer-Identifikationsnummer gemäß §27a UStG: DE460253596",
          "Kleinunternehmer gemäß §19 UStG",
        ],
      },
      {
        title: "Inhaltlich verantwortlich",
        bullets: [
          "Verantwortlich für den Inhalt der App OctoVault: CornerDesign, Dominic Franz, info@corner-design.de.",
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

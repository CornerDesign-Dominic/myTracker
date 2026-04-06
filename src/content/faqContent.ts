import type { AppLanguage } from "@/i18n/translations";

export type FAQContentBlock =
  | {
      type: "paragraph";
      text: string;
    }
  | {
      type: "bullets";
      items: string[];
    };

export type FAQItem = {
  id: string;
  title: string;
  content: FAQContentBlock[];
};

export type FAQSection = {
  id: string;
  title: string;
  subtitle: string;
  items: FAQItem[];
};

const deSections: FAQSection[] = [
  {
    id: "account-login",
    title: "Konto & Login",
    subtitle: "Alles rund um Registrierung, E-Mail-Bestätigung und Passwort.",
    items: [
      {
        id: "verification-email-missing",
        title: "Ich bekomme keine Bestätigungs-E-Mail – was kann ich tun?",
        content: [
          {
            type: "paragraph",
            text: "Prüfe zuerst den Spam-Ordner und ob du dich bei der E-Mail-Adresse vertippt hast.",
          },
          {
            type: "bullets",
            items: [
              "Sende die Bestätigungs-Mail in den Einstellungen erneut.",
              "Öffne den Link auf demselben Gerät, auf dem du die Registrierung gestartet hast.",
              "Wenn für die E-Mail schon ein Konto existiert, starte keinen zweiten Registrierungsversuch, sondern nutze stattdessen den Login oder den Passwort-Reset.",
            ],
          },
        ],
      },
      {
        id: "why-confirm-email",
        title: "Warum muss ich meine E-Mail bestätigen?",
        content: [
          {
            type: "paragraph",
            text: "Die Bestätigung stellt sicher, dass die E-Mail wirklich dir gehört, bevor dein anonymer App-Stand mit einem echten Konto verknüpft wird.",
          },
          {
            type: "paragraph",
            text: "Das schützt dich vor Tippfehlern und verhindert, dass Daten versehentlich mit der falschen Adresse verbunden werden.",
          },
        ],
      },
      {
        id: "set-password",
        title: "Wie lege ich mein Passwort fest?",
        content: [
          {
            type: "paragraph",
            text: "Starte die Registrierung in der App, öffne dann den Link aus der Bestätigungs-Mail und kehre damit zurück in OctoVault.",
          },
          {
            type: "paragraph",
            text: "Dort bestätigst du die E-Mail und vergibst direkt dein Passwort. Erst danach wird dein anonymer Nutzer in ein E-Mail-Konto umgewandelt.",
          },
        ],
      },
      {
        id: "forgot-password",
        title: "Ich habe mein Passwort vergessen – was tun?",
        content: [
          {
            type: "paragraph",
            text: "Nutze im Login den Passwort-Reset. Wenn ein Konto zu dieser E-Mail existiert, erhältst du einen Link zum Zurücksetzen.",
          },
          {
            type: "paragraph",
            text: "Wenn du bisher nur anonym genutzt hast und nie eine E-Mail erfolgreich bestätigt hast, gibt es noch kein wiederherstellbares Konto.",
          },
        ],
      },
    ],
  },
  {
    id: "subscriptions",
    title: "Abonnements",
    subtitle: "Was die Status bedeuten und wie Änderungen wirken.",
    items: [
      {
        id: "subscription-statuses",
        title: "Welche Status gibt es für Abonnements?",
        content: [
          {
            type: "bullets",
            items: [
              "Aktiv: Das Abo läuft normal weiter und zukünftige Zahlungen werden eingeplant.",
              "Pausiert: Das Abo bleibt gespeichert, aber kommende Zahlungen werden als ausgesetzt behandelt.",
              "Gekündigt: Es werden keine weiteren zukünftigen Zahlungen mehr geplant.",
            ],
          },
        ],
      },
      {
        id: "pause-subscription",
        title: "Was passiert, wenn ich ein Abo pausiere?",
        content: [
          {
            type: "paragraph",
            text: "Eine Pause stoppt nicht den echten Vertrag beim Anbieter. In OctoVault bedeutet sie nur, dass kommende Zahlungen nicht mehr als reguläre Ausgaben eingeplant werden.",
          },
          {
            type: "paragraph",
            text: "So siehst du schneller, wie viel du durch pausierte Abos sparst oder was aktuell nicht aktiv genutzt wird.",
          },
        ],
      },
      {
        id: "cancel-subscription",
        title: "Was bedeutet „kündigen“ in der App?",
        content: [
          {
            type: "paragraph",
            text: "„Kündigen“ ist in OctoVault nur ein Status für dein eigenes Tracking. Die App kündigt kein Abo bei Netflix, Spotify oder einem anderen Anbieter für dich.",
          },
          {
            type: "paragraph",
            text: "Du musst die echte Kündigung weiterhin beim jeweiligen Anbieter durchführen.",
          },
        ],
      },
      {
        id: "restore-deleted-subscription",
        title: "Kann ich ein gelöschtes Abo wiederherstellen?",
        content: [
          {
            type: "paragraph",
            text: "Aktuell gibt es keine eigene Wiederherstellen-Funktion für gelöschte Abos in der App.",
          },
          {
            type: "paragraph",
            text: "Wenn ein Abo gelöscht wurde, musst du es im Moment neu anlegen. Wenn dein Konto nicht verknüpft war und die App gelöscht wurde, kann auch der gesamte Stand verloren gehen.",
          },
        ],
      },
    ],
  },
  {
    id: "payments-data",
    title: "Zahlungen & Daten",
    subtitle: "Wie Zahlungsplanung und Änderungen in OctoVault funktionieren.",
    items: [
      {
        id: "next-payments",
        title: "Wie werden nächste Zahlungen berechnet?",
        content: [
          {
            type: "paragraph",
            text: "OctoVault nutzt das von dir eingetragene Zahlungsdatum und den gewählten Abrechnungsrhythmus, um zukünftige Termine zu planen.",
          },
          {
            type: "paragraph",
            text: "Wenn ein Abo pausiert oder gekündigt ist, werden zukünftige Zahlungen entsprechend anders behandelt oder nicht mehr neu eingeplant.",
          },
        ],
      },
      {
        id: "change-payment-date",
        title: "Was passiert, wenn ich ein Zahlungsdatum ändere?",
        content: [
          {
            type: "paragraph",
            text: "Die zukünftige Planung wird auf Basis des neuen Datums neu ausgerichtet. Dadurch können sich Kalender, Vorschauen und Statistik ändern.",
          },
          {
            type: "paragraph",
            text: "Vergangene Zahlungen werden dadurch nicht automatisch zu echten Bankdaten. Es bleibt immer dein persönliches Tracking innerhalb der App.",
          },
        ],
      },
      {
        id: "real-charges",
        title: "Sind das echte Abbuchungen?",
        content: [
          {
            type: "paragraph",
            text: "Nein. OctoVault bucht nichts ab und greift nicht auf dein Bankkonto oder deinen App-Store zu.",
          },
          {
            type: "paragraph",
            text: "Die App zeigt dir nur deine eingetragenen oder daraus berechneten Daten, damit du deine Abos im Blick behältst.",
          },
        ],
      },
      {
        id: "paid-total-not-correct",
        title: "Warum stimmt meine Bezahlt-Summe nicht?",
        content: [
          {
            type: "paragraph",
            text: "Prüfe in der Abo-Historie, ob Zahlungen versehentlich doppelt erfasst wurden.",
          },
          {
            type: "paragraph",
            text: "Das kann vor allem dann passieren, wenn frühere Zahlungen manuell verändert oder zusätzliche Einträge in der Historie angelegt wurden.",
          },
        ],
      },
      {
        id: "data-loss-on-delete",
        title: "Was passiert, wenn ich die App lösche?",
        content: [
          {
            type: "paragraph",
            text: "Ohne verknüpftes Konto kann dein lokaler Stand beim Löschen der App verloren gehen.",
          },
          {
            type: "paragraph",
            text: "Mit bestätigter E-Mail und Passwort ist eine Wiederherstellung deutlich besser vorbereitet, weil dein App-Stand mit deinem Konto verbunden werden kann.",
          },
        ],
      },
    ],
  },
  {
    id: "app-usage",
    title: "App-Nutzung & Funktionen",
    subtitle: "Was Kalender, Statistik und Einstellungen für dich tun.",
    items: [
      {
        id: "statistics",
        title: "Was zeigt mir die Statistik?",
        content: [
          {
            type: "paragraph",
            text: "Die Statistik fasst deine eingeplanten und bisherigen Abo-Kosten übersichtlich zusammen.",
          },
          {
            type: "bullets",
            items: [
              "monatliche und jährliche Gesamtkosten",
              "teure oder auffällige Abos",
              "Entwicklung von Kosten und Einsparungen",
            ],
          },
        ],
      },
      {
        id: "calendar",
        title: "Wie funktioniert der Kalender?",
        content: [
          {
            type: "paragraph",
            text: "Im Kalender siehst du, an welchen Tagen geplante Zahlungen anstehen. Die Einträge basieren auf deinen in der App gepflegten Abo-Daten.",
          },
          {
            type: "paragraph",
            text: "Wenn ein Abo pausiert, gekündigt oder noch ohne zukünftige Termine ist, können dort entsprechend keine Einträge erscheinen.",
          },
        ],
      },
      {
        id: "export",
        title: "Kann ich meine Daten exportieren?",
        content: [
          {
            type: "paragraph",
            text: "Aktuell gibt es in der App keine Export-Funktion für CSV, PDF oder ähnliche Formate.",
          },
          {
            type: "paragraph",
            text: "Wenn du Daten sichern möchtest, ist ein verknüpftes Konto im Moment die sinnvollste verfügbare Grundlage.",
          },
        ],
      },
      {
        id: "settings",
        title: "Was kann ich in den Einstellungen anpassen?",
        content: [
          {
            type: "bullets",
            items: [
              "Sprache",
              "Währung",
              "Theme",
              "Wochenstart",
              "Konto-Verknüpfung und Passwort",
            ],
          },
          {
            type: "paragraph",
            text: "Diese Optionen ändern nur die Darstellung und Bedienung in der App. Sie haben keinen Einfluss auf echte Verträge oder Abbuchungen.",
          },
        ],
      },
    ],
  },
  {
    id: "problems",
    title: "Probleme & Fehler",
    subtitle: "Die häufigsten Ursachen bei scheinbar fehlenden Daten oder falschen Zahlen.",
    items: [
      {
        id: "data-missing",
        title: "Meine Daten sind weg – was tun?",
        content: [
          {
            type: "paragraph",
            text: "Prüfe zuerst, ob du noch in derselben App-Sitzung oder demselben Konto bist. Ohne verknüpftes Konto kann ein Gerätewechsel, Logout oder das Löschen der App dazu führen, dass Daten nicht mehr verfügbar sind.",
          },
          {
            type: "paragraph",
            text: "Wenn du dein Konto bereits mit E-Mail und Passwort verknüpft hast, melde dich erneut an und prüfe danach deine Übersicht.",
          },
        ],
      },
      {
        id: "numbers-dont-match",
        title: "Warum stimmen meine Zahlen nicht?",
        content: [
          {
            type: "paragraph",
            text: "Meistens liegt das an einem geänderten Zahlungsdatum, einem pausierten oder gekündigten Status oder an einem Betrag, der nicht mehr aktuell ist.",
          },
          {
            type: "bullets",
            items: [
              "Prüfe Betrag, Rhythmus und nächstes Zahlungsdatum.",
              "Prüfe, ob das Abo aktiv, pausiert oder gekündigt ist.",
              "Prüfe, ob alte manuelle Zahlungen oder Historien-Einträge noch zu deinem aktuellen Stand passen.",
            ],
          },
        ],
      },
      {
        id: "calendar-empty",
        title: "Ich sehe keine Zahlungen im Kalender",
        content: [
          {
            type: "paragraph",
            text: "Dann gibt es für den aktuell sichtbaren Zeitraum wahrscheinlich keine geplanten Zahlungen oder die zugrunde liegenden Abo-Daten sind unvollständig.",
          },
          {
            type: "paragraph",
            text: "Prüfe vor allem das nächste Zahlungsdatum, den Rhythmus und ob das Abo gerade aktiv ist.",
          },
        ],
      },
    ],
  },
  {
    id: "privacy-security",
    title: "Datenschutz & Sicherheit",
    subtitle: "Kurz und ehrlich: was gespeichert wird und was nicht.",
    items: [
      {
        id: "stored-data",
        title: "Welche Daten werden gespeichert?",
        content: [
          {
            type: "paragraph",
            text: "Gespeichert werden vor allem die Daten, die du in OctoVault selbst anlegst, zum Beispiel deine Abos, Einstellungen und bei Bedarf deine Konto-Verknüpfung.",
          },
          {
            type: "paragraph",
            text: "Deine echte E-Mail wird erst nach erfolgreicher Bestätigung und Verknüpfung zum eigentlichen Login-Konto. Vorher bleibt sie Teil der laufenden Registrierung.",
          },
        ],
      },
      {
        id: "who-has-access",
        title: "Wer hat Zugriff auf meine Daten?",
        content: [
          {
            type: "paragraph",
            text: "Deine Daten sind für die App-Funktionen vorgesehen und nicht öffentlich sichtbar. Ohne deine Anmeldung auf einem anderen Gerät sollte niemand einfach auf deinen persönlichen Stand zugreifen können.",
          },
          {
            type: "paragraph",
            text: "Wichtig für dich: Wenn du anonym bleibst und das Gerät verlierst oder zurücksetzt, kann dein Stand trotzdem verloren gehen.",
          },
        ],
      },
      {
        id: "data-sold",
        title: "Werden meine Daten verkauft?",
        content: [
          {
            type: "paragraph",
            text: "Nein. OctoVault verkauft deine Daten nicht.",
          },
          {
            type: "paragraph",
            text: "Wenn du mehr Details möchtest, schau zusätzlich in die Datenschutzhinweise der App.",
          },
        ],
      },
    ],
  },
];

const enSections: FAQSection[] = [
  {
    id: "account-login",
    title: "Account & login",
    subtitle: "Everything about registration, email confirmation, and password setup.",
    items: [
      {
        id: "verification-email-missing",
        title: "I am not receiving the confirmation email. What can I do?",
        content: [
          {
            type: "paragraph",
            text: "First check your spam folder and make sure you did not enter the wrong email address.",
          },
          {
            type: "bullets",
            items: [
              "Send the confirmation email again from Settings.",
              "Open the link on the same device where you started the registration.",
              "If an account already exists for that email, do not start a second registration. Use login or password reset instead.",
            ],
          },
        ],
      },
      {
        id: "why-confirm-email",
        title: "Why do I need to confirm my email?",
        content: [
          {
            type: "paragraph",
            text: "The confirmation makes sure the email address really belongs to you before your anonymous app state is linked to a real account.",
          },
          {
            type: "paragraph",
            text: "This protects you from typos and prevents your data from being linked to the wrong address.",
          },
        ],
      },
      {
        id: "set-password",
        title: "How do I set my password?",
        content: [
          {
            type: "paragraph",
            text: "Start the registration in the app, open the link from the confirmation email, and return to OctoVault through that link.",
          },
          {
            type: "paragraph",
            text: "There you confirm the email and set your password directly. Only after that is your anonymous user upgraded to an email account.",
          },
        ],
      },
      {
        id: "forgot-password",
        title: "I forgot my password. What should I do?",
        content: [
          {
            type: "paragraph",
            text: "Use the password reset from the login screen. If an account exists for that email, you will receive a reset link.",
          },
          {
            type: "paragraph",
            text: "If you only used the app anonymously and never completed email confirmation, there is no restorable account yet.",
          },
        ],
      },
    ],
  },
  {
    id: "subscriptions",
    title: "Subscriptions",
    subtitle: "What the statuses mean and how changes affect your tracking.",
    items: [
      {
        id: "subscription-statuses",
        title: "Which statuses exist for subscriptions?",
        content: [
          {
            type: "bullets",
            items: [
              "Active: The subscription continues normally and future payments are planned.",
              "Paused: The subscription stays saved, but future payments are treated as skipped.",
              "Cancelled: No further future payments are planned.",
            ],
          },
        ],
      },
      {
        id: "pause-subscription",
        title: "What happens when I pause a subscription?",
        content: [
          {
            type: "paragraph",
            text: "A pause does not stop the real contract with the provider. Inside OctoVault it only means future payments are no longer treated as normal upcoming costs.",
          },
          {
            type: "paragraph",
            text: "This helps you see more clearly how much you save or which subscriptions are currently not in use.",
          },
        ],
      },
      {
        id: "cancel-subscription",
        title: "What does “cancel” mean inside the app?",
        content: [
          {
            type: "paragraph",
            text: "“Cancel” is only a tracking status inside OctoVault. The app does not cancel anything with Netflix, Spotify, or any other provider for you.",
          },
          {
            type: "paragraph",
            text: "You still need to cancel the real subscription directly with the provider.",
          },
        ],
      },
      {
        id: "restore-deleted-subscription",
        title: "Can I restore a deleted subscription?",
        content: [
          {
            type: "paragraph",
            text: "At the moment there is no built-in restore feature for deleted subscriptions.",
          },
          {
            type: "paragraph",
            text: "If a subscription was deleted, you currently need to create it again. If your account was never linked and the app was removed, your full local state may also be lost.",
          },
        ],
      },
    ],
  },
  {
    id: "payments-data",
    title: "Payments & data",
    subtitle: "How scheduling and payment changes work inside OctoVault.",
    items: [
      {
        id: "next-payments",
        title: "How are upcoming payments calculated?",
        content: [
          {
            type: "paragraph",
            text: "OctoVault uses the payment date and billing cycle you entered to plan future payment dates.",
          },
          {
            type: "paragraph",
            text: "If a subscription is paused or cancelled, future payments are handled differently or are no longer planned.",
          },
        ],
      },
      {
        id: "change-payment-date",
        title: "What happens if I change a payment date?",
        content: [
          {
            type: "paragraph",
            text: "The future schedule is recalculated based on the new date. That can affect the calendar, previews, and statistics.",
          },
          {
            type: "paragraph",
            text: "Past entries do not become real bank data because of that change. Everything remains your own subscription tracking inside the app.",
          },
        ],
      },
      {
        id: "real-charges",
        title: "Are these real charges?",
        content: [
          {
            type: "paragraph",
            text: "No. OctoVault does not charge money and does not connect to your bank account or app store billing.",
          },
          {
            type: "paragraph",
            text: "It only shows the subscription data you entered or the dates calculated from it so you can keep track of your subscriptions.",
          },
        ],
      },
      {
        id: "paid-total-not-correct",
        title: "Why does my paid total look wrong?",
        content: [
          {
            type: "paragraph",
            text: "Check the subscription history to see whether payments were recorded twice by mistake.",
          },
          {
            type: "paragraph",
            text: "This can happen especially when older payments were changed manually or additional history entries were created.",
          },
        ],
      },
      {
        id: "data-loss-on-delete",
        title: "What happens if I delete the app?",
        content: [
          {
            type: "paragraph",
            text: "Without a linked account, your local app state may be lost when you remove the app.",
          },
          {
            type: "paragraph",
            text: "With a confirmed email and password, restoring your setup is much better prepared because your app state can be linked to your account.",
          },
        ],
      },
    ],
  },
  {
    id: "app-usage",
    title: "Using the app & features",
    subtitle: "What calendar, statistics, and settings are meant to help with.",
    items: [
      {
        id: "statistics",
        title: "What does the statistics area show?",
        content: [
          {
            type: "paragraph",
            text: "The statistics area summarizes your planned and recorded subscription costs in a clearer way.",
          },
          {
            type: "bullets",
            items: [
              "monthly and yearly totals",
              "expensive or noticeable subscriptions",
              "cost and savings development",
            ],
          },
        ],
      },
      {
        id: "calendar",
        title: "How does the calendar work?",
        content: [
          {
            type: "paragraph",
            text: "The calendar shows days with planned subscription payments. These entries are based on the subscription data you maintain in the app.",
          },
          {
            type: "paragraph",
            text: "If a subscription is paused, cancelled, or missing future dates, there may be no entries to show there.",
          },
        ],
      },
      {
        id: "export",
        title: "Can I export my data?",
        content: [
          {
            type: "paragraph",
            text: "At the moment the app does not include an export feature for CSV, PDF, or similar formats.",
          },
          {
            type: "paragraph",
            text: "If you want a more reliable setup, linking your account is currently the best available basis.",
          },
        ],
      },
      {
        id: "settings",
        title: "What can I change in Settings?",
        content: [
          {
            type: "bullets",
            items: [
              "language",
              "currency",
              "theme",
              "week start",
              "account linking and password",
            ],
          },
          {
            type: "paragraph",
            text: "These options only affect how the app looks and behaves for you. They do not change any real subscription with a provider.",
          },
        ],
      },
    ],
  },
  {
    id: "problems",
    title: "Problems & errors",
    subtitle: "The most common reasons for missing data or confusing totals.",
    items: [
      {
        id: "data-missing",
        title: "My data is gone. What should I do?",
        content: [
          {
            type: "paragraph",
            text: "First check whether you are still in the same app session or signed into the same account. Without a linked account, switching devices, logging out, or deleting the app can make your data unavailable.",
          },
          {
            type: "paragraph",
            text: "If you already linked your account with email and password, sign in again and then check your overview.",
          },
        ],
      },
      {
        id: "numbers-dont-match",
        title: "Why do my numbers look wrong?",
        content: [
          {
            type: "paragraph",
            text: "This is usually caused by a changed payment date, a paused or cancelled subscription, or an outdated amount.",
          },
          {
            type: "bullets",
            items: [
              "Check amount, billing cycle, and next payment date.",
              "Check whether the subscription is active, paused, or cancelled.",
              "Check whether old manual payments or history entries still match your current setup.",
            ],
          },
        ],
      },
      {
        id: "calendar-empty",
        title: "I do not see any payments in the calendar",
        content: [
          {
            type: "paragraph",
            text: "That usually means there are no planned payments in the currently visible period or the subscription data is incomplete.",
          },
          {
            type: "paragraph",
            text: "Check the next payment date, billing cycle, and whether the subscription is active.",
          },
        ],
      },
    ],
  },
  {
    id: "privacy-security",
    title: "Privacy & security",
    subtitle: "Short and honest answers about what is stored and what is not.",
    items: [
      {
        id: "stored-data",
        title: "What data is stored?",
        content: [
          {
            type: "paragraph",
            text: "Mostly the data you create in OctoVault yourself, such as subscriptions, app settings, and when needed your account linking state.",
          },
          {
            type: "paragraph",
            text: "Your real email only becomes the actual auth email after a successful confirmation and account upgrade. Before that it stays part of the pending registration.",
          },
        ],
      },
      {
        id: "who-has-access",
        title: "Who has access to my data?",
        content: [
          {
            type: "paragraph",
            text: "Your data is meant for the app features and is not public. Without your sign-in on another device, other people should not simply see your personal app state.",
          },
          {
            type: "paragraph",
            text: "What matters for you: if you stay anonymous and lose or reset the device, your data can still be lost.",
          },
        ],
      },
      {
        id: "data-sold",
        title: "Is my data sold?",
        content: [
          {
            type: "paragraph",
            text: "No. OctoVault does not sell your data.",
          },
          {
            type: "paragraph",
            text: "If you want the full legal details, also check the app privacy policy.",
          },
        ],
      },
    ],
  },
];

export const getFAQSections = (language: AppLanguage): FAQSection[] =>
  language === "en" ? enSections : deSections;

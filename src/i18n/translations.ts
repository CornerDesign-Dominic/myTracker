export type AppLanguage = "de" | "en";

type TranslationLeaf = string;
type TranslationTree = {
  [key: string]: TranslationLeaf | TranslationTree;
};

export const translations: Record<AppLanguage, TranslationTree> = {
  de: {
    common: {
      home: "Überblick",
      subscriptions: "Abonnements",
      stats: "Statistik",
      settings: "Einstellungen",
      details: "Details",
      save: "Speichern",
      cancel: "Abbrechen",
      search: "Suche",
      loading: "Lade Abos...",
      none: "-",
    },
    tabs: {
      home: "Home",
      allSubscriptions: "Alle Abos",
      stats: "Statistik",
    },
    settings: {
      title: "Einstellungen",
      subtitle: "Wähle deine bevorzugten Optionen für Sprache, Währung und Theme.",
      language: "Sprache",
      currency: "Währung",
      theme: "Theme",
      languageDe: "DE",
      languageEn: "EN",
      currencyEur: "EUR",
      currencyDollar: "Dollar",
      themeDark: "Dark",
      themeLight: "Light",
    },
    home: {
      monthPaymentSingular: "Zahlung",
      monthPaymentPlural: "Zahlungen",
      emptyTitle: "Noch keine Abos sichtbar",
      emptyDescription:
        "Lege dein erstes Abo an oder blende gekündigte Einträge wieder ein.",
      settingsA11y: "Einstellungen öffnen",
    },
    allSubscriptions: {
      title: "Abonnements",
      totalSubscriptions: "{{count}} Abos gesamt",
      yearlySpend: "Jährliche Ausgaben insgesamt",
      createAnother: "Weiteren anlegen",
      searchTitle: "Suche",
      searchPlaceholder: "Abo suchen",
      management: "Verwaltung",
      entries: "{{count}} Einträge",
      emptyTitle: "Noch keine Abos vorhanden",
      emptyDescription:
        "Lege dein erstes Abo an oder passe die Suche an, um bestehende Einträge zu sehen.",
      price: "Preis",
      billingCycle: "Billing Cycle",
      nextPayment: "Nächste Zahlung",
    },
    stats: {
      title: "Statistiken",
      subtitle: "Fokus auf die wichtigsten Kennzahlen für schnelle Entscheidungen.",
      monthlySpend: "Monatliche Ausgaben",
      yearlySpend: "Jährliche Ausgaben",
      mostExpensive: "Teuerstes Abo",
      noActive: "Noch kein aktives Abo vorhanden.",
      byCategory: "Ausgaben nach Kategorie",
      noCategories: "Noch keine Kategorien",
      noCategoriesDescription:
        "Sobald du Abos anlegst, erscheinen hier einfache Auswertungen.",
      upcomingPayments: "Nächste Zahlungen",
      noUpcoming: "Keine nächsten Zahlungen vorhanden.",
    },
    subscription: {
      formCreateTitle: "Abo hinzufügen",
      formEditTitle: "Abo bearbeiten",
      formSubtitle:
        "Wenige Felder, klare Struktur und vorbereitet für spätere Erweiterungen.",
      name: "Name",
      category: "Kategorie",
      price: "Preis",
      currency: "Währung",
      billingCycle: "Abrechnungsintervall",
      nextPaymentDate: "Nächstes Zahlungsdatum",
      cancellationDeadline: "Kündigungsfrist",
      status: "Status",
      endDate: "Läuft ab am",
      notes: "Notizen",
      dateHelp: "Bitte im Format JJJJ-MM-TT eingeben.",
      optional: "Optional",
      create: "Abo anlegen",
      edit: "Abo bearbeiten",
      detailsNotFound: "Abo nicht gefunden.",
      createdAt: "Erstellt",
      updatedAt: "Aktualisiert",
      editAction: "Abo bearbeiten",
      validationRequired: "Name und Kategorie sind Pflichtfelder.",
      validationPrice: "Bitte einen gültigen Preis angeben.",
      validationNextPayment:
        "Bitte ein gültiges nächstes Zahlungsdatum im Format JJJJ-MM-TT angeben.",
      validationCancellation: "Die Kündigungsfrist braucht das Format JJJJ-MM-TT.",
      validationEndDate: "Das Enddatum braucht das Format JJJJ-MM-TT.",
      formAlertTitle: "Formular prüfen",
      standardPlan: "Standard Plan",
      businessRenewal: "Business renewal due next month",
      markCancelled: "Als gekündigt markieren",
      status_active: "Aktiv",
      status_paused: "Pausiert",
      status_cancelled: "Gekündigt",
      billing_monthly: "Monatlich",
      billing_yearly: "Jährlich",
      billing_quarterly: "Quartal",
    },
  },
  en: {
    common: {
      home: "Overview",
      subscriptions: "Subscriptions",
      stats: "Statistics",
      settings: "Settings",
      details: "Details",
      save: "Save",
      cancel: "Cancel",
      search: "Search",
      loading: "Loading subscriptions...",
      none: "-",
    },
    tabs: {
      home: "Home",
      allSubscriptions: "All subscriptions",
      stats: "Stats",
    },
    settings: {
      title: "Settings",
      subtitle: "Choose your preferred language, currency, and theme.",
      language: "Language",
      currency: "Currency",
      theme: "Theme",
      languageDe: "DE",
      languageEn: "EN",
      currencyEur: "EUR",
      currencyDollar: "Dollar",
      themeDark: "Dark",
      themeLight: "Light",
    },
    home: {
      monthPaymentSingular: "payment",
      monthPaymentPlural: "payments",
      emptyTitle: "No subscriptions visible yet",
      emptyDescription:
        "Create your first subscription or bring cancelled entries back into view.",
      settingsA11y: "Open settings",
    },
    allSubscriptions: {
      title: "Subscriptions",
      totalSubscriptions: "{{count}} subscriptions total",
      yearlySpend: "Total yearly spend",
      createAnother: "Create another",
      searchTitle: "Search",
      searchPlaceholder: "Search subscription",
      management: "Management",
      entries: "{{count}} entries",
      emptyTitle: "No subscriptions yet",
      emptyDescription:
        "Create your first subscription or adjust the search to see existing entries.",
      price: "Price",
      billingCycle: "Billing cycle",
      nextPayment: "Next payment",
    },
    stats: {
      title: "Statistics",
      subtitle: "Focus on the most useful numbers for quick decisions.",
      monthlySpend: "Monthly spend",
      yearlySpend: "Yearly spend",
      mostExpensive: "Most expensive subscription",
      noActive: "No active subscription yet.",
      byCategory: "Spend by category",
      noCategories: "No categories yet",
      noCategoriesDescription:
        "As soon as you add subscriptions, simple evaluations will appear here.",
      upcomingPayments: "Upcoming payments",
      noUpcoming: "No upcoming payments available.",
    },
    subscription: {
      formCreateTitle: "Add subscription",
      formEditTitle: "Edit subscription",
      formSubtitle:
        "A focused form with a clean structure, ready for future expansion.",
      name: "Name",
      category: "Category",
      price: "Price",
      currency: "Currency",
      billingCycle: "Billing cycle",
      nextPaymentDate: "Next payment date",
      cancellationDeadline: "Cancellation deadline",
      status: "Status",
      endDate: "Runs until",
      notes: "Notes",
      dateHelp: "Please use the format YYYY-MM-DD.",
      optional: "Optional",
      create: "Create subscription",
      edit: "Edit subscription",
      detailsNotFound: "Subscription not found.",
      createdAt: "Created",
      updatedAt: "Updated",
      editAction: "Edit subscription",
      validationRequired: "Name and category are required.",
      validationPrice: "Please enter a valid price.",
      validationNextPayment:
        "Please enter a valid next payment date in the format YYYY-MM-DD.",
      validationCancellation: "The cancellation deadline must use the format YYYY-MM-DD.",
      validationEndDate: "The end date must use the format YYYY-MM-DD.",
      formAlertTitle: "Check form",
      standardPlan: "Standard plan",
      businessRenewal: "Business renewal due next month",
      markCancelled: "Mark as cancelled",
      status_active: "Active",
      status_paused: "Paused",
      status_cancelled: "Cancelled",
      billing_monthly: "Monthly",
      billing_yearly: "Yearly",
      billing_quarterly: "Quarterly",
    },
  },
};

export type TranslationKey =
  | "common.home"
  | "common.subscriptions"
  | "common.stats"
  | "common.settings"
  | "common.details"
  | "common.save"
  | "common.cancel"
  | "common.search"
  | "common.loading"
  | "common.none"
  | "tabs.home"
  | "tabs.allSubscriptions"
  | "tabs.stats"
  | "settings.title"
  | "settings.subtitle"
  | "settings.language"
  | "settings.currency"
  | "settings.theme"
  | "settings.languageDe"
  | "settings.languageEn"
  | "settings.currencyEur"
  | "settings.currencyDollar"
  | "settings.themeDark"
  | "settings.themeLight"
  | "home.monthPaymentSingular"
  | "home.monthPaymentPlural"
  | "home.emptyTitle"
  | "home.emptyDescription"
  | "home.settingsA11y"
  | "allSubscriptions.title"
  | "allSubscriptions.totalSubscriptions"
  | "allSubscriptions.yearlySpend"
  | "allSubscriptions.createAnother"
  | "allSubscriptions.searchTitle"
  | "allSubscriptions.searchPlaceholder"
  | "allSubscriptions.management"
  | "allSubscriptions.entries"
  | "allSubscriptions.emptyTitle"
  | "allSubscriptions.emptyDescription"
  | "allSubscriptions.price"
  | "allSubscriptions.billingCycle"
  | "allSubscriptions.nextPayment"
  | "stats.title"
  | "stats.subtitle"
  | "stats.monthlySpend"
  | "stats.yearlySpend"
  | "stats.mostExpensive"
  | "stats.noActive"
  | "stats.byCategory"
  | "stats.noCategories"
  | "stats.noCategoriesDescription"
  | "stats.upcomingPayments"
  | "stats.noUpcoming"
  | "subscription.formCreateTitle"
  | "subscription.formEditTitle"
  | "subscription.formSubtitle"
  | "subscription.name"
  | "subscription.category"
  | "subscription.price"
  | "subscription.currency"
  | "subscription.billingCycle"
  | "subscription.nextPaymentDate"
  | "subscription.cancellationDeadline"
  | "subscription.status"
  | "subscription.endDate"
  | "subscription.notes"
  | "subscription.dateHelp"
  | "subscription.optional"
  | "subscription.create"
  | "subscription.edit"
  | "subscription.detailsNotFound"
  | "subscription.createdAt"
  | "subscription.updatedAt"
  | "subscription.editAction"
  | "subscription.validationRequired"
  | "subscription.validationPrice"
  | "subscription.validationNextPayment"
  | "subscription.validationCancellation"
  | "subscription.validationEndDate"
  | "subscription.formAlertTitle"
  | "subscription.standardPlan"
  | "subscription.businessRenewal"
  | "subscription.markCancelled"
  | "subscription.status_active"
  | "subscription.status_paused"
  | "subscription.status_cancelled"
  | "subscription.billing_monthly"
  | "subscription.billing_yearly"
  | "subscription.billing_quarterly";

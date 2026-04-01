type CurrencySetting = "EUR" | "Dollar";

const toCurrencyCode = (currency: CurrencySetting | string) =>
  currency === "Dollar" ? "USD" : currency;

const toLocaleTag = (locale?: string) => {
  if (!locale) {
    return Intl.NumberFormat().resolvedOptions().locale || "de-DE";
  }

  if (locale === "de") {
    return "de-DE";
  }

  if (locale === "en") {
    return "en-US";
  }

  return locale;
};

export const formatCurrency = (
  value: number,
  currency: CurrencySetting | string = "EUR",
  locale?: string,
  options?: Intl.NumberFormatOptions,
) =>
  new Intl.NumberFormat(toLocaleTag(locale), {
    style: "currency",
    currency: toCurrencyCode(currency),
    minimumFractionDigits: 2,
    ...options,
  }).format(value);

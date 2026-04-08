type CurrencySetting = "EUR" | "Dollar";

const toCurrencyCode = (currency: CurrencySetting | string) =>
  currency === "Dollar" ? "USD" : currency;

const toCurrencyLocaleTag = (currency: CurrencySetting | string) =>
  currency === "Dollar" ? "en-US" : "de-DE";

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
  new Intl.NumberFormat(locale ? toLocaleTag(locale) : toCurrencyLocaleTag(currency), {
    style: "currency",
    currency: toCurrencyCode(currency),
    minimumFractionDigits: 2,
    ...options,
  }).format(value);

export const formatAmountInputValue = (
  value: number,
  currency: CurrencySetting | string = "EUR",
  options?: Intl.NumberFormatOptions,
) =>
  new Intl.NumberFormat(toCurrencyLocaleTag(currency), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  }).format(value);

export const parseAmountInput = (
  value: string,
  currency: CurrencySetting | string = "EUR",
) => {
  const trimmed = value.trim();

  if (!trimmed) {
    return Number.NaN;
  }

  if (currency === "Dollar") {
    return Number(trimmed.replace(/,/g, ""));
  }

  return Number(trimmed.replace(/\./g, "").replace(/,/g, "."));
};

export const sanitizeAmountInput = (
  value: string,
  currency: CurrencySetting | string = "EUR",
) => {
  const decimalSeparator = currency === "Dollar" ? "." : ",";
  const alternateDecimalSeparator = currency === "Dollar" ? "," : ".";
  let nextValue = value.replace(new RegExp(`[^0-9\\${decimalSeparator}\\${alternateDecimalSeparator}]`, "g"), "");

  nextValue = nextValue.replace(new RegExp(`\\${alternateDecimalSeparator}`, "g"), decimalSeparator);

  const firstDecimalIndex = nextValue.indexOf(decimalSeparator);
  if (firstDecimalIndex >= 0) {
    nextValue =
      nextValue.slice(0, firstDecimalIndex + 1) +
      nextValue.slice(firstDecimalIndex + 1).replace(new RegExp(`\\${decimalSeparator}`, "g"), "");
  }

  return nextValue;
};

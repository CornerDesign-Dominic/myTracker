type CurrencySetting = "EUR" | "Dollar";

const toCurrencyCode = (currency: CurrencySetting | string) =>
  currency === "Dollar" ? "USD" : currency;

export const formatCurrency = (value: number, currency: CurrencySetting | string = "EUR") =>
  new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: toCurrencyCode(currency),
    minimumFractionDigits: 2,
  }).format(value);

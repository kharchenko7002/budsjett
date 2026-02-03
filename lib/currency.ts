export const CURRENCY_COOKIE = "budsjet_currency";
export type Currency = "NOK" | "USD" | "EUR";

export function normalizeCurrency(v: unknown): Currency {
  if (v === "USD" || v === "EUR" || v === "NOK") return v;
  return "NOK";
}

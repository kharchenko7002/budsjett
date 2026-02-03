"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Currency } from "@/lib/currency";

type Rates = { usdToNok: number; eurToNok: number; updatedUtc: string | null };

type Ctx = {
  currency: Currency;
  setCurrency: (c: Currency) => Promise<void>;
  rates: Rates | null;
  formatFromOre: (ore: number) => string;
  convertFromOre: (ore: number) => number;
  hydrated: boolean;
};

const CurrencyContext = createContext<Ctx | null>(null);

export function useCurrency() {
  const v = useContext(CurrencyContext);
  if (!v) throw new Error("CurrencyProvider missing");
  return v;
}

export default function CurrencyProvider({
  initialCurrency,
  children,
}: {
  initialCurrency: Currency;
  children: React.ReactNode;
}) {
  const [currency, setCurrencyState] = useState<Currency>(initialCurrency);
  const [rates, setRates] = useState<Rates | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    fetch("/api/exchange/rates", { cache: "no-store" })
      .then(async (r) => {
        const j = await r.json().catch(() => null);
        if (!r.ok || !j) throw new Error("Feil");
        return j as Rates;
      })
      .then((j) => setRates(j))
      .catch(() => setRates(null));
  }, []);

  async function setCurrency(c: Currency) {
    setCurrencyState(c);
    await fetch("/api/settings/currency", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currency: c }),
    });
  }

  function convertFromOre(ore: number) {
    const nok = ore / 100;
    if (currency === "NOK") return nok;
    if (!rates) return nok;
    if (currency === "USD") return nok / rates.usdToNok;
    return nok / rates.eurToNok;
  }

  function formatFromOre(ore: number) {
    const value = convertFromOre(ore);
    return new Intl.NumberFormat("nb-NO", { style: "currency", currency }).format(value);
  }

  const ctx = useMemo<Ctx>(
    () => ({ currency, setCurrency, rates, formatFromOre, convertFromOre, hydrated }),
    [currency, rates, hydrated]
  );

  return <CurrencyContext.Provider value={ctx}>{children}</CurrencyContext.Provider>;
}

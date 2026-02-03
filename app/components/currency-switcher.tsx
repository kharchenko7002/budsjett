"use client";

import { useCurrency } from "@/app/providers/currency-provider";

export default function CurrencySwitcher() {
  const { currency, setCurrency, rates, hydrated } = useCurrency();

  return (
    <div className="flex items-center gap-2">
      <div className="hidden text-xs text-slate-400 md:block">
        {!hydrated ? "" : rates?.updatedUtc ? `Oppdatert: ${rates.updatedUtc}` : "Kurs: ikke tilgjengelig"}
      </div>

      <div className="inline-flex rounded-xl border border-white/10 bg-white/5 p-1">
        <button
          onClick={() => setCurrency("NOK")}
          className={`rounded-lg px-3 py-2 text-xs transition ${currency === "NOK" ? "bg-white/10" : "hover:bg-white/5"}`}
        >
          NOK
        </button>
        <button
          onClick={() => setCurrency("USD")}
          className={`rounded-lg px-3 py-2 text-xs transition ${currency === "USD" ? "bg-white/10" : "hover:bg-white/5"}`}
        >
          USD
        </button>
        <button
          onClick={() => setCurrency("EUR")}
          className={`rounded-lg px-3 py-2 text-xs transition ${currency === "EUR" ? "bg-white/10" : "hover:bg-white/5"}`}
        >
          EUR
        </button>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { useCurrency } from "@/app/providers/currency-provider";

type Debt = {
  id: string;
  direction: "I_OWE" | "OWED_TO_ME";
  person: string;
  reason: string | null;
  amountOre: number;
  date: string;
  isPaid: boolean;
};

function todayISO() {
  const d = new Date();
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())).toISOString().slice(0, 10);
}

export default function DebtsPage() {
  const { formatFromOre } = useCurrency();

  const [items, setItems] = useState<Debt[]>([]);
  const [direction, setDirection] = useState<Debt["direction"]>("I_OWE");
  const [person, setPerson] = useState("");
  const [reason, setReason] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayISO());
  const [onlyOpen, setOnlyOpen] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const canSave = useMemo(() => {
    const a = Number(amount);
    return person.trim().length >= 2 && Number.isFinite(a) && a > 0 && !!date && !saving;
  }, [person, amount, date, saving]);

  function load() {
    setLoading(true);
    const qs = onlyOpen ? "?open=1" : "";
    fetch(`/api/debts${qs}`)
      .then(async (r) => {
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(typeof j?.error === "string" ? j.error : "Feil");
        return j;
      })
      .then((j) => {
        setItems(Array.isArray(j.items) ? j.items : []);
        setError(null);
        setLoading(false);
      })
      .catch((e) => {
        setError(typeof e?.message === "string" ? e.message : "Kunne ikke laste gjeld");
        setLoading(false);
      });
  }

  useEffect(() => {
    load();
  }, [onlyOpen]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;

    setSaving(true);
    setError(null);

    const res = await fetch("/api/debts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        direction,
        person,
        reason: reason.trim() ? reason.trim() : null,
        amount: Number(amount),
        date,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(typeof data?.error === "string" ? data.error : "Kunne ikke lagre");
      setSaving(false);
      return;
    }

    setPerson("");
    setReason("");
    setAmount("");
    setDirection("I_OWE");
    setDate(todayISO());
    setSaving(false);
    load();
  }

  async function togglePaid(id: string, isPaid: boolean) {
    setError(null);
    const res = await fetch("/api/debts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isPaid }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(typeof data?.error === "string" ? data.error : "Kunne ikke oppdatere");
      return;
    }
    load();
  }

  async function onDelete(id: string) {
    setError(null);
    const res = await fetch(`/api/debts?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(typeof data?.error === "string" ? data.error : "Kunne ikke slette");
      return;
    }
    load();
  }

  const totals = useMemo(() => {
    const open = items.filter((d) => !d.isPaid);
    const iOweOre = open.filter((d) => d.direction === "I_OWE").reduce((a, d) => a + d.amountOre, 0);
    const owedToMeOre = open.filter((d) => d.direction === "OWED_TO_ME").reduce((a, d) => a + d.amountOre, 0);
    return { iOweOre, owedToMeOre, netOre: owedToMeOre - iOweOre };
  }, [items]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Gjeld</h2>
          <p className="text-slate-300">Hold styr på hvem som skylder hvem, og hvorfor.</p>
        </div>
        <div className="flex gap-3">
          <Stat label="Jeg skylder" value={formatFromOre(totals.iOweOre)} />
          <Stat label="Skyldes meg" value={formatFromOre(totals.owedToMeOre)} />
          <Stat label="Netto" value={formatFromOre(totals.netOre)} />
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[420px_1fr]">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h3 className="font-semibold">Ny post</h3>

          <form className="mt-4 space-y-4" onSubmit={onCreate}>
            <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-white/5 p-2">
              <button
                type="button"
                onClick={() => setDirection("I_OWE")}
                className={`rounded-lg px-3 py-2 text-sm transition ${direction === "I_OWE" ? "bg-white/10" : "hover:bg-white/5"}`}
              >
                Jeg skylder
              </button>
              <button
                type="button"
                onClick={() => setDirection("OWED_TO_ME")}
                className={`rounded-lg px-3 py-2 text-sm transition ${direction === "OWED_TO_ME" ? "bg-white/10" : "hover:bg-white/5"}`}
              >
                Skyldes meg
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-300">Person</label>
              <input
                value={person}
                onChange={(e) => setPerson(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-slate-100 outline-none focus:border-white/20"
                placeholder="F.eks. Ola Nordmann"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-300">Beløp</label>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                inputMode="decimal"
                className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-slate-100 outline-none focus:border-white/20"
                placeholder="F.eks. 350"
              />
              <div className="text-xs text-slate-400">
                Beløpet lagres i NOK i databasen, og vises i valgt valuta.
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-300">Dato</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-slate-100 outline-none focus:border-white/20"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-300">Hvorfor</label>
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-slate-100 outline-none focus:border-white/20"
                placeholder="Valgfritt"
              />
            </div>

            <button
              disabled={!canSave}
              className="w-full rounded-xl bg-indigo-500 px-4 py-3 font-medium text-white hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50 transition"
            >
              {saving ? "Lagrer..." : "Lagre"}
            </button>
          </form>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold">Oversikt</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setOnlyOpen((v) => !v)}
                className={`rounded-xl border border-white/10 px-3 py-2 text-sm transition ${onlyOpen ? "bg-white/10" : "bg-white/5 hover:bg-white/10"}`}
              >
                {onlyOpen ? "Kun åpne" : "Alle"}
              </button>
              <button
                onClick={load}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10 transition"
              >
                Oppdater
              </button>
            </div>
          </div>

          <div className="mt-4">
            {loading ? (
              <div className="text-slate-300">Laster...</div>
            ) : items.length === 0 ? (
              <div className="text-slate-300">Ingen poster.</div>
            ) : (
              <div className="space-y-2">
                {items.map((d) => (
                  <div
                    key={d.id}
                    className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{d.person}</span>
                        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-slate-300">
                          {d.direction === "I_OWE" ? "Jeg skylder" : "Skyldes meg"}
                        </span>
                        {d.isPaid ? (
                          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-slate-300">
                            Betalt
                          </span>
                        ) : null}
                      </div>
                      <div className="text-xs text-slate-400">
                        {new Date(d.date).toLocaleDateString("nb-NO")}
                        {d.reason ? ` · ${d.reason}` : ""}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                      <div className={`text-sm font-semibold ${d.direction === "I_OWE" ? "text-rose-200" : "text-emerald-200"}`}>
                        {d.direction === "I_OWE" ? "-" : "+"}
                        {formatFromOre(d.amountOre)}
                      </div>

                      <button
                        onClick={() => togglePaid(d.id, !d.isPaid)}
                        className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-200 hover:bg-white/10 transition"
                      >
                        {d.isPaid ? "Åpne" : "Betalt"}
                      </button>

                      <button
                        onClick={() => onDelete(d.id)}
                        className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-200 hover:bg-white/10 transition"
                      >
                        Slett
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
      <div className="text-[11px] text-slate-400">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}

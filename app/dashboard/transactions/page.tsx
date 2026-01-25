"use client";

import { useEffect, useMemo, useState } from "react";

type Category = { id: string; name: string; color: string };

type Tx = {
  id: string;
  type: "EXPENSE" | "INCOME";
  amount: number;
  description: string | null;
  date: string;
  categoryId: string | null;
  category: Category | null;
};

function formatNok(v: number) {
  return new Intl.NumberFormat("nb-NO", { style: "currency", currency: "NOK" }).format(v);
}

function todayISO() {
  const d = new Date();
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())).toISOString().slice(0, 10);
}

export default function TransactionsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Tx[]>([]);
  const [type, setType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayISO());
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const canSave = useMemo(() => {
    const a = Number(amount);
    return Number.isFinite(a) && a > 0 && !!date && !saving;
  }, [amount, date, saving]);

  function loadCategories() {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((j) => setCategories(j.items ?? []))
      .catch(() => setCategories([]));
  }

  function loadTransactions() {
    setLoading(true);
    fetch("/api/transactions")
      .then((r) => r.json())
      .then((j) => {
        setItems(j.items ?? []);
        setError(null);
        setLoading(false);
      })
      .catch(() => {
        setError("Kunne ikke laste transaksjoner");
        setLoading(false);
      });
  }

  useEffect(() => {
    loadCategories();
    loadTransactions();
  }, []);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;

    setSaving(true);
    setError(null);

    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        amount: Number(amount),
        date,
        description: description.trim() ? description.trim() : null,
        categoryId: categoryId || null,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(typeof data?.error === "string" ? data.error : "Kunne ikke lagre transaksjon");
      setSaving(false);
      return;
    }

    setAmount("");
    setDescription("");
    setCategoryId("");
    setSaving(false);
    loadTransactions();
  }

  async function onDelete(id: string) {
    setError(null);
    const res = await fetch(`/api/transactions?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!res.ok) {
      setError("Kunne ikke slette transaksjon");
      return;
    }
    loadTransactions();
  }

  const totals = useMemo(() => {
    const expense = items.filter((t) => t.type === "EXPENSE").reduce((a, t) => a + t.amount, 0);
    const income = items.filter((t) => t.type === "INCOME").reduce((a, t) => a + t.amount, 0);
    return { expense, income, net: income - expense };
  }, [items]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Transaksjoner</h2>
          <p className="text-slate-300">Registrer inntekter og utgifter.</p>
        </div>
        <div className="flex gap-3">
          <Stat label="Utgifter" value={formatNok(totals.expense)} />
          <Stat label="Inntekter" value={formatNok(totals.income)} />
          <Stat label="Netto" value={formatNok(totals.net)} />
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[420px_1fr]">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h3 className="font-semibold">Ny transaksjon</h3>

          <form className="mt-4 space-y-4" onSubmit={onCreate}>
            <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-white/5 p-2">
              <button
                type="button"
                onClick={() => setType("EXPENSE")}
                className={`rounded-lg px-3 py-2 text-sm transition ${type === "EXPENSE" ? "bg-white/10" : "hover:bg-white/5"}`}
              >
                Utgift
              </button>
              <button
                type="button"
                onClick={() => setType("INCOME")}
                className={`rounded-lg px-3 py-2 text-sm transition ${type === "INCOME" ? "bg-white/10" : "hover:bg-white/5"}`}
              >
                Inntekt
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-300">Beløp (NOK)</label>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                inputMode="decimal"
                className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-slate-100 outline-none focus:border-white/20"
                placeholder="F.eks. 249.90"
              />
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
              <label className="text-sm text-slate-300">Kategori</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-slate-100 outline-none focus:border-white/20"
              >
                <option value="">Ukategorisert</option>
                {categories.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <div className="text-xs text-slate-400">
                Hvis listen er tom: lag kategorier først.
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-300">Beskrivelse</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
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
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Siste transaksjoner</h3>
            <button
              onClick={loadTransactions}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10 transition"
            >
              Oppdater
            </button>
          </div>

          <div className="mt-4">
            {loading ? (
              <div className="text-slate-300">Laster...</div>
            ) : items.length === 0 ? (
              <div className="text-slate-300">Ingen transaksjoner ennå.</div>
            ) : (
              <div className="space-y-2">
                {items.map((t: any) => (
                  <div key={t.id} className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ background: t.category?.color ?? "#94a3b8" }}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {t.type === "EXPENSE" ? "Utgift" : "Inntekt"}
                          </span>
                          <span className="text-xs text-slate-400">{new Date(t.date).toLocaleDateString("nb-NO")}</span>
                        </div>
                        <div className="text-xs text-slate-400">
                          {t.category?.name ?? "Ukategorisert"}
                          {t.description ? ` · ${t.description}` : ""}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                      <div className={`text-sm font-semibold ${t.type === "EXPENSE" ? "text-rose-200" : "text-emerald-200"}`}>
                        {t.type === "EXPENSE" ? "-" : "+"}
                        {formatNok(t.amount)}
                      </div>
                      <button
                        onClick={() => onDelete(t.id)}
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

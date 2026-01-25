"use client";

import { useEffect, useMemo, useState } from "react";

type Goal = {
  id: string;
  title: string;
  period: "MONTH" | "YEAR";
  limit: number;
};

function formatNok(v: number) {
  return new Intl.NumberFormat("nb-NO", { style: "currency", currency: "NOK" }).format(v);
}

export default function GoalsPage() {
  const [items, setItems] = useState<Goal[]>([]);
  const [title, setTitle] = useState("");
  const [period, setPeriod] = useState<"MONTH" | "YEAR">("MONTH");
  const [limit, setLimit] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const canSave = useMemo(() => {
    const v = Number(limit);
    return title.trim().length >= 2 && Number.isFinite(v) && v > 0 && !saving;
  }, [title, limit, saving]);

  function load() {
    setLoading(true);
    fetch("/api/goals")
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
        setError(typeof e?.message === "string" ? e.message : "Kunne ikke laste mål");
        setLoading(false);
      });
  }

  useEffect(() => {
    load();
  }, []);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;

    setSaving(true);
    setError(null);

    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, period, limit: Number(limit) }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(typeof data?.error === "string" ? data.error : "Kunne ikke opprette mål");
      setSaving(false);
      return;
    }

    setTitle("");
    setLimit("");
    setPeriod("MONTH");
    setSaving(false);
    load();
  }

  async function onDelete(id: string) {
    setError(null);
    const res = await fetch(`/api/goals?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(typeof data?.error === "string" ? data.error : "Kunne ikke slette mål");
      return;
    }
    load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Mål</h2>
        <p className="text-slate-300">Sett grenser for måned eller år.</p>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[420px_1fr]">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h3 className="font-semibold">Nytt mål</h3>

          <form className="mt-4 space-y-4" onSubmit={onCreate}>
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Tittel</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-slate-100 outline-none focus:border-white/20"
                placeholder="F.eks. Maks 8000 NOK på mat"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-300">Periode</label>
              <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-white/5 p-2">
                <button
                  type="button"
                  onClick={() => setPeriod("MONTH")}
                  className={`rounded-lg px-3 py-2 text-sm transition ${period === "MONTH" ? "bg-white/10" : "hover:bg-white/5"}`}
                >
                  Måned
                </button>
                <button
                  type="button"
                  onClick={() => setPeriod("YEAR")}
                  className={`rounded-lg px-3 py-2 text-sm transition ${period === "YEAR" ? "bg-white/10" : "hover:bg-white/5"}`}
                >
                  År
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-300">Grense (NOK)</label>
              <input
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                inputMode="decimal"
                className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-slate-100 outline-none focus:border-white/20"
                placeholder="F.eks. 8000"
              />
            </div>

            <button
              disabled={!canSave}
              className="w-full rounded-xl bg-indigo-500 px-4 py-3 font-medium text-white hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50 transition"
            >
              {saving ? "Lagrer..." : "Opprett mål"}
            </button>
          </form>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Dine mål</h3>
            <button
              onClick={load}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10 transition"
            >
              Oppdater
            </button>
          </div>

          <div className="mt-4">
            {loading ? (
              <div className="text-slate-300">Laster...</div>
            ) : items.length === 0 ? (
              <div className="text-slate-300">Ingen mål ennå.</div>
            ) : (
              <div className="space-y-2">
                {items.map((g) => (
                  <div key={g.id} className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-sm font-medium">{g.title}</div>
                      <div className="text-xs text-slate-400">
                        {g.period === "MONTH" ? "Måned" : "År"} · {formatNok(Number.isFinite(g.limit) ? g.limit : 0)}
                      </div>
                    </div>
                    <button
                      onClick={() => onDelete(g.id)}
                      className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-200 hover:bg-white/10 transition"
                    >
                      Slett
                    </button>
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

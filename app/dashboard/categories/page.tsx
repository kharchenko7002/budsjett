"use client";

import { useEffect, useMemo, useState } from "react";

type Category = {
  id: string;
  name: string;
  color: string;
};

const presets = ["#6366f1", "#22c55e", "#06b6d4", "#f97316", "#ef4444", "#a855f7", "#eab308", "#94a3b8"];

export default function CategoriesPage() {
  const [items, setItems] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [color, setColor] = useState(presets[0]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const canSave = useMemo(() => name.trim().length >= 2 && !saving, [name, saving]);

  function load() {
    setLoading(true);
    fetch("/api/categories")
      .then((r) => r.json())
      .then((j) => {
        setItems(j.items ?? []);
        setError(null);
        setLoading(false);
      })
      .catch(() => {
        setError("Kunne ikke laste kategorier");
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

    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, color }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(typeof data?.error === "string" ? data.error : "Kunne ikke opprette kategori");
      setSaving(false);
      return;
    }

    setName("");
    setColor(presets[0]);
    setSaving(false);
    load();
  }

  async function onDelete(id: string) {
    setError(null);
    const res = await fetch(`/api/categories?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!res.ok) {
      setError("Kunne ikke slette kategori");
      return;
    }
    load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Kategorier</h2>
        <p className="text-slate-300">Lag kategorier for å få bedre oversikt.</p>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[420px_1fr]">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h3 className="font-semibold">Ny kategori</h3>

          <form className="mt-4 space-y-4" onSubmit={onCreate}>
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Navn</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-slate-100 outline-none ring-0 focus:border-white/20"
                placeholder="F.eks. Mat, Transport, Husleie"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-300">Farge</label>
              <div className="flex flex-wrap gap-2">
                {presets.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`h-9 w-9 rounded-xl border ${color === c ? "border-white/40" : "border-white/10"} transition`}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>

            <button
              disabled={!canSave}
              className="w-full rounded-xl bg-indigo-500 px-4 py-3 font-medium text-white hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50 transition"
            >
              {saving ? "Lagrer..." : "Opprett kategori"}
            </button>
          </form>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Dine kategorier</h3>
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
              <div className="text-slate-300">Ingen kategorier ennå.</div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {items.map((c) => (
                  <div key={c.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="h-3 w-3 rounded-full" style={{ background: c.color }} />
                      <span className="text-sm">{c.name}</span>
                    </div>
                    <button
                      onClick={() => onDelete(c.id)}
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

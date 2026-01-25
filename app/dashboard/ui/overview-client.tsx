"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

type Summary = {
  month: { expense: number; income: number };
  year: { expense: number; income: number };
  byCategory: { id: string; name: string; color: string; value: number }[];
  monthDaily: { date: string; value: number }[];
  yearMonthly: { month: string; value: number }[];
  goals: {
    month: { id: string; title: string; period: "MONTH"; limit: number }[];
    year: { id: string; title: string; period: "YEAR"; limit: number }[];
  };
};

function formatNok(v: number) {
  return new Intl.NumberFormat("nb-NO", { style: "currency", currency: "NOK" }).format(v);
}

export default function OverviewClient() {
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ok = true;
    fetch("/api/analytics/summary")
      .then((r) => r.json())
      .then((j) => {
        if (!ok) return;
        setData(j);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    return () => {
      ok = false;
    };
  }, []);

  const monthNet = useMemo(() => {
    if (!data) return 0;
    return data.month.income - data.month.expense;
  }, [data]);

  const bestMonthGoal = useMemo(() => {
    if (!data || data.goals.month.length === 0) return null;
    return data.goals.month[0];
  }, [data]);

  if (loading) return <div className="text-slate-300">Laster...</div>;

  if (!data) {
    return (
      <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
        Kunne ikke laste data
      </div>
    );
  }

  const monthGoalProgress = bestMonthGoal
    ? Math.min(100, Math.round((data.month.expense / bestMonthGoal.limit) * 100))
    : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Denne måneden" value={formatNok(data.month.expense)} subtitle="Utgifter" />
        <Card title="Inntekter" value={formatNok(data.month.income)} subtitle="Denne måneden" />
        <Card title="Netto" value={formatNok(monthNet)} subtitle={monthNet >= 0 ? "Pluss" : "Minus"} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Utgifter per dag (denne måneden)">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.monthDaily}>
                <XAxis dataKey="date" hide />
                <YAxis tickFormatter={(v) => `${Math.round(v)}`} />
                <Tooltip formatter={(v: any) => formatNok(Number(v))} />
                <Line type="monotone" dataKey="value" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Utgifter per kategori (denne måneden)">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.byCategory} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95}>
                  {data.byCategory.map((c: any) => (
                    <Cell key={c.id} fill={c.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => formatNok(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {data.byCategory.slice(0, 6).map((c: any) => (
              <div key={c.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
                  <span className="text-sm text-slate-200">{c.name}</span>
                </div>
                <span className="text-sm text-slate-300">{formatNok(c.value)}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Året så langt">
          <div className="grid gap-3 sm:grid-cols-2">
            <MiniStat label="Utgifter" value={formatNok(data.year.expense)} />
            <MiniStat label="Inntekter" value={formatNok(data.year.income)} />
          </div>
          <div className="mt-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.yearMonthly}>
                <XAxis dataKey="month" tick={{ fill: "rgb(203 213 225)" }} />
                <YAxis tickFormatter={(v) => `${Math.round(v)}`} />
                <Tooltip formatter={(v: any) => formatNok(Number(v))} />
                <Bar dataKey="value" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Mål (måned)">
          {bestMonthGoal ? (
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{bestMonthGoal.title}</p>
                  <p className="text-sm text-slate-400">
                    Grense: {formatNok(bestMonthGoal.limit)} · Brukt: {formatNok(data.month.expense)}
                  </p>
                </div>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                  {monthGoalProgress}%
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full border border-white/10 bg-white/5">
                <div className="h-full rounded-full bg-white/20" style={{ width: `${monthGoalProgress}%` }} />
              </div>
              <a href="/dashboard/goals" className="inline-flex rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10 transition">
                Administrer mål
              </a>
            </div>
          ) : (
            <div className="text-slate-300">
              <p>Du har ingen mål ennå.</p>
              <a href="/dashboard/goals" className="mt-3 inline-flex rounded-xl bg-indigo-500 px-4 py-2 text-sm font-medium hover:bg-indigo-400 transition">
                Opprett mål
              </a>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

function Card({ title, value, subtitle }: { title: string; value: string; subtitle: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <p className="text-sm text-slate-300">{title}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Ikke innlogget" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const amount = Number(searchParams.get("amount"));
  const from = (searchParams.get("from") ?? "USD").toUpperCase();
  const to = (searchParams.get("to") ?? "NOK").toUpperCase();

  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Ugyldig beløp" }, { status: 400 });
  }

  if (!((from === "USD" && to === "NOK") || (from === "NOK" && to === "USD"))) {
    return NextResponse.json({ error: "Støtter bare USD og NOK" }, { status: 400 });
  }

  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 14);

  const startPeriod = start.toISOString().slice(0, 10);
  const endPeriod = end.toISOString().slice(0, 10);

  const url = `https://data.norges-bank.no/api/data/EXR/B.USD.NOK.SP?startPeriod=${startPeriod}&endPeriod=${endPeriod}&format=sdmx-json`;
  const r = await fetch(url, { cache: "no-store" });
  const data = await r.json().catch(() => null);

  if (!r.ok || !data) return NextResponse.json({ error: "Kunne ikke hente kurs" }, { status: 502 });

  const obs = data?.data?.dataSets?.[0]?.series;
  const seriesKey = obs ? Object.keys(obs)[0] : null;
  const observations = seriesKey ? obs[seriesKey]?.observations : null;

  if (!observations) return NextResponse.json({ error: "Ingen data" }, { status: 502 });

  const obsKeys = Object.keys(observations).map((k) => Number(k)).filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
  const lastKey = obsKeys.length ? String(obsKeys[obsKeys.length - 1]) : null;
  const rate = lastKey ? Number(observations[lastKey]?.[0]) : NaN;

  if (!Number.isFinite(rate) || rate <= 0) return NextResponse.json({ error: "Ugyldig kurs" }, { status: 502 });

  const result = from === "USD" ? amount * rate : amount / rate;

  return NextResponse.json({
    from,
    to,
    amount,
    rate,
    result,
  });
}

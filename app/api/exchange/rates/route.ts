import { NextResponse } from "next/server";

export const runtime = "nodejs";

function extractRate(j: any) {
  const series = j?.data?.dataSets?.[0]?.series;
  if (!series) return null;

  const seriesKey = Object.keys(series)[0];
  const observations = series?.[seriesKey]?.observations;
  if (!observations) return null;

  const obsKey = Object.keys(observations)[0];
  const v = observations?.[obsKey]?.[0];

  const rate = Number(v);
  if (!Number.isFinite(rate) || rate <= 0) return null;
  return rate;
}

export async function GET() {
  const usdUrl = "https://data.norges-bank.no/api/data/EXR/B.USD.NOK.SP?lastNObservations=1&format=sdmx-json";
  const eurUrl = "https://data.norges-bank.no/api/data/EXR/B.EUR.NOK.SP?lastNObservations=1&format=sdmx-json";

  const [usdRes, eurRes] = await Promise.all([
    fetch(usdUrl, { cache: "no-store" }),
    fetch(eurUrl, { cache: "no-store" }),
  ]);

  const [usdJson, eurJson] = await Promise.all([
    usdRes.json().catch(() => null),
    eurRes.json().catch(() => null),
  ]);

  if (!usdRes.ok || !eurRes.ok || !usdJson || !eurJson) {
    return NextResponse.json({ error: "Kunne ikke hente valutakurser" }, { status: 502 });
  }

  const usdToNok = extractRate(usdJson);
  const eurToNok = extractRate(eurJson);

  if (!usdToNok || !eurToNok) {
    return NextResponse.json({ error: "Ugyldig kursdata" }, { status: 502 });
  }

  return NextResponse.json({
    usdToNok,
    eurToNok,
    updatedUtc: new Date().toISOString(),
  });
}

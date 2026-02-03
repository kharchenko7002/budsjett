import { NextResponse } from "next/server";
import { CURRENCY_COOKIE, normalizeCurrency } from "@/lib/currency";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const currency = normalizeCurrency(body?.currency);

  const res = NextResponse.json({ ok: true, currency });
  res.cookies.set(CURRENCY_COOKIE, currency, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });

  return res;
}

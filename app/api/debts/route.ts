import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";

const toNok = (ore: number) => ore / 100;

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Ikke innlogget" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const onlyOpen = searchParams.get("open") === "1";

  const where: { userId: string; isPaid?: boolean } = { userId: session.userId };
  if (onlyOpen) where.isPaid = false;

  const items = await prisma.debt.findMany({
    where,
    orderBy: [{ isPaid: "asc" }, { date: "desc" }],
  });

  return NextResponse.json({
    items: items.map((d) => ({
      id: d.id,
      direction: d.direction,
      person: d.person,
      reason: d.reason,
      amount: toNok(d.amountOre),
      date: d.date,
      isPaid: d.isPaid,
      createdAt: d.createdAt,
    })),
  });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Ikke innlogget" }, { status: 401 });

  const body = await req.json().catch(() => null);

  const direction = body?.direction === "OWED_TO_ME" ? "OWED_TO_ME" : "I_OWE";
  const person = typeof body?.person === "string" ? body.person.trim() : "";
  const reason = typeof body?.reason === "string" ? body.reason.trim() : null;
  const amount = Number(body?.amount);
  const dateStr = typeof body?.date === "string" ? body.date : null;

  if (person.length < 2) return NextResponse.json({ error: "Person må være minst 2 tegn" }, { status: 400 });
  if (!Number.isFinite(amount) || amount <= 0) return NextResponse.json({ error: "Beløp må være større enn 0" }, { status: 400 });
  if (!dateStr) return NextResponse.json({ error: "Velg dato" }, { status: 400 });

  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return NextResponse.json({ error: "Ugyldig dato" }, { status: 400 });

  const amountOre = Math.round(amount * 100);

  const item = await prisma.debt.create({
    data: {
      direction,
      person,
      reason: reason ? reason : null,
      amountOre,
      date,
      userId: session.userId,
    },
  });

  return NextResponse.json({
    item: {
      id: item.id,
      direction: item.direction,
      person: item.person,
      reason: item.reason,
      amount: toNok(item.amountOre),
      date: item.date,
      isPaid: item.isPaid,
      createdAt: item.createdAt,
    },
  });
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Ikke innlogget" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id : null;
  const isPaid = typeof body?.isPaid === "boolean" ? body.isPaid : null;

  if (!id) return NextResponse.json({ error: "Mangler id" }, { status: 400 });
  if (isPaid === null) return NextResponse.json({ error: "Mangler status" }, { status: 400 });

  const item = await prisma.debt.update({
    where: { id, userId: session.userId },
    data: { isPaid },
  });

  return NextResponse.json({ ok: true, isPaid: item.isPaid });
}

export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Ikke innlogget" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Mangler id" }, { status: 400 });

  await prisma.debt.delete({
    where: { id, userId: session.userId },
  });

  return NextResponse.json({ ok: true });
}

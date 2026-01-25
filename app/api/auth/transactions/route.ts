import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";

function nokToOre(v: number) {
  return Math.round(v * 100);
}

function oreToNok(v: number) {
  return v / 100;
}

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Ikke innlogget" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: any = { userId: session.userId };
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from);
    if (to) where.date.lte = new Date(to);
  }

  const items = await prisma.transaction.findMany({
    where,
    include: { category: true },
    orderBy: { date: "desc" },
    take: 300,
  });

  return NextResponse.json({
    items: items.map((t: any) => ({
      ...t,
      amount: oreToNok(Number(t.amountOre)),
    })),
  });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Ikke innlogget" }, { status: 401 });

  const body = await req.json().catch(() => null);

  const type = body?.type === "INCOME" ? "INCOME" : "EXPENSE";
  const amount = Number(body?.amount);
  const description = typeof body?.description === "string" ? body.description.trim() : null;
  const dateStr = typeof body?.date === "string" ? body.date : null;
  const categoryId = typeof body?.categoryId === "string" ? body.categoryId : null;

  if (!Number.isFinite(amount) || amount <= 0) return NextResponse.json({ error: "Beløp må være større enn 0" }, { status: 400 });
  if (!dateStr) return NextResponse.json({ error: "Velg dato" }, { status: 400 });

  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return NextResponse.json({ error: "Ugyldig dato" }, { status: 400 });

  if (categoryId) {
    const ok = await prisma.category.findFirst({
      where: { id: categoryId, userId: session.userId },
      select: { id: true },
    });
    if (!ok) return NextResponse.json({ error: "Ugyldig kategori" }, { status: 400 });
  }

  const item = await prisma.transaction.create({
    data: {
      type,
      amountOre: nokToOre(amount),
      description,
      date,
      userId: session.userId,
      categoryId,
    },
    include: { category: true },
  });

  return NextResponse.json({
    item: {
      ...item,
      amount: oreToNok(Number(item.amountOre)),
    },
  });
}

export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Ikke innlogget" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Mangler id" }, { status: 400 });

  await prisma.transaction.delete({
    where: { id, userId: session.userId },
  });

  return NextResponse.json({ ok: true });
}

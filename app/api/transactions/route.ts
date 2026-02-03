import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";

function toOre(v: number) {
  return Math.round(v * 100);
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Ikke innlogget" }, { status: 401 });

  const items = await prisma.transaction.findMany({
    where: { userId: session.userId },
    include: { category: true },
    orderBy: { date: "desc" },
    take: 50,
  });

  return NextResponse.json({
    items: items.map((t) => ({
      id: t.id,
      type: t.type,
      amountOre: t.amountOre,
      description: t.description,
      date: t.date.toISOString(),
      categoryId: t.categoryId,
      category: t.category
        ? { id: t.category.id, name: t.category.name, color: t.category.color }
        : null,
    })),
  });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Ikke innlogget" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const type = body?.type === "INCOME" ? "INCOME" : "EXPENSE";
  const amount = Number(body?.amount);
  const dateStr = String(body?.date ?? "");
  const description = typeof body?.description === "string" ? body.description : null;
  const categoryId = typeof body?.categoryId === "string" ? body.categoryId : null;

  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Beløp må være større enn 0" }, { status: 400 });
  }

  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) {
    return NextResponse.json({ error: "Ugyldig dato" }, { status: 400 });
  }

  const created = await prisma.transaction.create({
    data: {
      userId: session.userId,
      type,
      amountOre: toOre(amount),
      date,
      description: description?.trim() ? description.trim() : null,
      categoryId,
    },
  });

  return NextResponse.json({ ok: true, id: created.id });
}

export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Ikke innlogget" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Mangler id" }, { status: 400 });

  const t = await prisma.transaction.findFirst({ where: { id, userId: session.userId } });
  if (!t) return NextResponse.json({ error: "Fant ikke transaksjon" }, { status: 404 });

  await prisma.transaction.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

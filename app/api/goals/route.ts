import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Ikke innlogget" }, { status: 401 });

  const items = await prisma.goal.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    items: items.map((g: any) => ({
      id: g.id,
      title: g.title,
      period: g.period,
      limit: g.limitOre / 100,
      createdAt: g.createdAt,
    })),
  });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Ikke innlogget" }, { status: 401 });

  const body = await req.json().catch(() => null);

  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const period = body?.period === "YEAR" ? "YEAR" : "MONTH";
  const limit = Number(body?.limit);

  if (title.length < 2) return NextResponse.json({ error: "Tittel må være minst 2 tegn" }, { status: 400 });
  if (!Number.isFinite(limit) || limit <= 0) return NextResponse.json({ error: "Beløp må være større enn 0" }, { status: 400 });

  const limitOre = Math.round(limit * 100);

  const item = await prisma.goal.create({
    data: { title, period, limitOre, userId: session.userId },
  });

  return NextResponse.json({
    item: {
      id: item.id,
      title: item.title,
      period: item.period,
      limit: item.limitOre / 100,
      createdAt: item.createdAt,
    },
  });
}

export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Ikke innlogget" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Mangler id" }, { status: 400 });

  await prisma.goal.delete({
    where: { id, userId: session.userId },
  });

  return NextResponse.json({ ok: true });
}

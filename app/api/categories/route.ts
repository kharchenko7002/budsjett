import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Ikke innlogget" }, { status: 401 });

  const items = await prisma.category.findMany({
    where: { userId: session.userId },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Ikke innlogget" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const color = typeof body?.color === "string" ? body.color.trim() : "#6366f1";

  if (name.length < 2) return NextResponse.json({ error: "Navn må være minst 2 tegn" }, { status: 400 });

  try {
    const item = await prisma.category.create({
      data: { name, color, userId: session.userId },
    });
    return NextResponse.json({ item });
  } catch {
    return NextResponse.json({ error: "Kategorien finnes allerede" }, { status: 409 });
  }
}

export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Ikke innlogget" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Mangler id" }, { status: 400 });

  await prisma.category.delete({
    where: { id, userId: session.userId },
  });

  return NextResponse.json({ ok: true });
}

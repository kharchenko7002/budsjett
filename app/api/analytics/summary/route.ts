import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";

export const runtime = "nodejs";

const nok = (ore: number) => ore / 100;

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Ikke innlogget" }, { status: 401 });

  const now = new Date();
  const monthFrom = startOfMonth(now);
  const monthTo = endOfMonth(now);
  const yearFrom = startOfYear(now);
  const yearTo = endOfYear(now);

  const [monthTx, yearTx, categories, goals] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId: session.userId, date: { gte: monthFrom, lte: monthTo } },
      include: { category: true },
      orderBy: { date: "asc" },
    }),
    prisma.transaction.findMany({
      where: { userId: session.userId, date: { gte: yearFrom, lte: yearTo } },
      include: { category: true },
      orderBy: { date: "asc" },
    }),
    prisma.category.findMany({
      where: { userId: session.userId },
      orderBy: { name: "asc" },
    }),
    prisma.goal.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const sumOre = (arr: any[], type: "EXPENSE" | "INCOME") =>
    arr.filter((t) => t.type === type).reduce((acc, t) => acc + t.amountOre, 0);

  const monthExpenseOre = sumOre(monthTx, "EXPENSE");
  const monthIncomeOre = sumOre(monthTx, "INCOME");
  const yearExpenseOre = sumOre(yearTx, "EXPENSE");
  const yearIncomeOre = sumOre(yearTx, "INCOME");

  const byCategoryMap = new Map<string, number>();
  for (const t of monthTx) {
    if (t.type !== "EXPENSE") continue;
    const key = t.categoryId ?? "ukategorisert";
    byCategoryMap.set(key, (byCategoryMap.get(key) ?? 0) + t.amountOre);
  }

  const byCategory = [
    ...categories.map((c: any) => ({
      id: c.id,
      name: c.name,
      color: c.color,
      value: nok(byCategoryMap.get(c.id) ?? 0),
    })),
    {
      id: "ukategorisert",
      name: "Ukategorisert",
      color: "#94a3b8",
      value: nok(byCategoryMap.get("ukategorisert") ?? 0),
    },
  ].filter((x: any) => x.value > 0);

  const monthDailyMap = new Map<string, number>();
  for (const t of monthTx) {
    if (t.type !== "EXPENSE") continue;
    const k = new Date(t.date).toISOString().slice(0, 10);
    monthDailyMap.set(k, (monthDailyMap.get(k) ?? 0) + t.amountOre);
  }

  const monthDaily = [...monthDailyMap.entries()]
    .sort((a: any, b: any) => a[0].localeCompare(b[0]))
    .map(([date, valueOre]) => ({ date, value: nok(valueOre) }));

  const yearMonthlyMap = new Map<string, number>();
  for (const t of yearTx) {
    if (t.type !== "EXPENSE") continue;
    const d = new Date(t.date);
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    yearMonthlyMap.set(k, (yearMonthlyMap.get(k) ?? 0) + t.amountOre);
  }

  const yearMonthly = [...yearMonthlyMap.entries()]
    .sort((a: any, b: any) => a[0].localeCompare(b[0]))
    .map(([month, valueOre]: any) => ({ month, value: nok(valueOre) }));

  const monthGoals = goals.filter((g: any) => g.period === "MONTH").map((g: any) => ({
    id: g.id,
    title: g.title,
    period: g.period,
    limit: nok(g.limitOre),
  }));

  const yearGoals = goals.filter((g: any) => g.period === "YEAR").map((g: any) => ({
    id: g.id,
    title: g.title,
    period: g.period,
    limit: nok(g.limitOre),
  }));

  return NextResponse.json({
    month: { expense: nok(monthExpenseOre), income: nok(monthIncomeOre) },
    year: { expense: nok(yearExpenseOre), income: nok(yearIncomeOre) },
    byCategory,
    monthDaily,
    yearMonthly,
    goals: {
      month: monthGoals,
      year: yearGoals,
    },
  });
}

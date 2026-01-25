import Link from "next/link";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-20 h-72 w-72 -translate-x-1/2 rounded-full bg-indigo-600/25 blur-3xl" />
        <div className="absolute left-1/3 top-72 h-72 w-72 rounded-full bg-fuchsia-600/15 blur-3xl" />
        <div className="absolute right-1/3 top-72 h-72 w-72 rounded-full bg-cyan-600/15 blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Budsjett</h1>
            <p className="text-slate-300">Oversikt, mål, kategorier og transaksjoner.</p>
          </div>

          <form action="/api/auth/logout" method="POST">
            <button className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10 transition">
              Logg ut
            </button>
          </form>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-[260px_1fr]">
          <aside className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
            <nav className="space-y-2">
              <Link className="block rounded-xl px-3 py-2 hover:bg-white/10 transition" href="/dashboard">
                Oversikt
              </Link>
              <Link className="block rounded-xl px-3 py-2 hover:bg-white/10 transition" href="/dashboard/transactions">
                Transaksjoner
              </Link>
              <Link className="block rounded-xl px-3 py-2 hover:bg-white/10 transition" href="/dashboard/categories">
                Kategorier
              </Link>
              <Link className="block rounded-xl px-3 py-2 hover:bg-white/10 transition" href="/dashboard/goals">
                Mål
              </Link>
              <Link className="block rounded-xl px-3 py-2 hover:bg-white/10 transition" href="/dashboard/debts">
  Gjeld
</Link>

            </nav>
          </aside>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-6 backdrop-blur">
            {children}
          </section>
        </div>
      </div>
    </div>
  );
}

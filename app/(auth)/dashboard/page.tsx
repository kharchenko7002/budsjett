import Link from "next/link";

export default function DashboardPage() {
  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">Min side</h1>
            <p className="mt-2 text-slate-300">
              Her bygger vi etter hvert oversikt over forbruksvarer.
            </p>
          </div>

          <form action="/api/auth/logout" method="POST">
            <button className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10 transition">
              Logg ut
            </button>
          </form>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-slate-300">Neste steg</p>
            <h2 className="mt-1 text-xl font-semibold">Forbruksvarer</h2>
            <p className="mt-2 text-slate-300">
              Vi legger til kategorier, varer, uttak og beholdning.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-slate-300">Navigasjon</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href="/"
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10 transition"
              >
                Hjem
              </Link>
              <Link
                href="/login"
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10 transition"
              >
                Innlogging
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

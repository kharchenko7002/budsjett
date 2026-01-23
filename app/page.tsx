import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
        <h1 className="text-2xl font-semibold">Start</h1>
        <p className="mt-2 text-slate-300">
          Gå til innlogging eller registrering.
        </p>
        <div className="mt-6 flex gap-3">
          <Link
            href="/login"
            className="flex-1 rounded-xl bg-indigo-500 px-4 py-2 text-center font-medium hover:bg-indigo-400 transition"
          >
            Logg inn
          </Link>
          <Link
            href="/register"
            className="flex-1 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-center font-medium hover:bg-white/10 transition"
          >
            Registrer deg
          </Link>
        </div>
      </div>
    </main>
  );
}

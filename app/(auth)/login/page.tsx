"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

function Field({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm text-slate-300">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-slate-100 placeholder:text-slate-500 outline-none focus:border-indigo-400/50 focus:bg-white/10 transition"
      />
    </label>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(
        data?.error?.formErrors?.[0] ??
          data?.error ??
          "Kunne ikke logge inn"
      );
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/40 backdrop-blur">
        <h1 className="text-2xl font-semibold">Logg inn</h1>
        <p className="mt-2 text-slate-300">Velkommen tilbake.</p>

        {error && (
          <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <Field
            label="E-post"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="deg@eksempel.no"
          />
          <Field
            label="Passord"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
          />

          <button
            disabled={loading}
            className="group relative w-full rounded-xl bg-indigo-500 px-4 py-3 font-medium text-white hover:bg-indigo-400 disabled:opacity-60 disabled:cursor-not-allowed transition"
          >
            <span className="absolute inset-0 -z-10 rounded-xl bg-indigo-500/30 blur-xl group-hover:bg-indigo-400/30 transition" />
            {loading ? "Logger inn..." : "Logg inn"}
          </button>

          <div className="flex items-center justify-between text-sm text-slate-300">
            <span className="text-slate-500">Glemt passord? (kommer senere)</span>
            <Link
              href="/register"
              className="text-indigo-300 hover:text-indigo-200 underline underline-offset-4"
            >
              Registrer deg
            </Link>
          </div>
        </form>
      </div>

      <p className="mt-6 text-center text-xs text-slate-500">
        Registrer deg først, og logg deretter inn.
      </p>
    </div>
  );
}

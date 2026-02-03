import "./globals.css";

export const metadata = {
  title: "Budsjett App",
  description: "En enkel budsjettapplikasjon",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="no" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className="min-h-screen bg-slate-950 text-slate-100 antialiased"
      >
        <div className="pointer-events-none fixed inset-0 -z-10">
          <div className="absolute left-1/2 top-[-120px] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="absolute right-[-120px] top-[40%] h-[420px] w-[420px] rounded-full bg-fuchsia-500/10 blur-3xl" />
          <div className="absolute bottom-[-160px] left-[-140px] h-[520px] w-[520px] rounded-full bg-cyan-500/10 blur-3xl" />
        </div>

        {children}
      </body>
    </html>
  );
}

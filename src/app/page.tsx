import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden bg-[oklch(0.08_0.02_255)]">
      {/* ── Background layers ── */}

      {/* Gradient orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute -top-[30%] left-[10%] h-[700px] w-[700px] rounded-full blur-[140px]"
          style={{ background: "oklch(0.30 0.18 260 / 0.4)" }}
        />
        <div
          className="absolute -bottom-[20%] right-[5%] h-[600px] w-[600px] rounded-full blur-[120px]"
          style={{ background: "oklch(0.25 0.14 230 / 0.35)" }}
        />
        <div
          className="absolute right-[30%] top-[40%] h-[400px] w-[400px] rounded-full blur-[100px]"
          style={{ background: "oklch(0.30 0.10 290 / 0.2)" }}
        />
      </div>

      {/* Fine grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(oklch(1 0 0) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      {/* Grain */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* ── Nav ── */}
      <header className="relative z-10 mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[oklch(0.55_0.15_255)]">
            <span className="text-[10px] font-bold text-white">BL</span>
          </div>
          <span className="text-sm font-semibold tracking-tight text-white/90">
            Builder Launchpad
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium text-white/50 transition-colors hover:text-white/80"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white px-3.5 text-sm font-medium text-[oklch(0.08_0.02_255)] transition-colors hover:bg-white/90"
          >
            Get started
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      {/* ── Hero content ── */}
      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 pb-20">
        {/* Badge */}
        <div
          className="mb-6 inline-flex w-fit animate-in fade-in slide-in-from-bottom-1 items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1 fill-mode-backwards"
          style={{ animationDelay: "0ms", animationDuration: "500ms" }}
        >
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[oklch(0.72_0.19_150)]" />
          <span className="text-xs font-medium text-white/40">
            Early access
          </span>
        </div>

        {/* Headline */}
        <h1
          className="animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards"
          style={{ animationDelay: "80ms", animationDuration: "600ms" }}
        >
          <span className="block text-[clamp(2.5rem,7vw,5.5rem)] font-semibold leading-[1.05] tracking-tight text-white">
            One home for your
          </span>
          <span className="block text-[clamp(2.5rem,7vw,5.5rem)] font-semibold leading-[1.05] tracking-tight">
            <span className="bg-gradient-to-r from-[oklch(0.72_0.14_255)] to-[oklch(0.68_0.14_215)] bg-clip-text text-transparent">
              builder community
            </span>
          </span>
        </h1>

        {/* Sub */}
        <p
          className="mt-5 max-w-md animate-in fade-in slide-in-from-bottom-1 text-pretty text-base leading-relaxed text-white/35 fill-mode-backwards sm:text-lg"
          style={{ animationDelay: "200ms", animationDuration: "500ms" }}
        >
          Member management, talent discovery, and community content —
          in one platform. Not another duct-taped stack.
        </p>

        {/* CTAs */}
        <div
          className="mt-8 flex animate-in fade-in slide-in-from-bottom-1 flex-wrap gap-3 fill-mode-backwards"
          style={{ animationDelay: "350ms", animationDuration: "500ms" }}
        >
          <Link
            href="/signup"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-white px-5 text-sm font-medium text-[oklch(0.08_0.02_255)] transition-all hover:bg-white/90 hover:shadow-[0_0_30px_-5px_oklch(0.60_0.15_255_/_0.3)]"
          >
            Create your community
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/communities"
            className="inline-flex h-10 items-center rounded-lg border border-white/[0.08] px-5 text-sm font-medium text-white/50 transition-all hover:border-white/[0.15] hover:text-white/80"
          >
            Explore communities
          </Link>
        </div>

        {/* Trust line */}
        <div
          className="mt-16 flex animate-in fade-in items-center gap-3 fill-mode-backwards"
          style={{ animationDelay: "500ms", animationDuration: "600ms" }}
        >
          <div className="flex -space-x-1.5">
            {[255, 230, 200, 270, 215].map((hue, i) => (
              <div
                key={i}
                className="h-6 w-6 rounded-full border-2 border-[oklch(0.08_0.02_255)]"
                style={{
                  background: `oklch(${0.35 + i * 0.04} ${0.12 + i * 0.01} ${hue} / 0.6)`,
                }}
              />
            ))}
          </div>
          <span className="text-xs text-white/25">
            Trusted by tech communities across the Philippines
          </span>
        </div>
      </main>

      {/* ── Footer line ── */}
      <footer className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-6">
        <div className="flex items-center justify-between border-t border-white/[0.05] pt-4">
          <span className="text-[11px] text-white/20">
            &copy; {new Date().getFullYear()} Builder Launchpad
          </span>
          <span className="text-[11px] text-white/20">
            Built by Bscale Labs
          </span>
        </div>
      </footer>
    </div>
  );
}

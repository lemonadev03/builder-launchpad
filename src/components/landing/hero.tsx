import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-[oklch(0.10_0.015_255)]">
      {/* Mesh gradient background */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute -left-1/4 -top-1/4 h-[800px] w-[800px] rounded-full opacity-30 blur-[120px]"
          style={{ background: "oklch(0.35 0.15 255)" }}
        />
        <div
          className="absolute -right-1/4 top-1/3 h-[600px] w-[600px] rounded-full opacity-20 blur-[100px]"
          style={{ background: "oklch(0.45 0.15 220)" }}
        />
        <div
          className="absolute bottom-0 left-1/3 h-[500px] w-[500px] rounded-full opacity-15 blur-[80px]"
          style={{ background: "oklch(0.50 0.12 280)" }}
        />
      </div>

      {/* Fine grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(oklch(1 0 0) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Noise texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 pb-20 pt-28">
        {/* Badge */}
        <div
          className="mb-8 inline-flex w-fit animate-in fade-in slide-in-from-bottom-2 items-center gap-2.5 rounded-full border border-[oklch(1_0_0_/_0.08)] bg-[oklch(1_0_0_/_0.04)] px-4 py-1.5 fill-mode-backwards"
          style={{ animationDelay: "0ms", animationDuration: "600ms" }}
        >
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[oklch(0.70_0.15_140)]" />
          <span className="text-xs font-medium text-[oklch(0.70_0.01_255)]">
            Now in early access
          </span>
        </div>

        {/* Headline — left-aligned, massive */}
        <h1
          className="animate-in fade-in slide-in-from-bottom-3 text-balance fill-mode-backwards"
          style={{ animationDelay: "100ms", animationDuration: "700ms" }}
        >
          <span className="block text-5xl font-semibold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl xl:text-8xl">
            The operating
            <br />
            system for{" "}
            <span className="bg-gradient-to-r from-[oklch(0.65_0.15_255)] via-[oklch(0.60_0.15_230)] to-[oklch(0.70_0.12_200)] bg-clip-text text-transparent">
              builder
            </span>
            <br />
            <span className="bg-gradient-to-r from-[oklch(0.70_0.12_200)] to-[oklch(0.65_0.15_255)] bg-clip-text text-transparent">
              communities
            </span>
          </span>
        </h1>

        {/* Sub + CTAs in a row */}
        <div
          className="mt-8 flex max-w-xl animate-in fade-in slide-in-from-bottom-2 flex-col gap-8 fill-mode-backwards"
          style={{ animationDelay: "300ms", animationDuration: "600ms" }}
        >
          <p className="text-pretty text-base leading-relaxed text-[oklch(0.60_0.01_255)] sm:text-lg">
            Member management, talent discovery, and community content
            — in one platform built for tech orgs. Not another duct-taped
            stack of Discord, Sheets, and Forms.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-white px-5 text-sm font-medium text-[oklch(0.10_0.015_255)] transition-colors hover:bg-white/90 focus-visible:ring-3 focus-visible:ring-white/30"
            >
              Create your community
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/communities"
              className="inline-flex h-9 items-center justify-center rounded-lg border border-[oklch(1_0_0_/_0.12)] px-5 text-sm font-medium text-[oklch(0.80_0.01_255)] transition-colors hover:bg-[oklch(1_0_0_/_0.06)] hover:text-white focus-visible:ring-3 focus-visible:ring-white/20"
            >
              Explore communities
            </Link>
          </div>
        </div>

        {/* Faux UI — floats bottom-right on desktop, full-width on mobile */}
        <div
          aria-hidden="true"
          className="mt-16 animate-in fade-in zoom-in-95 fill-mode-backwards lg:absolute lg:bottom-16 lg:right-6 lg:mt-0 lg:w-[520px]"
          style={{ animationDelay: "600ms", animationDuration: "800ms" }}
        >
          <div className="rounded-xl border border-[oklch(1_0_0_/_0.08)] bg-[oklch(0.14_0.02_255)] p-1 shadow-[0_0_120px_-30px_oklch(0.50_0.15_255_/_0.25)]">
            {/* Window chrome */}
            <div className="flex items-center gap-1.5 px-3 py-2">
              <div className="h-2 w-2 rounded-full bg-[oklch(1_0_0_/_0.12)]" />
              <div className="h-2 w-2 rounded-full bg-[oklch(1_0_0_/_0.12)]" />
              <div className="h-2 w-2 rounded-full bg-[oklch(1_0_0_/_0.12)]" />
              <div className="mx-auto h-4 w-32 rounded-sm bg-[oklch(1_0_0_/_0.06)]" />
            </div>

            {/* Dashboard content */}
            <div className="rounded-lg bg-[oklch(0.12_0.015_255)] p-3">
              {/* Toolbar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded bg-[oklch(0.60_0.15_255_/_0.2)]" />
                  <div className="h-2.5 w-20 rounded bg-[oklch(1_0_0_/_0.08)]" />
                </div>
                <div className="flex gap-1.5">
                  <div className="h-5 w-12 rounded bg-[oklch(1_0_0_/_0.06)]" />
                  <div className="h-5 w-14 rounded bg-[oklch(0.60_0.15_255_/_0.2)]" />
                </div>
              </div>

              {/* Member grid */}
              <div className="mt-3 grid grid-cols-4 gap-1.5 sm:grid-cols-5">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-md border border-[oklch(1_0_0_/_0.04)] bg-[oklch(0.16_0.02_255)] p-2"
                  >
                    <div
                      className="mx-auto h-6 w-6 rounded-full"
                      style={{
                        background: `oklch(${0.45 + (i * 0.04) % 0.25} ${0.10 + (i * 0.02) % 0.08} ${220 + (i * 15) % 80} / 0.3)`,
                      }}
                    />
                    <div className="mx-auto mt-1.5 h-1.5 w-10 rounded bg-[oklch(1_0_0_/_0.06)]" />
                    <div className="mx-auto mt-1 h-1 w-7 rounded bg-[oklch(1_0_0_/_0.04)]" />
                    <div className="mt-1.5 flex justify-center gap-0.5">
                      <div
                        className="h-1 rounded-full"
                        style={{
                          width: `${12 + (i * 5) % 10}px`,
                          background: `oklch(${0.55 + (i * 0.03) % 0.15} 0.12 ${240 + (i * 20) % 60} / 0.25)`,
                        }}
                      />
                      <div
                        className="h-1 rounded-full"
                        style={{
                          width: `${8 + (i * 3) % 8}px`,
                          background: `oklch(${0.50 + (i * 0.04) % 0.2} 0.10 ${200 + (i * 25) % 80} / 0.2)`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom fade to light */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent to-background" />
    </section>
  );
}

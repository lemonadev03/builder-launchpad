import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ScrollReveal } from "./scroll-reveal";

export function FinalCTA() {
  return (
    <section className="relative overflow-hidden bg-[oklch(0.10_0.015_255)] px-6 py-28 lg:py-36">
      {/* Mesh gradient */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute left-1/4 top-0 h-[400px] w-[400px] rounded-full opacity-20 blur-[80px]"
          style={{ background: "oklch(0.40 0.15 255)" }}
        />
        <div
          className="absolute bottom-0 right-1/4 h-[300px] w-[300px] rounded-full opacity-15 blur-[60px]"
          style={{ background: "oklch(0.50 0.12 240)" }}
        />
      </div>

      {/* Grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage:
            "linear-gradient(oklch(1 0 0) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative mx-auto max-w-xl text-center">
        <ScrollReveal>
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Your community deserves a real home
          </h2>
          <p className="mt-5 text-pretty text-sm text-[oklch(0.55_0.01_255)] sm:text-base">
            Free to start. Set up in minutes. Shape the product in early access.
          </p>

          <div className="mt-10">
            <Link
              href="/signup"
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-white px-6 text-sm font-medium text-[oklch(0.10_0.015_255)] shadow-[0_0_40px_-8px_oklch(0.60_0.15_255_/_0.4)] transition-colors hover:bg-white/90 focus-visible:ring-3 focus-visible:ring-white/30"
            >
              Create your community
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <p className="mt-4 text-xs text-[oklch(0.40_0.01_255)]">
            No credit card required
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}

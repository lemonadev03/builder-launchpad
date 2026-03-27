import { Check } from "lucide-react";
import { ScrollReveal } from "./scroll-reveal";

const OUTCOMES = [
  "Members discover each other by skill, not by accident",
  "Companies find talent where builders already gather",
  "Content lives where community identity lives",
  "One source of truth for your entire organization",
];

export function Solution() {
  return (
    <section className="relative overflow-hidden bg-[oklch(0.10_0.015_255)] px-6 py-24 lg:py-32">
      {/* Subtle glow */}
      <div
        className="pointer-events-none absolute right-0 top-0 h-[500px] w-[500px] rounded-full opacity-20 blur-[100px]"
        style={{ background: "oklch(0.40 0.15 255)" }}
      />

      <div className="relative mx-auto max-w-5xl">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          {/* Copy */}
          <div>
            <ScrollReveal>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[oklch(0.60_0.15_255_/_0.2)] bg-[oklch(0.60_0.15_255_/_0.06)] px-3 py-1 text-xs font-medium text-[oklch(0.65_0.15_255)]">
                <div className="h-1.5 w-1.5 rounded-full bg-[oklch(0.60_0.15_255)]" />
                One platform
              </div>
              <h2 className="text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Replace the stack.
                <br />
                <span className="text-[oklch(0.55_0.01_255)]">
                  Keep the community.
                </span>
              </h2>
              <p className="mt-4 max-w-md text-pretty text-sm leading-relaxed text-[oklch(0.55_0.01_255)]">
                Builder Launchpad gives your org a single home — purpose-built
                for tech communities, not adapted from generic tools.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={150}>
              <ul className="mt-8 space-y-3.5">
                {OUTCOMES.map((outcome) => (
                  <li key={outcome} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[oklch(0.60_0.15_255_/_0.12)]">
                      <Check className="h-3 w-3 text-[oklch(0.65_0.15_255)]" />
                    </div>
                    <span className="text-sm leading-relaxed text-[oklch(0.75_0.005_255)]">
                      {outcome}
                    </span>
                  </li>
                ))}
              </ul>
            </ScrollReveal>
          </div>

          {/* Hierarchy diagram */}
          <ScrollReveal delay={200}>
            <div
              aria-hidden="true"
              className="relative rounded-2xl border border-[oklch(1_0_0_/_0.06)] bg-[oklch(0.14_0.02_255)] p-5 shadow-[0_0_100px_-25px_oklch(0.55_0.15_255_/_0.2)]"
            >
              {/* Community */}
              <div className="rounded-lg border border-[oklch(0.60_0.15_255_/_0.15)] bg-[oklch(0.60_0.15_255_/_0.05)] px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-sm bg-[oklch(0.60_0.15_255)]" />
                  <span className="text-xs font-semibold text-[oklch(0.80_0.005_255)]">
                    Community
                  </span>
                  <span className="ml-auto text-[10px] text-[oklch(0.45_0.01_255)]">
                    124 members
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  {[
                    { name: "Manila Chapter", committees: ["Design", "Engineering"], count: [4, 6] },
                    { name: "Cebu Chapter", committees: ["Marketing", "Product"], count: [3, 5] },
                  ].map((chapter) => (
                    <div
                      key={chapter.name}
                      className="rounded-md border border-[oklch(1_0_0_/_0.05)] bg-[oklch(0.17_0.02_255)] p-2.5"
                    >
                      <span className="text-[11px] font-medium text-[oklch(0.70_0.005_255)]">
                        {chapter.name}
                      </span>
                      <div className="mt-2 space-y-1.5">
                        {chapter.committees.map((committee, ci) => (
                          <div
                            key={committee}
                            className="rounded border border-[oklch(1_0_0_/_0.04)] bg-[oklch(0.20_0.025_255)] px-2 py-1.5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-[oklch(0.55_0.01_255)]">
                                {committee}
                              </span>
                              <span className="text-[9px] text-[oklch(0.40_0.01_255)]">
                                {chapter.count[ci]}
                              </span>
                            </div>
                            <div className="mt-1.5 flex gap-0.5">
                              {Array.from({ length: chapter.count[ci] }).map((_, j) => (
                                <div
                                  key={j}
                                  className="h-3.5 w-3.5 rounded-full"
                                  style={{
                                    background: `oklch(${0.50 + (j * 0.05) % 0.2} ${0.10 + (j * 0.02) % 0.06} ${230 + (j * 20) % 60} / 0.25)`,
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

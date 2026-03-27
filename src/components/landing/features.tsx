import {
  Users,
  Search,
  Briefcase,
  PenLine,
  LayoutGrid,
  Rocket,
} from "lucide-react";
import { ScrollReveal } from "./scroll-reveal";

export function Features() {
  return (
    <section className="px-6 py-24 lg:py-32">
      <div className="mx-auto max-w-5xl">
        <ScrollReveal>
          <div className="mb-14 text-center">
            <h2 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
              Everything your community needs
            </h2>
            <p className="mt-3 text-pretty text-sm text-muted-foreground sm:text-base">
              Built for tech communities. Not adapted from generic tools.
            </p>
          </div>
        </ScrollReveal>

        {/* Bento grid */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {/* Wide card: Community hierarchy */}
          <ScrollReveal delay={0} className="sm:col-span-2">
            <div className="group relative h-full overflow-hidden rounded-2xl border border-border bg-card p-6 transition-[border-color] duration-200 hover:border-primary/25">
              <div className="flex items-start justify-between gap-6">
                <div className="max-w-xs">
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Users className="h-[18px] w-[18px]" />
                  </div>
                  <h3 className="text-sm font-semibold">
                    Community hierarchy
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    Organize by chapters and committees. Assign roles, manage
                    officers, track membership across your entire org.
                  </p>
                </div>

                {/* Mini visualization */}
                <div
                  aria-hidden="true"
                  className="hidden shrink-0 rounded-lg border border-border/50 bg-muted/30 p-3 sm:block"
                >
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-sm bg-primary/30" />
                    <div className="h-1.5 w-14 rounded bg-foreground/8" />
                  </div>
                  <div className="mt-2 ml-3 space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-1.5 rounded-sm bg-primary/20" />
                      <div className="h-1 w-10 rounded bg-foreground/6" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-1.5 rounded-sm bg-primary/20" />
                      <div className="h-1 w-12 rounded bg-foreground/6" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Tall card: Discoverable profiles */}
          <ScrollReveal delay={75} className="row-span-2">
            <div className="group relative h-full overflow-hidden rounded-2xl border border-border bg-card p-6 transition-[border-color] duration-200 hover:border-primary/25">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-[oklch(0.55_0.15_220_/_0.1)] text-[oklch(0.55_0.15_220)]">
                <Search className="h-[18px] w-[18px]" />
              </div>
              <h3 className="text-sm font-semibold">Discoverable profiles</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                Structured skills, availability, and portfolio. Your builders
                become findable by anyone who needs them.
              </p>

              {/* Profile mockup */}
              <div
                aria-hidden="true"
                className="mt-5 space-y-2"
              >
                {[
                  { name: "w-16", role: "w-12", skills: ["w-8", "w-10", "w-6"] },
                  { name: "w-14", role: "w-10", skills: ["w-10", "w-7"] },
                  { name: "w-18", role: "w-11", skills: ["w-6", "w-9", "w-7"] },
                ].map((profile, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-border/50 bg-muted/20 p-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="h-5 w-5 rounded-full"
                        style={{
                          background: `oklch(${0.50 + i * 0.08} ${0.12} ${220 + i * 25} / 0.2)`,
                        }}
                      />
                      <div>
                        <div className={`h-1.5 ${profile.name} rounded bg-foreground/10`} />
                        <div className={`mt-1 h-1 ${profile.role} rounded bg-muted-foreground/8`} />
                      </div>
                    </div>
                    <div className="mt-2 flex gap-1">
                      {profile.skills.map((w, j) => (
                        <div
                          key={j}
                          className={`h-1 ${w} rounded-full`}
                          style={{
                            background: `oklch(${0.55 + j * 0.05} 0.12 ${220 + j * 20} / 0.15)`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>

          {/* Standard card: Talent marketplace */}
          <ScrollReveal delay={150}>
            <div className="group relative h-full overflow-hidden rounded-2xl border border-border bg-card p-6 transition-[border-color] duration-200 hover:border-primary/25">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-[oklch(0.65_0.12_180_/_0.1)] text-[oklch(0.55_0.12_180)]">
                <Briefcase className="h-[18px] w-[18px]" />
              </div>
              <h3 className="text-sm font-semibold">Talent marketplace</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                Companies post roles. Members get discovered. Applications
                happen where your community already lives.
              </p>
            </div>
          </ScrollReveal>

          {/* Standard card: Community content */}
          <ScrollReveal delay={225}>
            <div className="group relative h-full overflow-hidden rounded-2xl border border-border bg-card p-6 transition-[border-color] duration-200 hover:border-primary/25">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-[oklch(0.60_0.10_300_/_0.1)] text-[oklch(0.55_0.10_300)]">
                <PenLine className="h-[18px] w-[18px]" />
              </div>
              <h3 className="text-sm font-semibold">Community content</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                Blogs and forums scoped to your community. Identity and
                content in one place, not scattered across platforms.
              </p>
            </div>
          </ScrollReveal>

          {/* Wide card: Global directory */}
          <ScrollReveal delay={300} className="sm:col-span-2">
            <div className="group relative h-full overflow-hidden rounded-2xl border border-border bg-card p-6 transition-[border-color] duration-200 hover:border-primary/25">
              <div className="flex items-start justify-between gap-6">
                <div className="max-w-xs">
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-[oklch(0.70_0.15_140_/_0.1)] text-[oklch(0.55_0.15_140)]">
                    <LayoutGrid className="h-[18px] w-[18px]" />
                  </div>
                  <h3 className="text-sm font-semibold">Global directory</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    A searchable, filterable directory across all communities.
                    Find the right person for any project or role.
                  </p>
                </div>

                {/* Avatar grid */}
                <div
                  aria-hidden="true"
                  className="hidden shrink-0 grid-cols-4 gap-1 sm:grid"
                >
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-5 w-5 rounded-full"
                      style={{
                        background: `oklch(${0.45 + (i * 0.04) % 0.2} ${0.08 + (i * 0.02) % 0.06} ${200 + (i * 18) % 80} / 0.2)`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Accent card: Early access */}
          <ScrollReveal delay={375}>
            <div className="group relative h-full overflow-hidden rounded-2xl border border-primary/15 bg-primary/[0.03] p-6 transition-[border-color] duration-200 hover:border-primary/30">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Rocket className="h-[18px] w-[18px]" />
              </div>
              <h3 className="text-sm font-semibold">Early access</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                Join now and shape the product. Your feedback drives what we
                build next. Grow with the platform from day one.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

import { ScrollReveal } from "./scroll-reveal";
import { AnimatedCounter } from "./animated-counter";

const STATS = [
  { target: 500, suffix: "+", label: "Builders" },
  { target: 12, suffix: "", label: "Communities" },
  { target: 30, suffix: "+", label: "Chapters" },
];

export function SocialProof() {
  return (
    <section className="px-6 py-24 lg:py-32">
      <div className="mx-auto max-w-5xl">
        {/* Stats — bold, full-width */}
        <ScrollReveal>
          <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {STATS.map((stat) => (
              <div key={stat.label} className="py-6 text-center sm:py-0">
                <div className="font-mono text-4xl font-bold tabular-nums tracking-tight sm:text-5xl lg:text-6xl">
                  <AnimatedCounter
                    target={stat.target}
                    suffix={stat.suffix}
                  />
                </div>
                <p className="mt-2 text-sm font-medium text-muted-foreground">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </ScrollReveal>

        {/* Testimonial */}
        <ScrollReveal delay={200}>
          <div className="mx-auto mt-20 max-w-lg text-center">
            <blockquote>
              <p className="text-base leading-relaxed text-foreground/80 sm:text-lg">
                &ldquo;We went from managing our org across five tools to having
                everything in one place. Our members actually know each other
                now.&rdquo;
              </p>
              <footer className="mt-5 flex items-center justify-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  JD
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium">Community organizer</div>
                  <div className="text-xs text-muted-foreground">
                    Early access user
                  </div>
                </div>
              </footer>
            </blockquote>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

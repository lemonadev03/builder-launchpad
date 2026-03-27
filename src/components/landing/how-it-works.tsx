import { ScrollReveal } from "./scroll-reveal";

const STEPS = [
  {
    number: "01",
    title: "Create your community",
    description:
      "Set up your org in minutes. Define chapters, invite members, assign roles.",
  },
  {
    number: "02",
    title: "Build profiles",
    description:
      "Skills, portfolio, availability. Members become discoverable to companies and each other.",
  },
  {
    number: "03",
    title: "Grow together",
    description:
      "Publish content, post jobs, discover talent. The community compounds from there.",
  },
];

export function HowItWorks() {
  return (
    <section className="border-t border-border bg-muted/20 px-6 py-24 lg:py-32">
      <div className="mx-auto max-w-5xl">
        <ScrollReveal>
          <div className="mb-16 text-center">
            <h2 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
              Set up in minutes, not weeks
            </h2>
          </div>
        </ScrollReveal>

        <div className="grid gap-12 sm:grid-cols-3 sm:gap-8">
          {STEPS.map((step, i) => (
            <ScrollReveal key={step.number} delay={i * 120}>
              <div className="relative">
                {/* Number */}
                <span className="font-mono text-5xl font-bold tabular-nums text-primary/20 lg:text-6xl">
                  {step.number}
                </span>
                <h3 className="mt-3 text-sm font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

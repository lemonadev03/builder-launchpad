import { ScrollReveal } from "./scroll-reveal";

const TOOLS = [
  "Discord",
  "Google Sheets",
  "Google Forms",
  "Notion",
  "Facebook Groups",
  "Medium",
  "Airtable",
];

export function Problem() {
  return (
    <section className="px-6 py-24 lg:py-32">
      <div className="mx-auto max-w-5xl">
        <ScrollReveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
              Your community is held together
              <br />
              <span className="text-muted-foreground">
                by duct tape and good intentions
              </span>
            </h2>
            <p className="mt-4 text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
              Members in a spreadsheet. Conversations in Discord. RSVPs in a
              form. Content on Medium. Nobody knows who&apos;s active, who has
              what skills, or where anything lives.
            </p>
          </div>
        </ScrollReveal>

        {/* Tool ticker — shows the scattered tools */}
        <ScrollReveal delay={150}>
          <div className="relative mt-14 overflow-hidden">
            <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-24 bg-gradient-to-r from-background to-transparent" />
            <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-24 bg-gradient-to-l from-background to-transparent" />
            <div
              className="flex w-max gap-4"
              style={{
                animation: "marquee 25s linear infinite",
              }}
            >
              {[...TOOLS, ...TOOLS].map((tool, i) => (
                <div
                  key={`${tool}-${i}`}
                  className="flex shrink-0 items-center gap-2 rounded-lg border border-border bg-muted/40 px-4 py-2.5"
                >
                  <div className="h-2 w-2 rounded-full bg-destructive/40" />
                  <span className="text-sm font-medium text-muted-foreground">
                    {tool}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

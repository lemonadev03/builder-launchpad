import Link from "next/link";
import { ArrowRight, Users, Search, Briefcase, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const FEATURES = [
  {
    icon: Users,
    title: "One home for your community",
    description:
      "Chapters, committees, member directories — no more duct-taping five tools together.",
  },
  {
    icon: Search,
    title: "Discoverable profiles",
    description:
      "Structured skills, availability, portfolio. Your builders become findable.",
  },
  {
    icon: Briefcase,
    title: "Talent meets opportunity",
    description:
      "Companies post roles. Members get discovered. Applications happen where they already live.",
  },
  {
    icon: Zap,
    title: "Content that connects",
    description:
      "Blogs and forums scoped to your community. Identity and content, finally in one place.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Nav */}
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-sm font-bold text-primary-foreground">
              BL
            </span>
          </div>
          <span className="text-sm font-semibold tracking-tight">
            Builder Launchpad
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={undefined}>
            <Link href="/login">Log in</Link>
          </Button>
          <Button size="sm">
            <Link href="/signup" className="flex items-center gap-1.5">
              Get started
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-6">
        <div className="mx-auto max-w-2xl text-center">
          {/* Pill badge */}
          <div className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
            Now in early access
          </div>

          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            Where builder communities{" "}
            <span className="text-primary">come alive</span>
          </h1>

          <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
            One platform for member management, content, and talent
            discovery. Stop duct-taping Discord, Sheets, and Forms.
            Start building together.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg">
              <Link href="/signup" className="flex items-center gap-2">
                Create your community
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg">
              <Link href="/communities">Explore communities</Link>
            </Button>
          </div>
        </div>

        {/* Social proof hint */}
        <div className="mt-16 flex flex-col items-center gap-2">
          <div className="flex -space-x-2">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium text-muted-foreground"
              >
                {String.fromCharCode(65 + i)}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Trusted by student tech communities across the Philippines
          </p>
        </div>
      </main>

      {/* Features grid */}
      <section className="border-t border-border bg-muted/20 px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Everything your community needs
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Built for tech communities. Not adapted from generic tools.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/20 hover:bg-primary/[0.02]"
              >
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                  <feature.icon className="h-4.5 w-4.5" />
                </div>
                <h3 className="text-sm font-semibold">{feature.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-md text-center">
          <h2 className="text-2xl font-semibold tracking-tight">
            Ready to give your community a home?
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Free to start. Set up in minutes.
          </p>
          <div className="mt-6">
            <Button size="lg">
              <Link href="/signup" className="flex items-center gap-2">
                Get started
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-6">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-primary">
              <span className="text-[8px] font-bold text-primary-foreground">
                BL
              </span>
            </div>
            Builder Launchpad
          </div>
          <p className="text-xs text-muted-foreground">
            Built by{" "}
            <span className="font-medium text-foreground">Bscale Labs</span>
          </p>
        </div>
      </footer>
    </div>
  );
}

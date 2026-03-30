import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getSession } from "@/lib/session";

export default async function LandingPage() {
  const session = await getSession();
  if (session) redirect("/feed");
  return (
    <div className="flex min-h-svh flex-col bg-[oklch(0.07_0.01_260)]">
      {/* Nav */}
      <header className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-white">
            <span className="text-[9px] font-bold text-[oklch(0.07_0.01_260)]">
              BL
            </span>
          </div>
          <span className="text-[13px] font-medium text-white/70">
            Builder Launchpad
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-[13px] text-white/40 transition-colors hover:text-white/70"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="inline-flex h-7 items-center gap-1.5 rounded-md bg-white/10 px-3 text-[13px] font-medium text-white/80 transition-colors hover:bg-white/15 hover:text-white"
          >
            Sign up
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-6 pb-24">
        <h1
          className="animate-in fade-in slide-in-from-bottom-2 text-[clamp(2.75rem,6.5vw,4.75rem)] font-medium leading-[1.08] tracking-[-0.03em] text-white fill-mode-backwards"
          style={{ animationDelay: "0ms", animationDuration: "600ms" }}
        >
          One home for your
          <br />
          builder community
        </h1>

        <p
          className="mt-5 max-w-md animate-in fade-in slide-in-from-bottom-1 text-base leading-relaxed text-white/30 fill-mode-backwards sm:text-[17px]"
          style={{ animationDelay: "120ms", animationDuration: "500ms" }}
        >
          Member management, talent discovery, and community
          content in one platform built for tech orgs.
        </p>

        <div
          className="mt-8 flex animate-in fade-in slide-in-from-bottom-1 gap-3 fill-mode-backwards"
          style={{ animationDelay: "250ms", animationDuration: "500ms" }}
        >
          <Link
            href="/signup"
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-white px-4 text-[13px] font-medium text-[oklch(0.07_0.01_260)] transition-colors hover:bg-white/90"
          >
            Get started
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href="/communities"
            className="inline-flex h-9 items-center rounded-lg border border-white/10 px-4 text-[13px] font-medium text-white/40 transition-colors hover:border-white/20 hover:text-white/60"
          >
            Explore communities
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="mx-auto w-full max-w-5xl px-6 pb-6">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-white/15">
            &copy; {new Date().getFullYear()} Builder Launchpad
          </span>
          <span className="text-[11px] text-white/15">Bscale Labs</span>
        </div>
      </footer>
    </div>
  );
}

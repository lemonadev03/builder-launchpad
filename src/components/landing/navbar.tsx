"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 10);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 z-50 w-full transition-[background-color,border-color] duration-300",
        scrolled
          ? "border-b border-[oklch(1_0_0_/_0.08)] bg-[oklch(0.10_0.015_255_/_0.9)] backdrop-blur-xl"
          : "bg-transparent"
      )}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[oklch(0.60_0.15_255)]">
            <span className="text-[10px] font-bold text-white">BL</span>
          </div>
          <span className="text-sm font-semibold tracking-tight text-white">
            Builder Launchpad
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "text-[oklch(0.75_0.01_255)] hover:bg-[oklch(1_0_0_/_0.08)] hover:text-white"
            )}
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className={cn(
              buttonVariants({ size: "sm" }),
              "gap-1.5 bg-white text-[oklch(0.13_0.015_255)] hover:bg-white/90"
            )}
          >
            Get started
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, LayoutDashboard, Shield, Tags, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const PLATFORM_NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/platform",
    icon: LayoutDashboard,
  },
  {
    label: "Communities",
    href: "/platform/communities",
    icon: Building2,
  },
  {
    label: "Users",
    href: "/platform/users",
    icon: Users,
  },
  {
    label: "Tags",
    href: "/platform/tags",
    icon: Tags,
  },
  {
    label: "Moderation",
    href: "/platform/moderation",
    icon: Shield,
  },
];

export function PlatformNav() {
  const pathname = usePathname();

  return (
    <nav className="mb-8 flex flex-wrap gap-2">
      {PLATFORM_NAV_ITEMS.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground",
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

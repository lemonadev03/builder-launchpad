import {
  ExternalLink,
  Globe,
  Mail,
  MessageCircle,
  Code2,
  Share2,
} from "lucide-react";
import type { SocialLinks as SocialLinksType } from "@/db/schema";

const PLATFORM_CONFIG: Record<
  string,
  { icon: React.ElementType; label: string }
> = {
  linkedin: { icon: Share2, label: "LinkedIn" },
  github: { icon: Code2, label: "GitHub" },
  twitter: { icon: ExternalLink, label: "Twitter / X" },
  facebook: { icon: ExternalLink, label: "Facebook" },
  discord: { icon: MessageCircle, label: "Discord" },
  website: { icon: Globe, label: "Website" },
  email: { icon: Mail, label: "Email" },
};

const PLATFORM_ORDER = [
  "linkedin",
  "github",
  "twitter",
  "facebook",
  "discord",
  "website",
  "email",
] as const;

interface SocialLinksProps {
  links: SocialLinksType;
}

export function SocialLinks({ links }: SocialLinksProps) {
  const entries = PLATFORM_ORDER.filter(
    (key) => links[key] && links[key]!.trim() !== "",
  );

  if (entries.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {entries.map((key) => {
        const config = PLATFORM_CONFIG[key];
        const value = links[key]!;
        const Icon = config.icon;

        const href = key === "email" ? `mailto:${value}` : value;

        return (
          <a
            key={key}
            href={href}
            target={key === "email" ? undefined : "_blank"}
            rel={key === "email" ? undefined : "noopener noreferrer"}
            className="inline-flex items-center gap-1.5 rounded-md border border-border/50 bg-muted/30 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title={config.label}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{config.label}</span>
          </a>
        );
      })}
    </div>
  );
}

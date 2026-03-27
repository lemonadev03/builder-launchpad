import Link from "next/link";

interface CommunityCardProps {
  name: string;
  slug: string;
  tagline?: string | null;
  logoUrl?: string | null;
  location?: string | null;
  primaryColor?: string | null;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function CommunityCard({
  name,
  slug,
  tagline,
  logoUrl,
  location,
  primaryColor,
}: CommunityCardProps) {
  return (
    <Link
      href={`/communities/${slug}`}
      className="group flex gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50"
    >
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg"
        style={{ backgroundColor: primaryColor || undefined }}
      >
        {logoUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={logoUrl}
            alt={name}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-sm font-bold text-white">
            {getInitials(name)}
          </span>
        )}
      </div>

      <div className="min-w-0">
        <p className="truncate font-medium group-hover:text-primary">
          {name}
        </p>
        {tagline && (
          <p className="truncate text-sm text-muted-foreground">{tagline}</p>
        )}
        {location && (
          <p className="text-xs text-muted-foreground">{location}</p>
        )}
      </div>
    </Link>
  );
}

interface CommunityHeaderProps {
  name: string;
  tagline?: string | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  primaryColor?: string | null;
  memberCount: number;
  location?: string | null;
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

export function CommunityHeader({
  name,
  tagline,
  logoUrl,
  bannerUrl,
  primaryColor,
  memberCount,
  location,
}: CommunityHeaderProps) {
  const accentColor = primaryColor || "oklch(0.40 0.12 255)";

  return (
    <div>
      {/* Banner */}
      <div
        className="h-32 w-full rounded-lg sm:h-40"
        style={{
          backgroundColor: accentColor,
          backgroundImage: bannerUrl ? `url(${bannerUrl})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      {/* Logo + Info */}
      <div className="relative px-4 sm:px-6">
        <div className="-mt-10 flex items-end gap-4">
          {/* Logo */}
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border-4 border-background bg-muted">
            {logoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={logoUrl}
                alt={name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-xl font-bold text-muted-foreground">
                {getInitials(name)}
              </span>
            )}
          </div>

          {/* Name + meta */}
          <div className="min-w-0 pb-1">
            <h1 className="truncate text-xl font-bold">{name}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>
                {memberCount} member{memberCount !== 1 ? "s" : ""}
              </span>
              {location && (
                <>
                  <span>&middot;</span>
                  <span className="truncate">{location}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {tagline && (
          <p className="mt-3 text-sm text-muted-foreground">{tagline}</p>
        )}
      </div>
    </div>
  );
}

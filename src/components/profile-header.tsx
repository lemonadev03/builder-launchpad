import Link from "next/link";
import { MapPin, Pencil } from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import { imageUrl } from "@/lib/utils";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

interface ProfileHeaderProps {
  displayName: string;
  username: string;
  tagline?: string | null;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  location?: string | null;
  isOwner?: boolean;
}

export function ProfileHeader({
  displayName,
  username,
  tagline,
  avatarUrl,
  bannerUrl,
  location,
  isOwner,
}: ProfileHeaderProps) {
  return (
    <div>
      {/* Banner */}
      <div className="h-32 w-full overflow-hidden rounded-lg sm:h-40">
        {bannerUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={imageUrl(bannerUrl) ?? bannerUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10" />
        )}
      </div>

      {/* Avatar + Info */}
      <div className="relative px-4 pb-4 sm:px-6">
        <div className="-mt-12 flex items-end gap-4 sm:-mt-14">
          {/* Avatar */}
          <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-background sm:h-28 sm:w-28">
            {avatarUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={imageUrl(avatarUrl) ?? avatarUrl}
                alt={displayName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted text-2xl font-semibold text-muted-foreground sm:text-3xl">
                {getInitials(displayName)}
              </div>
            )}
          </div>

          {/* Name block */}
          <div className="min-w-0 flex-1 pb-1">
            <h1 className="truncate text-xl font-semibold sm:text-2xl">
              {displayName}
            </h1>
            <p className="text-sm text-muted-foreground">@{username}</p>
          </div>

          {isOwner && (
            <Link
              href="/settings/profile"
              className={buttonVariants({ variant: "outline", size: "sm", className: "shrink-0 self-center" })}
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit profile
            </Link>
          )}
        </div>

        {/* Tagline + location */}
        <div className="mt-3 space-y-1.5 px-0">
          {tagline && (
            <p className="text-sm text-foreground/80">{tagline}</p>
          )}
          {location && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>{location}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

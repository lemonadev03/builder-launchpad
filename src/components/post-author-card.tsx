import Link from "next/link";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface PostAuthorCardProps {
  displayName: string;
  username: string;
  avatarUrl: string | null;
  role: string | null;
}

export function PostAuthorCard({
  displayName,
  username,
  avatarUrl,
  role,
}: PostAuthorCardProps) {
  return (
    <Link
      href={`/profile/${username}`}
      className="flex items-center gap-3 transition-opacity hover:opacity-80"
    >
      <Avatar className="h-10 w-10">
        {avatarUrl ? (
          <AvatarImage src={avatarUrl} alt={displayName} />
        ) : null}
        <AvatarFallback className="text-sm">
          {displayName.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{displayName}</span>
          {role && role !== "member" && (
            <Badge variant="secondary" className="text-xs capitalize">
              {role}
            </Badge>
          )}
        </div>
        <span className="text-xs text-muted-foreground">@{username}</span>
      </div>
    </Link>
  );
}

import { Badge } from "@/components/ui/badge";
import type { PlatformUserStatus } from "@/lib/queries/platform-user";

export function PlatformUserStatusBadge({
  status,
}: {
  status: PlatformUserStatus;
}) {
  if (status === "deleted") {
    return (
      <Badge variant="outline" className="border-amber-200 text-amber-700">
        Deleted
      </Badge>
    );
  }

  if (status === "suspended") {
    return (
      <Badge variant="outline" className="border-destructive/30 text-destructive">
        Suspended
      </Badge>
    );
  }

  return <Badge variant="outline">Active</Badge>;
}

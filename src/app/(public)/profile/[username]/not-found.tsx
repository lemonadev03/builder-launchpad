import Link from "next/link";
import { UserX } from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";

export default function ProfileNotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <UserX className="h-12 w-12 text-muted-foreground" />
      <div>
        <h2 className="text-lg font-semibold">Profile not found</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          This profile doesn&apos;t exist or may have been removed.
        </p>
      </div>
      <Link href="/directory" className={buttonVariants({ variant: "outline" })}>
        Browse directory
      </Link>
    </div>
  );
}

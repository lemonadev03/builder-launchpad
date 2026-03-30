import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";

export default function ForbiddenPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-6 text-center">
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <ShieldAlert className="h-7 w-7" />
      </div>
      <h1 className="text-2xl font-semibold">403 · Access restricted</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        This area is reserved for Builder Launchpad platform admins.
      </p>
      <div className="mt-6 flex gap-3">
        <Link href="/feed" className={buttonVariants()}>
          Back to feed
        </Link>
        <Link
          href="/communities"
          className={buttonVariants({ variant: "outline" })}
        >
          Browse communities
        </Link>
      </div>
    </main>
  );
}

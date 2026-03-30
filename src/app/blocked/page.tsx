import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import { getPlatformAppealEmail } from "@/lib/user-access";

export default function BlockedPage() {
  const appealEmail = getPlatformAppealEmail();

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-6 text-center">
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <ShieldAlert className="h-7 w-7" />
      </div>
      <h1 className="text-2xl font-semibold">Account blocked</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Your account has been blocked from using Builder Launchpad.
      </p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {appealEmail
          ? (
              <>
                You can appeal by contacting{" "}
                <a className="font-medium text-foreground" href={`mailto:${appealEmail}`}>
                  {appealEmail}
                </a>
                .
              </>
            )
          : "Contact the Builder Launchpad support team if you believe this is an error."}
      </p>
      <div className="mt-6 flex gap-3">
        <Link href="/" className={buttonVariants()}>
          Back to home
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

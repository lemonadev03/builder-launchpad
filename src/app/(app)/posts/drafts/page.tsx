import Link from "next/link";
import type { Metadata } from "next";
import { requireSession } from "@/lib/session";
import { getDraftsByUser } from "@/lib/queries/post";

export const metadata: Metadata = {
  title: "My Drafts | Builder Launchpad",
};

export default async function DraftsPage() {
  const session = await requireSession();
  const drafts = await getDraftsByUser(session.user.id);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-semibold">My Drafts</h1>
        <Link
          href="/posts/new"
          className="text-sm text-primary hover:underline"
        >
          New post
        </Link>
      </div>

      {drafts.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No drafts yet. Start writing!
        </p>
      ) : (
        <div className="space-y-2">
          {drafts.map((d) => (
            <Link
              key={d.id}
              href={`/posts/edit/${d.id}`}
              className="flex items-center justify-between rounded-lg border px-4 py-3 transition-colors hover:bg-muted/50"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {d.title || "Untitled"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {d.communityName}
                </p>
              </div>
              <span className="ml-4 shrink-0 text-xs text-muted-foreground">
                {d.updatedAt.toLocaleDateString()}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

import type { Metadata } from "next";
import { requireSession } from "@/lib/session";
import { getUserCommunities } from "@/lib/queries/membership";
import { PostEditor } from "@/components/post-editor";

interface Props {
  searchParams: Promise<{ community?: string }>;
}

export const metadata: Metadata = {
  title: "New Post | Builder Launchpad",
};

export default async function NewPostPage({ searchParams }: Props) {
  const session = await requireSession();
  const sp = await searchParams;
  const communities = await getUserCommunities(session.user.id);

  if (communities.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-lg font-semibold">New Post</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You need to be a member of at least one community to write a post.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-lg font-semibold">New Post</h1>
      <PostEditor
        communities={communities}
        initialCommunitySlug={sp.community}
      />
    </div>
  );
}

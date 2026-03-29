import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { requireSession } from "@/lib/session";
import { getPostById } from "@/lib/queries/post";
import { getUserCommunities } from "@/lib/queries/membership";
import { PostEditor } from "@/components/post-editor";
import type { TiptapContent } from "@/lib/tiptap";

interface Props {
  params: Promise<{ postId: string }>;
}

export const metadata: Metadata = {
  title: "Edit Post | Builder Launchpad",
};

export default async function EditPostPage({ params }: Props) {
  const { postId } = await params;
  const session = await requireSession();

  const p = await getPostById(postId);
  if (!p) notFound();

  if (p.authorId !== session.user.id) {
    redirect(`/communities/${p.communitySlug}/posts/${p.slug}`);
  }

  const communities = await getUserCommunities(session.user.id);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-lg font-semibold">Edit Post</h1>
      <PostEditor
        communities={communities}
        post={{
          id: p.id,
          title: p.title,
          slug: p.slug,
          content: p.content as TiptapContent,
          status: p.status,
          communitySlug: p.communitySlug,
          communityId: p.communityId,
        }}
      />
    </div>
  );
}

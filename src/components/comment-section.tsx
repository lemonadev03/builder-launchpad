"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Pencil,
  Trash2,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CommentEditor } from "@/components/comment-editor";
import { CommentRenderer } from "@/components/comment-renderer";
import { ReactionBar } from "@/components/reaction-bar";
import { FlagButton } from "@/components/flag-button";
import type { TiptapContent } from "@/lib/tiptap";

interface CommentData {
  id: string;
  content: unknown;
  postId: string;
  parentCommentId: string | null;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  authorDisplayName: string;
  authorUsername: string;
  authorAvatarUrl: string | null;
  authorRole?: string | null;
  reactionCounts?: Record<string, number>;
  userReactions?: string[];
  flagged?: boolean;
  replies?: CommentData[];
  replyCount?: number;
}

interface CommentSectionProps {
  communitySlug: string;
  postSlug: string;
  comments: CommentData[];
  total: number;
  currentUserId: string | null;
  isModerator: boolean;
}

export function CommentSection({
  communitySlug,
  postSlug,
  comments,
  total,
  currentUserId,
  isModerator,
}: CommentSectionProps) {
  const router = useRouter();
  const [showNewComment, setShowNewComment] = useState(false);
  const [, startTransition] = useTransition();

  const apiBase = `/api/communities/${communitySlug}/posts/${postSlug}/comments`;

  return (
    <section>
      <div className="mb-4 flex items-center gap-2">
        <MessageCircle className="h-4 w-4" />
        <h2 className="text-sm font-semibold">Comments ({total})</h2>
      </div>

      {currentUserId ? (
        <div className="mb-6">
          {showNewComment ? (
            <CommentForm
              apiBase={apiBase}
              onCancel={() => setShowNewComment(false)}
              onSuccess={() => {
                setShowNewComment(false);
                startTransition(() => router.refresh());
              }}
            />
          ) : (
            <button
              onClick={() => setShowNewComment(true)}
              className="w-full rounded-md border border-dashed px-3 py-2.5 text-left text-sm text-muted-foreground transition-colors hover:bg-muted/50"
            >
              Write a comment...
            </button>
          )}
        </div>
      ) : (
        <p className="mb-6 text-sm text-muted-foreground">
          Sign in to comment.
        </p>
      )}

      <div className="space-y-4">
        {comments.map((c) => (
          <TopLevelComment
            key={c.id}
            comment={c}
            currentUserId={currentUserId}
            isModerator={isModerator}
            apiBase={apiBase}
            onMutate={() => startTransition(() => router.refresh())}
          />
        ))}
      </div>
    </section>
  );
}

function TopLevelComment({
  comment,
  currentUserId,
  isModerator,
  apiBase,
  onMutate,
}: {
  comment: CommentData;
  currentUserId: string | null;
  isModerator: boolean;
  apiBase: string;
  onMutate: () => void;
}) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showAllReplies, setShowAllReplies] = useState(false);
  const [editing, setEditing] = useState(false);

  const replies = comment.replies ?? [];
  const visibleReplies = showAllReplies ? replies : replies.slice(0, 2);
  const hiddenCount = replies.length - 2;
  const isDeleted = !!comment.deletedAt;

  return (
    <div className="group">
      <CommentItem
        comment={comment}
        currentUserId={currentUserId}
        isModerator={isModerator}
        isEditing={editing}
        onEdit={() => setEditing(true)}
        onCancelEdit={() => setEditing(false)}
        onSaveEdit={async (content) => {
          await fetch(`${apiBase}/${comment.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content }),
          });
          setEditing(false);
          onMutate();
        }}
        onDelete={async () => {
          await fetch(`${apiBase}/${comment.id}`, { method: "DELETE" });
          onMutate();
        }}
      />

      {!isDeleted && currentUserId && (
        <div className="mt-1 ml-10">
          <button
            onClick={() => setShowReplyForm(!showReplyForm)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Reply
          </button>
        </div>
      )}

      {replies.length > 0 && (
        <div className="mt-2 ml-10 space-y-3 border-l pl-4">
          {visibleReplies.map((r) => (
            <ReplyItem
              key={r.id}
              comment={r}
              currentUserId={currentUserId}
              isModerator={isModerator}
              apiBase={apiBase}
              onMutate={onMutate}
            />
          ))}

          {!showAllReplies && hiddenCount > 0 && (
            <button
              onClick={() => setShowAllReplies(true)}
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <ChevronDown className="h-3 w-3" />
              View {hiddenCount} more{" "}
              {hiddenCount === 1 ? "reply" : "replies"}
            </button>
          )}

          {showAllReplies && hiddenCount > 0 && (
            <button
              onClick={() => setShowAllReplies(false)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <ChevronUp className="h-3 w-3" />
              Show less
            </button>
          )}
        </div>
      )}

      {showReplyForm && (
        <div className="mt-2 ml-10 border-l pl-4">
          <CommentForm
            apiBase={apiBase}
            parentCommentId={comment.id}
            onCancel={() => setShowReplyForm(false)}
            onSuccess={() => {
              setShowReplyForm(false);
              setShowAllReplies(true);
              onMutate();
            }}
            placeholder="Write a reply..."
            compact
          />
        </div>
      )}
    </div>
  );
}

function ReplyItem({
  comment,
  currentUserId,
  isModerator,
  apiBase,
  onMutate,
}: {
  comment: CommentData;
  currentUserId: string | null;
  isModerator: boolean;
  apiBase: string;
  onMutate: () => void;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <CommentItem
      comment={comment}
      currentUserId={currentUserId}
      isModerator={isModerator}
      isEditing={editing}
      onEdit={() => setEditing(true)}
      onCancelEdit={() => setEditing(false)}
      onSaveEdit={async (content) => {
        await fetch(`${apiBase}/${comment.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        });
        setEditing(false);
        onMutate();
      }}
      onDelete={async () => {
        await fetch(`${apiBase}/${comment.id}`, { method: "DELETE" });
        onMutate();
      }}
      compact
    />
  );
}

function CommentItem({
  comment,
  currentUserId,
  isModerator,
  isEditing,
  onEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  compact,
}: {
  comment: CommentData;
  currentUserId: string | null;
  isModerator: boolean;
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: (content: unknown) => Promise<void>;
  onDelete: () => Promise<void>;
  compact?: boolean;
}) {
  const [editContent, setEditContent] = useState<TiptapContent | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isDeleted = !!comment.deletedAt;
  const isAuthor = currentUserId === comment.authorId;
  const canEdit = isAuthor && !isDeleted;
  const canDelete = (isAuthor || isModerator) && !isDeleted;
  const createdAt = new Date(comment.createdAt);
  const wasEdited = comment.updatedAt !== comment.createdAt && !isDeleted;

  if (isDeleted) {
    return (
      <div className="py-2 text-xs italic text-muted-foreground">
        This comment was deleted.
      </div>
    );
  }

  return (
    <div className="group/item">
      <div className="flex items-center gap-2">
        <Avatar className={compact ? "h-5 w-5" : "h-7 w-7"}>
          {comment.authorAvatarUrl ? (
            <AvatarImage
              src={comment.authorAvatarUrl}
              alt={comment.authorDisplayName}
            />
          ) : null}
          <AvatarFallback className="text-[10px]">
            {comment.authorDisplayName.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="text-xs font-medium">
          {comment.authorDisplayName}
        </span>
        {comment.authorRole && comment.authorRole !== "member" && (
          <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
            {comment.authorRole}
          </Badge>
        )}
        <time
          dateTime={createdAt.toISOString()}
          className="text-[11px] text-muted-foreground"
        >
          {createdAt.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </time>
        {wasEdited && (
          <span className="text-[10px] text-muted-foreground">(edited)</span>
        )}
      </div>

      {isEditing ? (
        <div className="mt-2 ml-9 space-y-2">
          <CommentEditor
            onChange={(json) => setEditContent(json)}
            initialContent={comment.content as TiptapContent}
            autoFocus
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={saving || !editContent}
              onClick={async () => {
                if (!editContent) return;
                setSaving(true);
                await onSaveEdit(editContent);
                setSaving(false);
              }}
            >
              {saving ? "Saving..." : "Save"}
            </Button>
            <Button size="sm" variant="ghost" onClick={onCancelEdit}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-1 ml-9 text-sm">
          <CommentRenderer content={comment.content as TiptapContent} />
        </div>
      )}

      {!isEditing && (
        <div className="mt-1 ml-9 flex items-center gap-2">
          <ReactionBar
            targetType="comment"
            targetId={comment.id}
            counts={comment.reactionCounts ?? {}}
            userReactions={comment.userReactions ?? []}
            compact
          />

          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover/item:opacity-100">
            {canEdit && (
              <button
                onClick={onEdit}
                className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                title="Edit"
              >
                <Pencil className="h-3 w-3" />
              </button>
            )}
            {canDelete && (
              <button
                onClick={async () => {
                  if (!window.confirm("Delete this comment?")) return;
                  setDeleting(true);
                  await onDelete();
                  setDeleting(false);
                }}
                disabled={deleting}
                className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                title="Delete"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
            {currentUserId && !isAuthor && (
              <FlagButton
                targetType="comment"
                targetId={comment.id}
                flagged={comment.flagged}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CommentForm({
  apiBase,
  parentCommentId,
  onCancel,
  onSuccess,
  placeholder = "Write a comment...",
  compact,
}: {
  apiBase: string;
  parentCommentId?: string;
  onCancel: () => void;
  onSuccess: () => void;
  placeholder?: string;
  compact?: boolean;
}) {
  const [content, setContent] = useState<TiptapContent | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!content) return;
    setSubmitting(true);
    setError(null);

    const res = await fetch(apiBase, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content,
        parentCommentId: parentCommentId ?? null,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to post comment.");
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    onSuccess();
  }

  return (
    <div className="space-y-2">
      <CommentEditor
        onChange={setContent}
        placeholder={placeholder}
        autoFocus
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button
          size="sm"
          disabled={submitting || !content}
          onClick={handleSubmit}
        >
          {submitting ? "Posting..." : compact ? "Reply" : "Comment"}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

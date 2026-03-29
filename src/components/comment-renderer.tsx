"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import LinkExt from "@tiptap/extension-link";
import type { TiptapContent } from "@/lib/tiptap";
import "@/components/editor/editor.css";

interface CommentRendererProps {
  content: TiptapContent;
}

export function CommentRenderer({ content }: CommentRendererProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        bulletList: false,
        orderedList: false,
        codeBlock: false,
        horizontalRule: false,
      }),
      LinkExt.configure({
        openOnClick: true,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
    ],
    content,
    editable: false,
  });

  if (!editor) return null;

  return <EditorContent editor={editor} className="comment-content" />;
}

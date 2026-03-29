"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import LinkExt from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { Bold, Italic, Code, Link as LinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TiptapContent } from "@/lib/tiptap";
import "@/components/editor/editor.css";

interface CommentEditorProps {
  onChange: (json: TiptapContent) => void;
  placeholder?: string;
  initialContent?: TiptapContent | null;
  autoFocus?: boolean;
}

export function CommentEditor({
  onChange,
  placeholder = "Write a comment...",
  initialContent,
  autoFocus = false,
}: CommentEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        bulletList: false,
        orderedList: false,
        codeBlock: false,
        horizontalRule: false,
        hardBreak: { keepMarks: true },
      }),
      LinkExt.configure({
        openOnClick: false,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: initialContent ?? undefined,
    autofocus: autoFocus,
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getJSON() as TiptapContent);
    },
  });

  if (!editor) return null;

  function toggleLink() {
    if (!editor) return;
    if (editor.isActive("link")) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    const url = window.prompt("URL:");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }

  return (
    <div className="rounded-md border">
      <div className="flex items-center gap-0.5 border-b px-2 py-1">
        <ToolbarButton
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold"
        >
          <Bold className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic"
        >
          <Italic className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("code")}
          onClick={() => editor.chain().focus().toggleCode().run()}
          title="Code"
        >
          <Code className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("link")}
          onClick={toggleLink}
          title="Link"
        >
          <LinkIcon className="h-3.5 w-3.5" />
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} className="comment-editor" />
    </div>
  );
}

function ToolbarButton({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "rounded p-1 transition-colors",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

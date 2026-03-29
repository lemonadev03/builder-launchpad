"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ImageExt from "@tiptap/extension-image";
import LinkExt from "@tiptap/extension-link";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import type { TiptapContent } from "@/lib/tiptap";
import "./editor.css";

const lowlight = createLowlight(common);

interface RichTextRendererProps {
  content: TiptapContent;
}

export function RichTextRenderer({ content }: RichTextRendererProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      ImageExt,
      LinkExt.configure({
        openOnClick: true,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
      CodeBlockLowlight.configure({ lowlight }),
    ],
    content,
    editable: false,
  });

  if (!editor) return null;

  return <EditorContent editor={editor} />;
}

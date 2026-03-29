"use client";

import { useCallback, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ImageExt from "@tiptap/extension-image";
import LinkExt from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import { EditorToolbar } from "./editor-toolbar";
import { countImages } from "@/lib/tiptap";
import type { TiptapContent } from "@/lib/tiptap";
import "./editor.css";

const lowlight = createLowlight(common);

const MAX_IMAGES = 10;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

interface RichTextEditorProps {
  content: TiptapContent | null;
  onChange: (json: TiptapContent) => void;
  uploadUrl: string;
  placeholder?: string;
}

export function RichTextEditor({
  content,
  onChange,
  uploadUrl,
  placeholder = "Start writing...",
}: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      ImageExt.configure({
        allowBase64: false,
        HTMLAttributes: { class: "editor-image" },
      }),
      LinkExt.configure({
        openOnClick: false,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
      CodeBlockLowlight.configure({ lowlight }),
      Placeholder.configure({ placeholder }),
    ],
    content: content ?? undefined,
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getJSON() as TiptapContent);
    },
    editorProps: {
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;

        for (const item of items) {
          if (item.type.startsWith("image/")) {
            event.preventDefault();
            const file = item.getAsFile();
            if (file) uploadImage(file);
            return true;
          }
        }
        return false;
      },
      handleDrop: (view, event) => {
        const files = event.dataTransfer?.files;
        if (!files?.length) return false;

        for (const file of files) {
          if (file.type.startsWith("image/")) {
            event.preventDefault();
            uploadImage(file);
            return true;
          }
        }
        return false;
      },
    },
  });

  const uploadImage = useCallback(
    async (file: File) => {
      if (!editor) return;

      if (file.size > MAX_IMAGE_SIZE) {
        alert("Image must be under 5MB.");
        return;
      }

      const currentImages = countImages(editor.getJSON() as TiptapContent);
      if (currentImages >= MAX_IMAGES) {
        alert(`Maximum ${MAX_IMAGES} images per post.`);
        return;
      }

      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch(uploadUrl, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          alert(data.error || "Failed to upload image.");
          return;
        }

        const { url } = await res.json();
        editor.chain().focus().setImage({ src: url }).run();
      } catch {
        alert("Failed to upload image.");
      }
    },
    [editor, uploadUrl],
  );

  function handleImageButtonClick() {
    fileInputRef.current?.click();
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadImage(file);
    e.target.value = "";
  }

  if (!editor) return null;

  return (
    <div className="rounded-md border">
      <EditorToolbar editor={editor} onImageUpload={handleImageButtonClick} />
      <EditorContent editor={editor} />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  );
}

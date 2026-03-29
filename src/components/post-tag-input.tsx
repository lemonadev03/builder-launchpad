"use client";

import { useState, useRef } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface PostTagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  max?: number;
}

export function PostTagInput({ tags, onChange, max = 5 }: PostTagInputProps) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function addTag(raw: string) {
    const tag = raw.trim().toLowerCase();
    if (!tag || tag.length > 30) return;
    if (tags.length >= max) return;
    if (tags.includes(tag)) return;
    onChange([...tags, tag]);
    setInput("");
  }

  function removeTag(tag: string) {
    onChange(tags.filter((t) => t !== tag));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(input);
    }
    if (e.key === "Backspace" && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1 pr-1">
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      {tags.length < max && (
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => input && addTag(input)}
          placeholder={tags.length === 0 ? "Add tags (press Enter)" : "Add another tag"}
          maxLength={30}
        />
      )}
      <p className="text-xs text-muted-foreground">
        {tags.length}/{max} tags
      </p>
    </div>
  );
}

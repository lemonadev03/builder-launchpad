"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ShareUrlProps {
  url: string;
}

export function ShareUrl({ url }: ShareUrlProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-center gap-2">
      <Input value={url} readOnly className="text-xs" />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleCopy}
        className="shrink-0"
      >
        {copied ? (
          <Check className="h-4 w-4" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}

"use client";

import { ExternalLink } from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";

interface ApplyButtonProps {
  jobId: string;
  applicationUrl: string;
}

export function ApplyButton({ jobId, applicationUrl }: ApplyButtonProps) {
  function handleClick() {
    // Fire-and-forget click tracking — don't block navigation
    fetch(`/api/jobs/${jobId}/click`, { method: "POST" }).catch(() => {});
  }

  return (
    <a
      href={applicationUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={buttonVariants({ className: "gap-1.5" })}
    >
      Apply
      <ExternalLink className="h-3.5 w-3.5" />
    </a>
  );
}

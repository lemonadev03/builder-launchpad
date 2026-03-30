import Link from "next/link";
import { MapPin, Clock, DollarSign, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { JobListingWithCompany } from "@/lib/queries/job";

const typeLabel: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  freelance: "Freelance",
  internship: "Internship",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  const days = Math.floor(seconds / 86400);
  if (days > 30) return `${Math.floor(days / 30)}mo ago`;
  if (days > 0) return `${days}d ago`;
  const hours = Math.floor(seconds / 3600);
  if (hours > 0) return `${hours}h ago`;
  return "Just now";
}

interface JobCardProps {
  job: JobListingWithCompany;
}

export function JobCard({ job: j }: JobCardProps) {
  return (
    <Link
      href={`/jobs/${j.id}`}
      className="block rounded-lg border p-4 transition-colors hover:bg-muted/50"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary">
          {j.companyLogoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={j.companyLogoUrl}
              alt={j.companyName}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-xs font-bold text-white">
              {getInitials(j.companyName)}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{j.title}</p>
          <p className="text-xs text-muted-foreground">{j.companyName}</p>
        </div>

        <Badge variant="secondary" className="shrink-0 text-[10px]">
          {typeLabel[j.employmentType] ?? j.employmentType}
        </Badge>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
        {j.location && (
          <span className="flex items-center gap-0.5">
            <MapPin className="h-3 w-3" />
            {j.location}
          </span>
        )}
        {j.remote && (
          <span className="flex items-center gap-0.5">
            <Globe className="h-3 w-3" />
            Remote
          </span>
        )}
        {j.salaryRange && (
          <span className="flex items-center gap-0.5">
            <DollarSign className="h-3 w-3" />
            {j.salaryRange}
          </span>
        )}
        <span className="ml-auto flex items-center gap-0.5">
          <Clock className="h-3 w-3" />
          {timeAgo(j.createdAt)}
        </span>
      </div>
    </Link>
  );
}

export function JobCardSkeleton() {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 shrink-0 animate-pulse rounded-lg bg-muted" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-4 w-40 animate-pulse rounded bg-muted" />
          <div className="h-3 w-24 animate-pulse rounded bg-muted" />
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <div className="h-4 w-20 animate-pulse rounded bg-muted" />
        <div className="h-4 w-16 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}

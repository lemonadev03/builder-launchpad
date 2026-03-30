import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowLeft,
  ExternalLink,
  MapPin,
  Globe,
  DollarSign,
  Briefcase,
  Clock,
  Building2,
} from "lucide-react";
import { getJobById } from "@/lib/queries/job";
import { buttonVariants } from "@/components/ui/button-variants";
import { Badge } from "@/components/ui/badge";

const typeLabel: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  freelance: "Freelance",
  internship: "Internship",
};

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const job = await getJobById(id);

  if (!job) {
    return { title: "Job Not Found | Builder Launchpad" };
  }

  return {
    title: `${job.title} at ${job.companyName} | Builder Launchpad`,
    description:
      job.description.slice(0, 160) +
      (job.description.length > 160 ? "..." : ""),
  };
}

export default async function JobDetailPage({ params }: Props) {
  const { id } = await params;
  const job = await getJobById(id);

  if (!job) notFound();

  const postedDate = job.createdAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Back */}
      <Link
        href="/jobs"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All jobs
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary">
            {job.companyLogoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={job.companyLogoUrl}
                alt={job.companyName}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-sm font-bold text-white">
                {job.companyName
                  .split(" ")
                  .map((n) => n[0])
                  .filter(Boolean)
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold">{job.title}</h1>
            <p className="text-sm text-muted-foreground">{job.companyName}</p>
          </div>
        </div>

        {/* Meta badges */}
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="secondary">
            <Briefcase className="mr-1 h-3 w-3" />
            {typeLabel[job.employmentType] ?? job.employmentType}
          </Badge>
          {job.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {job.location}
            </span>
          )}
          {job.remote && (
            <span className="flex items-center gap-1">
              <Globe className="h-3.5 w-3.5" />
              Remote
            </span>
          )}
          {job.salaryRange && (
            <span className="flex items-center gap-1">
              <DollarSign className="h-3.5 w-3.5" />
              {job.salaryRange}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            Posted {postedDate}
          </span>
        </div>

        {/* Apply CTA */}
        <div className="mt-6">
          <a
            href={job.applicationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ className: "gap-1.5" })}
          >
            Apply
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* Description */}
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Description
        </h2>
        <div className="whitespace-pre-wrap text-sm leading-relaxed">
          {job.description}
        </div>
      </section>

      {/* Requirements */}
      {job.requirements && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Requirements
          </h2>
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {job.requirements}
          </div>
        </section>
      )}

      {/* Company info */}
      <section className="rounded-lg border p-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Building2 className="h-4 w-4" />
          About {job.companyName}
        </div>
        {job.companyDescription && (
          <p className="mt-2 text-sm text-muted-foreground">
            {job.companyDescription}
          </p>
        )}
        {job.companyWebsite && (
          <a
            href={job.companyWebsite}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            {job.companyWebsite.replace(/^https?:\/\//, "")}
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </section>
    </div>
  );
}

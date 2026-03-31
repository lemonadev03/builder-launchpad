import { ImageResponse } from "next/og";
import { getJobById } from "@/lib/queries/job";
import { OgCard } from "@/lib/og/og-card";
import {
  OG_SIZE,
  OG_CONTENT_TYPE,
  OG_TEXT,
  OG_MUTED,
  OG_PRIMARY,
  loadFonts,
  resolveImageSrc,
  getInitials,
} from "@/lib/og/utils";

export const alt = "Builder Launchpad job listing";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

const typeLabel: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  freelance: "Freelance",
  internship: "Internship",
};

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const job = await getJobById(id);
  const fonts = await loadFonts();

  if (!job) {
    return new ImageResponse(
      (
        <OgCard>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, color: OG_MUTED, fontSize: 28 }}>
            Job not found
          </div>
        </OgCard>
      ),
      { ...size, fonts },
    );
  }

  const logoSrc = await resolveImageSrc(job.companyLogoUrl);
  const details = [
    job.employmentType ? typeLabel[job.employmentType] ?? job.employmentType : null,
    job.location,
    job.remote ? "Remote" : null,
  ].filter(Boolean).join("  ·  ");

  return new ImageResponse(
    (
      <OgCard>
        {/* Company row */}
        <div style={{ display: "flex", alignItems: "center" }}>
          {logoSrc ? (
            <img
              src={logoSrc}
              width={80}
              height={80}
              style={{ borderRadius: 16, objectFit: "cover", flexShrink: 0 }}
            />
          ) : (
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: 16,
                background: `linear-gradient(135deg, ${OG_PRIMARY}, #7b5cff)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 28,
                fontWeight: 700,
                color: OG_TEXT,
                flexShrink: 0,
              }}
            >
              {getInitials(job.companyName)}
            </div>
          )}
          <div style={{ display: "flex", fontSize: 28, color: OG_MUTED, marginLeft: 20 }}>
            {job.companyName}
          </div>
        </div>

        {/* Title + details */}
        <div style={{ display: "flex", flexDirection: "column", marginTop: 40, flex: 1 }}>
          <div style={{ display: "flex", fontSize: 60, fontWeight: 700, color: OG_TEXT, lineHeight: 1.15 }}>
            {job.title.length > 40 ? job.title.slice(0, 40) + "..." : job.title}
          </div>
          {details && (
            <div style={{ display: "flex", fontSize: 26, color: OG_MUTED, marginTop: 24 }}>
              {details}
            </div>
          )}
        </div>

        {/* Salary */}
        {job.salaryRange && (
          <div style={{ display: "flex", fontSize: 26, color: OG_TEXT, opacity: 0.85 }}>
            {job.salaryRange}
          </div>
        )}
      </OgCard>
    ),
    { ...size, fonts },
  );
}

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
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, color: OG_MUTED, fontSize: 24 }}>
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
        {/* Top: company */}
        <div style={{ display: "flex", alignItems: "center" }}>
          {logoSrc ? (
            <img
              src={logoSrc}
              width={48}
              height={48}
              style={{ borderRadius: 12, objectFit: "cover", flexShrink: 0 }}
            />
          ) : (
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: OG_PRIMARY,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                fontWeight: 700,
                color: OG_TEXT,
                flexShrink: 0,
              }}
            >
              {getInitials(job.companyName)}
            </div>
          )}
          <div style={{ display: "flex", fontSize: 22, color: OG_MUTED, marginLeft: 16 }}>
            {job.companyName}
          </div>
        </div>

        {/* Middle: title */}
        <div style={{ display: "flex", flexDirection: "column", marginTop: 32, flex: 1 }}>
          <div style={{ display: "flex", fontSize: 52, fontWeight: 700, color: OG_TEXT, lineHeight: 1.15 }}>
            {job.title.length > 50 ? job.title.slice(0, 50) + "..." : job.title}
          </div>
          {details && (
            <div style={{ display: "flex", fontSize: 22, color: OG_MUTED, marginTop: 20 }}>
              {details}
            </div>
          )}
        </div>

        {/* Bottom: salary */}
        {job.salaryRange && (
          <div style={{ display: "flex", fontSize: 22, color: OG_TEXT, opacity: 0.9 }}>
            {job.salaryRange}
          </div>
        )}
      </OgCard>
    ),
    { ...size, fonts },
  );
}

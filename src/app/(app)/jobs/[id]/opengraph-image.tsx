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

  return new ImageResponse(
    (
      <OgCard>
        {/* Company row */}
        <div style={{ display: "flex", alignItems: "center" }}>
          {logoSrc ? (
            <img
              src={logoSrc}
              width={52}
              height={52}
              style={{ borderRadius: 10, objectFit: "cover", marginRight: 16 }}
            />
          ) : (
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 10,
                background: OG_PRIMARY,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                fontWeight: 700,
                color: OG_TEXT,
                marginRight: 16,
              }}
            >
              {getInitials(job.companyName)}
            </div>
          )}
          <div style={{ fontSize: 24, color: OG_MUTED }}>
            {job.companyName}
          </div>
        </div>

        {/* Job title */}
        <div
          style={{
            fontSize: 48,
            fontWeight: 700,
            color: OG_TEXT,
            lineHeight: 1.15,
            marginTop: 28,
            display: "flex",
          }}
        >
          {job.title.length > 60 ? job.title.slice(0, 60) + "..." : job.title}
        </div>

        {/* Spacer */}
        <div style={{ display: "flex", flex: 1 }} />

        {/* Badges row */}
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap" }}>
          {job.employmentType && (
            <div
              style={{
                fontSize: 16,
                color: OG_TEXT,
                background: "rgba(255,255,255,0.08)",
                borderRadius: 8,
                padding: "8px 16px",
                marginRight: 12,
              }}
            >
              {typeLabel[job.employmentType] ?? job.employmentType}
            </div>
          )}
          {job.location && (
            <div style={{ fontSize: 18, color: OG_MUTED, marginRight: 12 }}>
              {job.location}
            </div>
          )}
          {job.remote && (
            <div
              style={{
                fontSize: 16,
                color: OG_TEXT,
                background: "rgba(255,255,255,0.08)",
                borderRadius: 8,
                padding: "8px 16px",
                marginRight: 12,
              }}
            >
              Remote
            </div>
          )}
          {job.salaryRange && (
            <div style={{ fontSize: 18, color: OG_MUTED }}>
              {job.salaryRange}
            </div>
          )}
        </div>
      </OgCard>
    ),
    { ...size, fonts },
  );
}

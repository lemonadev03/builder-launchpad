import { ImageResponse } from "next/og";
import { getPostBySlug } from "@/lib/queries/post";
import { OgCard } from "@/lib/og/og-card";
import {
  OG_SIZE,
  OG_CONTENT_TYPE,
  OG_TEXT,
  OG_MUTED,
  loadFonts,
  absoluteImageUrl,
  getInitials,
} from "@/lib/og/utils";

export const alt = "Builder Launchpad blog post";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string; postSlug: string }>;
}) {
  const { slug, postSlug } = await params;
  const p = await getPostBySlug(slug, postSlug);
  const fonts = await loadFonts();

  if (!p || p.status !== "published") {
    return new ImageResponse(
      (
        <OgCard>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, color: OG_MUTED, fontSize: 24 }}>
            Post not found
          </div>
        </OgCard>
      ),
      { ...size, fonts },
    );
  }

  const authorAvatar = absoluteImageUrl(p.authorAvatarUrl);
  const publishedDate = p.publishedAt
    ? p.publishedAt.toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : null;
  const tags = (p.tags as string[] | null)?.slice(0, 4) ?? [];

  return new ImageResponse(
    (
      <OgCard>
        {/* Title */}
        <div
          style={{
            fontSize: 48,
            fontWeight: 700,
            color: OG_TEXT,
            lineHeight: 1.15,
            display: "flex",
          }}
        >
          {p.title.length > 80 ? p.title.slice(0, 80) + "..." : p.title}
        </div>

        {/* Excerpt */}
        {p.excerpt && (
          <div
            style={{
              fontSize: 22,
              color: OG_MUTED,
              marginTop: 16,
              lineHeight: 1.4,
              display: "flex",
            }}
          >
            {p.excerpt.length > 140 ? p.excerpt.slice(0, 140) + "..." : p.excerpt}
          </div>
        )}

        {/* Spacer */}
        <div style={{ display: "flex", flex: 1 }} />

        {/* Tags */}
        {tags.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", marginBottom: 16 }}>
            {tags.map((t) => (
              <div
                key={t}
                style={{
                  fontSize: 15,
                  color: OG_TEXT,
                  background: "rgba(255,255,255,0.08)",
                  borderRadius: 8,
                  padding: "6px 14px",
                  marginRight: 8,
                }}
              >
                {t}
              </div>
            ))}
          </div>
        )}

        {/* Author row */}
        <div style={{ display: "flex", alignItems: "center" }}>
          {authorAvatar ? (
            <img
              src={authorAvatar}
              width={36}
              height={36}
              style={{ borderRadius: "50%", objectFit: "cover", marginRight: 12 }}
            />
          ) : (
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                fontWeight: 700,
                color: OG_TEXT,
                marginRight: 12,
              }}
            >
              {getInitials(p.authorDisplayName)}
            </div>
          )}
          <div style={{ fontSize: 18, color: OG_MUTED, display: "flex" }}>
            {p.authorDisplayName}
            <span style={{ margin: "0 10px", opacity: 0.5 }}>&middot;</span>
            {p.communityName}
            {publishedDate && (
              <>
                <span style={{ margin: "0 10px", opacity: 0.5 }}>&middot;</span>
                {publishedDate}
              </>
            )}
          </div>
        </div>
      </OgCard>
    ),
    { ...size, fonts },
  );
}

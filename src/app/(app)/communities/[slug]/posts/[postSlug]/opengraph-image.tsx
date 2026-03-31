import { ImageResponse } from "next/og";
import { getPostBySlug } from "@/lib/queries/post";
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

  const authorAvatar = await resolveImageSrc(p.authorAvatarUrl);
  const publishedDate = p.publishedAt
    ? p.publishedAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null;
  const tags = (p.tags as string[] | null)?.slice(0, 3) ?? [];
  const meta = [p.communityName, publishedDate].filter(Boolean).join("  ·  ");

  return new ImageResponse(
    (
      <OgCard>
        {/* Top: author row */}
        <div style={{ display: "flex", alignItems: "center" }}>
          {authorAvatar ? (
            <img
              src={authorAvatar}
              width={40}
              height={40}
              style={{ borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
            />
          ) : (
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                fontWeight: 700,
                color: OG_TEXT,
                flexShrink: 0,
              }}
            >
              {getInitials(p.authorDisplayName)}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", marginLeft: 14 }}>
            <div style={{ display: "flex", fontSize: 18, color: OG_TEXT }}>
              {p.authorDisplayName}
            </div>
            <div style={{ display: "flex", fontSize: 15, color: OG_MUTED }}>
              {meta}
            </div>
          </div>
        </div>

        {/* Middle: title + excerpt */}
        <div style={{ display: "flex", flexDirection: "column", marginTop: 32, flex: 1 }}>
          <div style={{ display: "flex", fontSize: 48, fontWeight: 700, color: OG_TEXT, lineHeight: 1.2 }}>
            {p.title.length > 70 ? p.title.slice(0, 70) + "..." : p.title}
          </div>
          {p.excerpt && (
            <div style={{ display: "flex", fontSize: 22, color: OG_MUTED, marginTop: 18, lineHeight: 1.4 }}>
              {p.excerpt.length > 120 ? p.excerpt.slice(0, 120) + "..." : p.excerpt}
            </div>
          )}
        </div>

        {/* Bottom: tags */}
        {tags.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap" }}>
            {tags.map((t) => (
              <div
                key={t}
                style={{
                  display: "flex",
                  fontSize: 15,
                  color: OG_PRIMARY,
                  background: "rgba(77,125,255,0.12)",
                  borderRadius: 20,
                  padding: "6px 16px",
                  marginRight: 8,
                }}
              >
                {t}
              </div>
            ))}
          </div>
        )}
      </OgCard>
    ),
    { ...size, fonts },
  );
}

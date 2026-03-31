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
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, color: OG_MUTED, fontSize: 28 }}>
            Post not found
          </div>
        </OgCard>
      ),
      { ...size, fonts },
    );
  }

  const authorAvatar = await resolveImageSrc(p.authorAvatarUrl);
  const firstName = p.authorDisplayName.split(/\s+/)[0];

  return new ImageResponse(
    (
      <OgCard>
        {/* Title — hero */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center" }}>
          <div style={{ display: "flex", fontSize: 56, fontWeight: 700, color: OG_TEXT, lineHeight: 1.2 }}>
            {p.title.length > 60 ? p.title.slice(0, 60) + "..." : p.title}
          </div>
        </div>

        {/* Author row */}
        <div style={{ display: "flex", alignItems: "center" }}>
          {authorAvatar ? (
            <img
              src={authorAvatar}
              width={56}
              height={56}
              style={{ borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
            />
          ) : (
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${OG_PRIMARY}, #7b5cff)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                fontWeight: 700,
                color: OG_TEXT,
                flexShrink: 0,
              }}
            >
              {getInitials(p.authorDisplayName)}
            </div>
          )}
          <div style={{ display: "flex", fontSize: 26, color: OG_MUTED, marginLeft: 18 }}>
            {firstName}
          </div>
          <div style={{ display: "flex", fontSize: 26, color: OG_MUTED, marginLeft: 8, opacity: 0.5 }}>
            from
          </div>
          <div style={{ display: "flex", fontSize: 26, color: OG_TEXT, marginLeft: 8, opacity: 0.85 }}>
            {p.communityName}
          </div>
        </div>
      </OgCard>
    ),
    { ...size, fonts },
  );
}

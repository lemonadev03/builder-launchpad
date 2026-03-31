import { ImageResponse } from "next/og";
import { getProfileByUsername } from "@/lib/queries/profile";
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

export const alt = "Builder Launchpad member profile";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const p = await getProfileByUsername(username);
  const fonts = await loadFonts();

  if (!p) {
    return new ImageResponse(
      (
        <OgCard>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, color: OG_MUTED, fontSize: 24 }}>
            Profile not found
          </div>
        </OgCard>
      ),
      { ...size, fonts },
    );
  }

  const avatarSrc = await resolveImageSrc(p.avatarUrl);
  const tags = p.tags.slice(0, 5);

  return new ImageResponse(
    (
      <OgCard>
        <div style={{ display: "flex", flex: 1 }}>
          {/* Avatar */}
          <div style={{ display: "flex", flexShrink: 0, marginRight: 36 }}>
            {avatarSrc ? (
              <img
                src={avatarSrc}
                width={120}
                height={120}
                style={{ borderRadius: "50%", objectFit: "cover" }}
              />
            ) : (
              <div
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: "50%",
                  background: OG_PRIMARY,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 44,
                  fontWeight: 700,
                  color: OG_TEXT,
                }}
              >
                {getInitials(p.displayName)}
              </div>
            )}
          </div>

          {/* Info */}
          <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center" }}>
            <div style={{ fontSize: 44, fontWeight: 700, color: OG_TEXT, lineHeight: 1.1 }}>
              {p.displayName}
            </div>
            <div style={{ fontSize: 22, color: OG_MUTED, marginTop: 6 }}>
              @{p.username}
            </div>
            {p.tagline && (
              <div style={{ fontSize: 22, color: OG_TEXT, marginTop: 16, lineHeight: 1.4, opacity: 0.85 }}>
                {p.tagline.length > 100 ? p.tagline.slice(0, 100) + "..." : p.tagline}
              </div>
            )}
            {p.location && (
              <div style={{ display: "flex", alignItems: "center", fontSize: 18, color: OG_MUTED, marginTop: 12 }}>
                {p.location}
              </div>
            )}
          </div>
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", marginTop: 20 }}>
            {tags.map((t) => (
              <div
                key={t.id}
                style={{
                  fontSize: 15,
                  color: OG_TEXT,
                  background: "rgba(255,255,255,0.08)",
                  borderRadius: 8,
                  padding: "6px 14px",
                  marginRight: 8,
                  marginBottom: 8,
                }}
              >
                {t.label}
              </div>
            ))}
          </div>
        )}
      </OgCard>
    ),
    { ...size, fonts },
  );
}

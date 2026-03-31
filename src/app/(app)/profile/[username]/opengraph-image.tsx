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
  const tags = p.tags.slice(0, 4);

  return new ImageResponse(
    (
      <OgCard>
        {/* Center content vertically */}
        <div style={{ display: "flex", flex: 1, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
            {/* Avatar */}
            {avatarSrc ? (
              <img
                src={avatarSrc}
                width={148}
                height={148}
                style={{ borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
              />
            ) : (
              <div
                style={{
                  width: 148,
                  height: 148,
                  borderRadius: "50%",
                  background: OG_PRIMARY,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 52,
                  fontWeight: 700,
                  color: OG_TEXT,
                  flexShrink: 0,
                }}
              >
                {getInitials(p.displayName)}
              </div>
            )}

            {/* Info */}
            <div style={{ display: "flex", flexDirection: "column", marginLeft: 40, flex: 1 }}>
              <div style={{ display: "flex", fontSize: 52, fontWeight: 700, color: OG_TEXT, lineHeight: 1.1 }}>
                {p.displayName}
              </div>
              <div style={{ display: "flex", fontSize: 24, color: OG_MUTED, marginTop: 8 }}>
                {`@${p.username}`}
              </div>
              {p.tagline && (
                <div style={{ display: "flex", fontSize: 24, color: OG_TEXT, marginTop: 20, lineHeight: 1.35, opacity: 0.8 }}>
                  {p.tagline.length > 80 ? p.tagline.slice(0, 80) + "..." : p.tagline}
                </div>
              )}
              {tags.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", marginTop: 20 }}>
                  {tags.map((t) => (
                    <div
                      key={t.id}
                      style={{
                        display: "flex",
                        fontSize: 16,
                        color: OG_PRIMARY,
                        background: "rgba(77,125,255,0.12)",
                        borderRadius: 20,
                        padding: "6px 16px",
                        marginRight: 8,
                      }}
                    >
                      {t.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </OgCard>
    ),
    { ...size, fonts },
  );
}

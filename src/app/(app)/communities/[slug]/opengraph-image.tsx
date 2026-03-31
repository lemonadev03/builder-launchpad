import { ImageResponse } from "next/og";
import { getCommunityBySlug } from "@/lib/queries/community";
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

export const alt = "Builder Launchpad community";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

const joinPolicyLabel: Record<string, string> = {
  open: "Open",
  request_to_join: "Request to Join",
  invite_only: "Invite Only",
};

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const c = await getCommunityBySlug(slug);
  const fonts = await loadFonts();

  if (!c) {
    return new ImageResponse(
      (
        <OgCard>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, color: OG_MUTED, fontSize: 28 }}>
            Community not found
          </div>
        </OgCard>
      ),
      { ...size, fonts },
    );
  }

  const logoSrc = await resolveImageSrc(c.logoUrl);

  return new ImageResponse(
    (
      <OgCard>
        <div style={{ display: "flex", flex: 1, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
            {/* Logo */}
            {logoSrc ? (
              <img
                src={logoSrc}
                width={180}
                height={180}
                style={{ borderRadius: 24, objectFit: "cover", flexShrink: 0 }}
              />
            ) : (
              <div
                style={{
                  width: 180,
                  height: 180,
                  borderRadius: 24,
                  background: `linear-gradient(135deg, ${OG_PRIMARY}, #7b5cff)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 64,
                  fontWeight: 700,
                  color: OG_TEXT,
                  flexShrink: 0,
                }}
              >
                {getInitials(c.name)}
              </div>
            )}

            {/* Info */}
            <div style={{ display: "flex", flexDirection: "column", marginLeft: 48, flex: 1 }}>
              <div style={{ display: "flex", fontSize: 60, fontWeight: 700, color: OG_TEXT, lineHeight: 1.1 }}>
                {c.name.length > 24 ? c.name.slice(0, 24) + "..." : c.name}
              </div>
              {c.tagline && (
                <div style={{ display: "flex", fontSize: 26, color: OG_TEXT, marginTop: 16, lineHeight: 1.35, opacity: 0.75 }}>
                  {c.tagline.length > 70 ? c.tagline.slice(0, 70) + "..." : c.tagline}
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", marginTop: 24 }}>
                <div style={{ display: "flex", fontSize: 22, color: OG_MUTED }}>
                  {`${c.memberCount} ${c.memberCount === 1 ? "member" : "members"}`}
                </div>
                {c.joinPolicy && (
                  <div
                    style={{
                      display: "flex",
                      fontSize: 18,
                      color: OG_PRIMARY,
                      background: "rgba(77,125,255,0.12)",
                      borderRadius: 20,
                      padding: "6px 16px",
                      marginLeft: 16,
                    }}
                  >
                    {joinPolicyLabel[c.joinPolicy] ?? c.joinPolicy}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </OgCard>
    ),
    { ...size, fonts },
  );
}

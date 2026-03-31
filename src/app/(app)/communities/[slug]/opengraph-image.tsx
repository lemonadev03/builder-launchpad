import { ImageResponse } from "next/og";
import { getCommunityBySlug } from "@/lib/queries/community";
import { getAncestorChain } from "@/lib/queries/community-tree";
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
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, color: OG_MUTED, fontSize: 24 }}>
            Community not found
          </div>
        </OgCard>
      ),
      { ...size, fonts },
    );
  }

  const ancestors = c.parentId ? await getAncestorChain(c.id) : [];
  const breadcrumb =
    ancestors.length > 1
      ? ancestors.map((a) => a.name).join("  >  ")
      : null;

  const logoSrc = await resolveImageSrc(c.logoUrl);

  return new ImageResponse(
    (
      <OgCard>
        {/* Center content vertically */}
        <div style={{ display: "flex", flex: 1, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
            {/* Logo */}
            {logoSrc ? (
              <img
                src={logoSrc}
                width={130}
                height={130}
                style={{ borderRadius: 20, objectFit: "cover", flexShrink: 0 }}
              />
            ) : (
              <div
                style={{
                  width: 130,
                  height: 130,
                  borderRadius: 20,
                  background: OG_PRIMARY,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 48,
                  fontWeight: 700,
                  color: OG_TEXT,
                  flexShrink: 0,
                }}
              >
                {getInitials(c.name)}
              </div>
            )}

            {/* Info */}
            <div style={{ display: "flex", flexDirection: "column", marginLeft: 40, flex: 1 }}>
              {breadcrumb && (
                <div style={{ display: "flex", fontSize: 16, color: OG_MUTED, marginBottom: 8 }}>
                  {breadcrumb}
                </div>
              )}
              <div style={{ display: "flex", fontSize: 48, fontWeight: 700, color: OG_TEXT, lineHeight: 1.1 }}>
                {c.name.length > 30 ? c.name.slice(0, 30) + "..." : c.name}
              </div>
              {c.tagline && (
                <div style={{ display: "flex", fontSize: 22, color: OG_TEXT, marginTop: 14, lineHeight: 1.35, opacity: 0.8 }}>
                  {c.tagline.length > 90 ? c.tagline.slice(0, 90) + "..." : c.tagline}
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", marginTop: 20 }}>
                <div style={{ display: "flex", fontSize: 18, color: OG_MUTED }}>
                  {`${c.memberCount} ${c.memberCount === 1 ? "member" : "members"}`}
                </div>
                {c.joinPolicy && (
                  <div
                    style={{
                      display: "flex",
                      fontSize: 15,
                      color: OG_PRIMARY,
                      background: "rgba(77,125,255,0.12)",
                      borderRadius: 20,
                      padding: "5px 14px",
                      marginLeft: 14,
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

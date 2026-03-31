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
  absoluteImageUrl,
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

  const logoSrc = absoluteImageUrl(c.logoUrl);

  return new ImageResponse(
    (
      <OgCard accentColor={OG_PRIMARY}>
        <div style={{ display: "flex", flex: 1 }}>
          {/* Logo */}
          <div style={{ display: "flex", flexShrink: 0, marginRight: 36 }}>
            {logoSrc ? (
              <img
                src={logoSrc}
                width={110}
                height={110}
                style={{ borderRadius: 16, objectFit: "cover" }}
              />
            ) : (
              <div
                style={{
                  width: 110,
                  height: 110,
                  borderRadius: 16,
                  background: OG_PRIMARY,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 40,
                  fontWeight: 700,
                  color: OG_TEXT,
                }}
              >
                {getInitials(c.name)}
              </div>
            )}
          </div>

          {/* Info */}
          <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center" }}>
            <div style={{ fontSize: 44, fontWeight: 700, color: OG_TEXT, lineHeight: 1.1 }}>
              {c.name.length > 40 ? c.name.slice(0, 40) + "..." : c.name}
            </div>
            {c.tagline && (
              <div style={{ fontSize: 22, color: OG_TEXT, marginTop: 12, lineHeight: 1.4, opacity: 0.85 }}>
                {c.tagline.length > 100 ? c.tagline.slice(0, 100) + "..." : c.tagline}
              </div>
            )}
            {breadcrumb && (
              <div style={{ fontSize: 16, color: OG_MUTED, marginTop: 12 }}>
                {breadcrumb}
              </div>
            )}
          </div>
        </div>

        {/* Bottom stats */}
        <div style={{ display: "flex", alignItems: "center", marginTop: 20 }}>
          <div style={{ fontSize: 18, color: OG_MUTED }}>
            {c.memberCount} {c.memberCount === 1 ? "member" : "members"}
          </div>
          {c.joinPolicy && (
            <div
              style={{
                fontSize: 15,
                color: OG_TEXT,
                background: "rgba(255,255,255,0.08)",
                borderRadius: 8,
                padding: "6px 14px",
                marginLeft: 16,
              }}
            >
              {joinPolicyLabel[c.joinPolicy] ?? c.joinPolicy}
            </div>
          )}
          {c.location && (
            <div style={{ fontSize: 18, color: OG_MUTED, marginLeft: 16 }}>
              {c.location}
            </div>
          )}
        </div>
      </OgCard>
    ),
    { ...size, fonts },
  );
}

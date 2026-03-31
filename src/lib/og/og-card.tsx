import type { ReactNode } from "react";
import { OG_BG, OG_CARD_BG, OG_BORDER, OG_PRIMARY, OG_MUTED } from "./utils";

export function OgCard({
  children,
  accentColor,
}: {
  children: ReactNode;
  accentColor?: string;
}) {
  const accent = accentColor ?? OG_PRIMARY;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: OG_BG,
        fontFamily: '"Instrument Sans", "Geist", sans-serif',
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: 1120,
          height: 550,
          background: OG_CARD_BG,
          borderRadius: 20,
          border: `1px solid ${OG_BORDER}`,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Accent bar */}
        <div
          style={{
            width: "100%",
            height: 4,
            background: `linear-gradient(90deg, ${accent}, ${accent}88)`,
            flexShrink: 0,
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            padding: "40px 48px 36px",
          }}
        >
          {children}
        </div>

        {/* Branding watermark */}
        <div
          style={{
            position: "absolute",
            bottom: 24,
            right: 40,
            display: "flex",
            alignItems: "center",
            fontSize: 14,
            color: OG_MUTED,
            letterSpacing: "0.02em",
          }}
        >
          Builder Launchpad
        </div>
      </div>
    </div>
  );
}

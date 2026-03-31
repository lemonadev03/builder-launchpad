import type { ReactNode } from "react";
import {
  OG_BG,
  OG_CARD_BG,
  OG_CARD_BG_END,
  OG_BORDER,
  OG_PRIMARY,
  OG_ACCENT_END,
  OG_MUTED,
} from "./utils";

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
          background: `linear-gradient(145deg, ${OG_CARD_BG} 0%, ${OG_CARD_BG_END} 100%)`,
          borderRadius: 24,
          border: `1px solid ${OG_BORDER}`,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Accent bar */}
        <div
          style={{
            width: "100%",
            height: 5,
            background: `linear-gradient(90deg, ${accent}, ${OG_ACCENT_END})`,
            flexShrink: 0,
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            padding: "48px 56px 44px",
          }}
        >
          {children}
        </div>

        {/* Branding watermark */}
        <div
          style={{
            position: "absolute",
            bottom: 24,
            right: 44,
            display: "flex",
            alignItems: "center",
            fontSize: 14,
            color: OG_MUTED,
            letterSpacing: "0.04em",
            opacity: 0.7,
          }}
        >
          Builder Launchpad
        </div>
      </div>
    </div>
  );
}

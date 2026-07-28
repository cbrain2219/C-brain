import type { CSSProperties } from "react";

type GradientBorderButtonTone = "brand" | "contactKakao" | "kakao";

type GradientBorderButtonOptions = {
  height?: number;
  includeBorder?: boolean;
  padding?: CSSProperties["padding"];
  tone?: GradientBorderButtonTone;
  width?: number;
};

const fillByTone = {
  brand: ["var(--landing-button-brand-fill)"],
  contactKakao: [
    "var(--landing-button-contact-kakao-fill)",
    "var(--landing-button-contact-kakao-underlay)",
  ],
  kakao: ["var(--landing-button-kakao-fill)"],
} satisfies Record<GradientBorderButtonTone, string[]>;

const colorByTone = {
  brand: "#fefefe",
  contactKakao: "#3b1d1d",
  kakao: "#3b1d1d",
} satisfies Record<GradientBorderButtonTone, string>;

export function createGradientBorderButtonStyle({
  height = 52,
  includeBorder = true,
  padding = "8px 24px",
  tone = "brand",
  width = 164,
}: GradientBorderButtonOptions = {}): CSSProperties {
  const fillLayers = fillByTone[tone];
  const borderLayers = includeBorder
    ? ["var(--landing-button-border-end)", "var(--landing-button-border-start)"]
    : [];
  const backgroundLayers = [...fillLayers, ...borderLayers];
  const backgroundClips = [
    ...fillLayers.map(() => "padding-box"),
    ...borderLayers.map(() => "border-box"),
  ];

  return {
    height,
    width,
    borderRadius: 32,
    border: includeBorder ? "1px solid transparent" : 0,
    backgroundClip: backgroundClips.join(", "),
    backgroundColor: "transparent",
    backgroundImage: backgroundLayers.join(", "),
    backgroundOrigin: backgroundClips.join(", "),
    color: colorByTone[tone],
    padding,
  };
}

export const fontPair = {
  display: "Fraunces",
  body: "Inter"
} as const;

export const statusBannerTones = ["neutral", "active", "waiting", "warning", "failure"] as const;
export type StatusBannerTone = (typeof statusBannerTones)[number];

export const panelVariants = ["neutral", "status", "private-info", "alert"] as const;
export type PanelVariant = (typeof panelVariants)[number];

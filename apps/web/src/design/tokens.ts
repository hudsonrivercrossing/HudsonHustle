export const fontPair = {
  display: "Fraunces",
  body: "IBM Plex Sans",
  setup: "IBM Plex Sans"
} as const;

export const colorSystem = {
  canvas: {
    base: "#e4d7bf",
    deep: "#c5b18f",
    warmGlow: "rgba(255, 244, 216, 0.88)",
    coolGlow: "rgba(123, 166, 189, 0.18)"
  },
  ink: {
    strong: "#2e2317",
    muted: "#5d4d3e"
  },
  border: {
    subtle: "rgba(68, 51, 34, 0.18)"
  },
  accent: {
    base: "#2a6fb6",
    strong: "#1f5285",
    soft: "#7ea7cf"
  },
  status: {
    danger: "#a13d2f",
    warning: "#976125"
  },
  surfaces: {
    panel: "rgba(250, 244, 233, 0.9)",
    panelStrong: "#fff8eb",
    paper: "rgba(255, 250, 242, 0.9)",
    paperStrong: "rgba(255, 248, 235, 0.98)",
    private: "rgba(250, 246, 238, 0.96)",
    alert: "rgba(255, 241, 236, 0.96)"
  }
} as const;

export const layoutRhythm = {
  contentMaxWidth: 1360,
  setupMaxWidth: 880,
  pageGutter: {
    mobile: 16,
    desktop: 24
  },
  stack: {
    xs: 6,
    sm: 12,
    md: 18,
    lg: 24,
    xl: 32
  },
  panelPadding: {
    compact: 18,
    spacious: 40
  }
} as const;

export const statusBannerTones = ["neutral", "active", "waiting", "warning", "failure"] as const;
export type StatusBannerTone = (typeof statusBannerTones)[number];

export const panelVariants = ["neutral", "status", "private-info", "alert"] as const;
export type PanelVariant = (typeof panelVariants)[number];

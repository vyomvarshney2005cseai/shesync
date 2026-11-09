/**
 * SheSync "Soft Bloom" palette — calm blush, dusty rose, lavender and sage.
 * Saturation is kept low so screens feel soothing, while buttons and text
 * keep readable contrast (white on `primary` ≈ 4:1, body text ≈ 12:1).
 */
export const Theme = {
  colors: {
    // Blush backgrounds
    background: "#FFF7F9",
    backgroundAlt: "#FDF1F5",
    backgroundMuted: "#FAE8EF",

    // Card & Surface
    card: "rgba(255, 255, 255, 0.9)",
    cardGlass: "rgba(255, 255, 255, 0.8)",
    cardBorder: "#F5DCE6",
    cardBorderLight: "rgba(240, 200, 218, 0.5)",

    // Primary — dusty rose
    primary: "#C9578C",
    primaryDark: "#A8436F",
    primaryLight: "#FBE7F0",
    primaryGlow: "rgba(201, 87, 140, 0.22)",

    // Secondary — lavender
    secondary: "#8E74CF",
    secondaryDark: "#6E55B5",
    secondaryLight: "#F2EDFB",
    secondaryBorder: "#DFD5F5",

    // Text — soft plum ink instead of pure black
    textPrimary: "#3A2E48",
    textSecondary: "#6E6478",
    textTertiary: "#A39AAE",
    textRose: "#A8436F",
    textLilac: "#6E55B5",

    // Status colours (softened)
    strainHigh: "#E07088",
    strainAmber: "#E3A048",
    strainOptimal: "#3E9E86",
    strainTeal: "#4FA9BD",

    // Brand
    welcomePink: "#FFEEF4",
    welcomePinkDark: "#F9E1EA",
    feminismAccent: "#D9638F",
    sageTeal: "#6FB4A5",
    sageLight: "#E8F5F1",
    roseGold: "#C68B7E",
    roseGoldLight: "#F8ECE9",
    peach: "#FDEBDD",
    peachDark: "#C77B4A",

    // Deep accents (dark pills & CTAs) — plum rather than black
    obsidian: "#46375A",
    black: "#2B2236",
    white: "#FFFFFF",
  },

  shadows: {
    soft: {
      shadowColor: "#C9578C",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.07,
      shadowRadius: 14,
      elevation: 2,
    },
    glowing: {
      shadowColor: "#C9578C",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.16,
      shadowRadius: 18,
      elevation: 5,
    },
    card: {
      shadowColor: "#3A2E48",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 10,
      elevation: 2,
    },
  },

  radius: {
    sm: 10,
    md: 16,
    lg: 22,
    xl: 28,
    full: 9999,
  },
};

export const Theme = {
  colors: {
    // Primary blush background family (from reference images)
    background: "#FFF4F7",
    backgroundAlt: "#FFF0F5",
    backgroundMuted: "#FFE9EE",
    
    // Card & Surface
    card: "rgba(255, 255, 255, 0.88)",
    cardGlass: "rgba(255, 255, 255, 0.78)",
    cardBorder: "#FFE2EB",
    cardBorderLight: "rgba(255, 214, 228, 0.5)",
    
    // Primary Brand Accents
    primary: "#FF4D8D",        // Vibrant Rose
    primaryDark: "#E11D48",    // Deep Rose
    primaryLight: "#FFE4E8",   // Soft Rose Pill
    primaryGlow: "rgba(255, 77, 141, 0.25)",

    // Secondary / Somatic Lavender Accents
    secondary: "#8B5CF6",      // Soft Lilac / Purple
    secondaryDark: "#6D28D9",
    secondaryLight: "#F3E8FF",
    secondaryBorder: "#DDD6FE",
    
    // Text Hierarchy
    textPrimary: "#1E1B2E",    // Deep rich charcoal ink
    textSecondary: "#6B7280",  // Muted gray
    textTertiary: "#9CA3AF",   // Subtle light gray
    textRose: "#BE123C",       // Rose caption
    textLilac: "#7C3AED",      // Lilac caption
    
    // Clinical States & Bio-Adaptive Statuses
    strainHigh: "#F43F5E",     // 82% High Strain
    strainAmber: "#F59E0B",    // Cortisol Warning
    strainOptimal: "#10B981",  // Optimal / Low strain
    strainTeal: "#06B6D4",
    
    // Brand Identity & Welcome Colors
    welcomePink: "#FFEBF2",
    welcomePinkDark: "#FCE0EA",
    feminismAccent: "#FF3B6B",
    sageTeal: "#6FB4A5",
    sageLight: "#E8F5F1",
    roseGold: "#C68B7E",
    roseGoldLight: "#F8ECE9",

    // High-Contrast Elements (Dark pills & CTA from Reference 1 & 2)
    obsidian: "#111827",
    black: "#000000",
    white: "#FFFFFF",
  },
  
  shadows: {
    soft: {
      shadowColor: "#FF4D8D",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 2,
    },
    glowing: {
      shadowColor: "#FF4D8D",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 6,
    },
    card: {
      shadowColor: "#1E1B2E",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
      elevation: 2,
    },
  },

  radius: {
    sm: 8,
    md: 14,
    lg: 20,
    xl: 28,
    full: 9999,
  },
};

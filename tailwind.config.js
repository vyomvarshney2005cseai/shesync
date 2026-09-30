/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        blush: {
          50: "#FFF5F7",
          100: "#FFE8EE",
          200: "#FFD1DD",
          300: "#FFADC2",
          400: "#FF759E",
          500: "#FF4D8D",
          600: "#F43F5E",
          700: "#E11D48",
          800: "#BE123C",
          900: "#881337",
        },
        lilac: {
          50: "#FAF5FF",
          100: "#F3E8FF",
          200: "#E9D5FF",
          300: "#D8B4FE",
          400: "#C084FC",
          500: "#8B5CF6",
          600: "#7C3AED",
          700: "#6D28D9",
        },
        ink: {
          900: "#111827",
          800: "#1E1B2E",
          700: "#374151",
          500: "#6B7280",
          400: "#9CA3AF",
        },
        strain: {
          high: "#F43F5E",
          amber: "#F59E0B",
          optimal: "#10B981",
          calm: "#06B6D4",
        },
      },
    },
  },
  plugins: [],
};

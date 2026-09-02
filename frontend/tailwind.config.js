/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: { 50: "#1a1a2e", 100: "#232342", 500: "#7c5cff", 600: "#6d4dff", 700: "#5c3dff" },
        success: { light: "#0d2818", DEFAULT: "#22c55e", dark: "#0a1f12" },
        warning: { light: "#2a2410", DEFAULT: "#eab308", dark: "#1f1a0a" },
        danger:  { light: "#2a1015", DEFAULT: "#f43f5e", dark: "#1f0a0d" },
        ink: { 900: "#f8fafc", 700: "#cbd5e1", 400: "#64748b" },
        surface: "#0d0d14",
        "surface-alt": "#141422",
        "surface-border": "#222236",
        glow: { cyan: "#22d3ee", violet: "#7c5cff", rose: "#f43f5e" },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
        mono: ["JetBrains Mono", "ui-monospace"],
      },
      boxShadow: {
        card: "0 4px 20px rgba(0, 0, 0, 0.6), 0 0 0 1px #222236",
        cardHover: "0 8px 30px rgba(124, 92, 255, 0.25), 0 0 0 1px #7c5cff80",
        glow: "0 0 24px rgba(124, 92, 255, 0.25)",
      },
      borderRadius: { xl: "0.875rem", "2xl": "1.25rem" },
      keyframes: {
        pulseDot: { "0%,100%": { opacity: "1" }, "50%": { opacity: "0.4" } },
      },
      animation: {
        pulseDot: "pulseDot 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
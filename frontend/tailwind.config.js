/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          500: "#3b5ee8",
          600: "#2f4fd1",
          700: "#2540ab",
        },
        success: { light: "#dcfce7", DEFAULT: "#16a34a", dark: "#14532d" },
        warning: { light: "#fef9c3", DEFAULT: "#ca8a04", dark: "#713f12" },
        danger:  { light: "#fee2e2", DEFAULT: "#dc2626", dark: "#7f1d1d" },
        ink: {
          900: "#0f1729",
          700: "#334155",
          400: "#94a3b8",
        },
        surface: {
          DEFAULT: "#ffffff",
          alt: "#f8fafc",
          border: "#e2e8f0",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
        mono: ["JetBrains Mono", "ui-monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(15, 23, 41, 0.04), 0 4px 12px rgba(15, 23, 41, 0.04)",
        cardHover: "0 8px 24px rgba(15, 23, 41, 0.08)",
      },
      borderRadius: { xl: "0.875rem", "2xl": "1.25rem" },
      keyframes: {
        pulseDot: { "0%,100%": { opacity: "1" }, "50%": { opacity: "0.4" } },
        slideIn: { from: { opacity: "0", transform: "translateY(4px)" }, to: { opacity: "1", transform: "translateY(0)" } },
      },
      animation: {
        pulseDot: "pulseDot 1.4s ease-in-out infinite",
        slideIn: "slideIn 0.2s ease-out",
      },
    },
  },
  plugins: [],
};
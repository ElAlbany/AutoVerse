/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  mode: "jit",
  theme: {
    extend: {
      fontFamily: {
        inter: ["Inter", "sans-serif"],
        manrope: ["Manrope", "sans-serif"],
      },
      colors: {
        "black-100": "#2B2C35",
        "primary-blue": {
          DEFAULT: "#2B59FF",
          100: "#F5F8FF",
          200: "#1E3FE0",
          300: "#4D7CFF",
        },
        "secondary-orange": "#f79761",
        "light-white": {
          DEFAULT: "rgba(59,60,152,0.03)",
          100: "rgba(59,60,152,0.02)",
        },
        grey: "#747A88",
        // Dark theme colors
        dark: {
          bg: "#0a0f1e",
          surface: "#111827",
          card: "#1a2236",
          border: "#1f2937",
          text: "#f1f5f9",
          muted: "#94a3b8",
        },
        accent: {
          cyan: "#06b6d4",
          purple: "#8b5cf6",
          pink: "#ec4899",
        },
      },
      backgroundImage: {
        pattern: "url('/pattern.png')",
        "hero-bg": "url('/hero-bg.png')",
        "aurora-dark":
          "linear-gradient(135deg, #0a0f1e 0%, #111827 25%, #1a1b4b 50%, #111827 75%, #0a0f1e 100%)",
        "aurora-light":
          "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 25%, #dbeafe 50%, #e2e8f0 75%, #f8fafc 100%)",
      },
      keyframes: {
        aurora: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        float: {
          "0%, 100%": {
            transform: "translateY(0) translateX(0)",
            opacity: "0",
          },
          "10%": { opacity: "1" },
          "90%": { opacity: "1" },
          "100%": {
            transform: "translateY(-100vh) translateX(20px)",
            opacity: "0",
          },
        },
        "float-slow": {
          "0%, 100%": {
            transform: "translateY(0) translateX(0)",
            opacity: "0",
          },
          "10%": { opacity: "0.8" },
          "90%": { opacity: "0.8" },
          "100%": {
            transform: "translateY(-100vh) translateX(-30px)",
            opacity: "0",
          },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.4", transform: "scale(1)" },
          "50%": { opacity: "0.8", transform: "scale(1.1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "slide-up": {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "gradient-x": {
          "0%, 100%": {
            "background-size": "200% 200%",
            "background-position": "left center",
          },
          "50%": {
            "background-size": "200% 200%",
            "background-position": "right center",
          },
        },
      },
      animation: {
        aurora: "aurora 15s ease infinite",
        float: "float 8s linear infinite",
        "float-slow": "float-slow 12s linear infinite",
        "pulse-glow": "pulse-glow 4s ease-in-out infinite",
        shimmer: "shimmer 3s linear infinite",
        "slide-up": "slide-up 0.6s ease-out forwards",
        "gradient-x": "gradient-x 8s ease infinite",
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        ".text-gradient": {
          background:
            "linear-gradient(135deg, #2B59FF 0%, #06b6d4 50%, #8b5cf6 100%)",
          "-webkit-background-clip": "text",
          "-webkit-text-fill-color": "transparent",
          "background-clip": "text",
        },
        ".bg-gradient-aurora": {
          background:
            "linear-gradient(-45deg, #0a0f1e, #1a1b4b, #111827, #0f172a, #1e1b4b)",
          "background-size": "400% 400%",
        },
        ".bg-gradient-aurora-light": {
          background:
            "linear-gradient(-45deg, #f8fafc, #e0e7ff, #dbeafe, #f0f9ff, #fdf4ff)",
          "background-size": "400% 400%",
        },
      });
    },
  ],
};

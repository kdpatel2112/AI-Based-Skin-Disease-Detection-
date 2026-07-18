/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Warm skin-health palette
        skin: {
          50:  "#FFF8F4",   // lightest cream
          100: "#FAF0E8",   // warm ivory background
          200: "#F5E0CD",   // soft peach
          300: "#EAC4A8",   // peach blush
          400: "#D9A27E",   // warm tan
          500: "#C27A54",   // terracotta / brand
          600: "#A85C36",   // deep terracotta
          700: "#7A3A20",   // warm brown
          800: "#4E2210",   // dark mocha
          900: "#2E110A",   // richest ink
        },
        rose: {
          50:  "#FFF0F0",
          100: "#FFD9D5",
          200: "#F4A99A",
          300: "#E87B6A",
          400: "#D95042",
          500: "#BE3529",   // alert / severe
        },
        blush: "#F2C4B2",   // decorative soft rose
        cream: "#FAF6F2",   // page background
        mocha: "#2E1A0E",   // primary text
        sand: "#E8D5BF",    // secondary panel surface
        sage: "#A8C4B0",    // subtle green accent
        gold: "#D4922A",    // amber / confidence
      },
      fontFamily: {
        display: ["Playfair Display", "Georgia", "serif"],
        body: ["Inter", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
      borderRadius: {
        skin: "1.5rem",
        blob: "60% 40% 50% 60% / 50% 60% 40% 50%",
      },
      boxShadow: {
        skin: "0 4px 32px -4px rgba(194,122,84,0.18), 0 1px 4px rgba(194,122,84,0.08)",
        "skin-lg": "0 12px 60px -8px rgba(194,122,84,0.22)",
        warm: "0 4px 24px -4px rgba(214,160,120,0.25)",
      },
      backgroundImage: {
        "skin-gradient": "linear-gradient(135deg, #FAF6F2 0%, #F5E6D3 40%, #EAC4A8 100%)",
        "skin-hero": "radial-gradient(ellipse at 30% 20%, #F5E0CD 0%, #FAF6F2 55%, #EAD8C8 100%)",
        "warm-gradient": "linear-gradient(120deg, #F5E0CD, #FAF0E8 50%, #E8D5BF)",
      },
    },
  },
  plugins: [],
};

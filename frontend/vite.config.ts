import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "masked-icon.svg"],
      manifest: {
        name: "AI Skin Disease Detection and Recommendation System",
        short_name: "AISkinCare",
        description: "AI-powered healthcare screening for skin diseases, Grad-CAM overlays, and Indian doctor recommendations.",
        theme_color: "#0B6E64",
        background_color: "#F5F7F6",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "logo-192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "logo-512.png",
            sizes: "512x512",
            type: "image/png"
          }
        ]
      }
    })
  ],
  server: {
    port: 5173,
    host: true,
  },
});

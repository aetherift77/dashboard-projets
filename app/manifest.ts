import type { MetadataRoute } from "next";

// Génère /manifest.webmanifest (PWA installable).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Aether Dashboard",
    short_name: "Aether",
    description: "Gestion de projets et inventaire",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#4f46e5",
    lang: "fr",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

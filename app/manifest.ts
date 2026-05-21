import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SICUAN - Sistem Informasi Cerdas Ubah Anorganik",
    short_name: "SICUAN",
    description: "Sistem Informasi Cerdas Ubah Anorganik Jadi Nilai",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#f97316",
    icons: [
      {
        src: "/logo.png",
        sizes: "192x192 512x512",
        type: "image/png",
      },
    ],
  };
}

import type { MetadataRoute } from "next";
import { SITE_NAME, SITE_DESCRIPTION } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: "Wallet Hacked?",
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#f3efe5",
    theme_color: "#1f6a57",
    icons: [
      {
        src: "/icon.svg",
        type: "image/svg+xml",
        sizes: "any",
        purpose: "any",
      },
      {
        src: "/apple-icon.png",
        type: "image/png",
        sizes: "180x180",
      },
    ],
  };
}

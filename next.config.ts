import type { NextConfig } from "next";
import { fileURLToPath } from "url";
import { dirname } from "path";

const projectRoot = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Pin the workspace root so Next doesn't infer it from a stray parent
  // lockfile (avoids the "inferred your workspace root" build warning).
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;

// Enable getCloudflareContext() (and local D1 bindings) during `next dev`.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();

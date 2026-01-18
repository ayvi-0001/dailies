import type { NextConfig } from "next";

import { dependencies } from "./package.json";

const nextConfig: NextConfig = {
  // Ensure Next.js uses SSG instead of SSR
  // https://nextjs.org/docs/pages/building-your-application/deploying/static-exports
  output: "export",
  // Note: This feature is required to use the Next.js Image component in SSG mode.
  // See https://nextjs.org/docs/messages/export-image-api for different workarounds.
  images: {
    unoptimized: true,
    qualities: [100],
  },
  crossOrigin: "anonymous",
  env: {
    NEXT_VERSION: dependencies.next,
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // First-party analytics tracker (public/t.js): cacheable for an hour at the edge and
        // in the browser, revalidated in the background so a new build reaches visitors fast.
        source: "/t.js",
        headers: [
          { key: "Cache-Control", value: "public, max-age=3600, stale-while-revalidate=86400" },
        ],
      },
    ];
  },
};

export default nextConfig;

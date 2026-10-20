import type { NextConfig } from "next";

const apiOrigin = (
  process.env.API_UPSTREAM_ORIGIN ??
  (process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "https://runmodel.onrender.com")
).replace(/\/$/, "");

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${apiOrigin}/:path*` }];
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "private, no-store" },
          { key: "CDN-Cache-Control", value: "no-store" },
          { key: "Vercel-CDN-Cache-Control", value: "no-store" },
        ],
      },
    ];
  },
};

export default nextConfig;

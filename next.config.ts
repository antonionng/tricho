import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/join", destination: "/pricing", permanent: true },
      { source: "/gazette", destination: "/trichozette", permanent: true },
      { source: "/gazette/:slug", destination: "/trichozette/:slug", permanent: true },
      { source: "/members/gazette/:path*", destination: "/members/trichozette/:path*", permanent: true },
      { source: "/admin/:path*", destination: "/studio/:path*", permanent: false },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;

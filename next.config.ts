import path from "path";
import type { NextConfig } from "next";

const wordpressMediaHostname = process.env.WORDPRESS_MEDIA_HOSTNAME;

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  images: {
    remotePatterns: [
      ...(wordpressMediaHostname
        ? [{ protocol: "https" as const, hostname: wordpressMediaHostname }]
        : []),
      // Mock media host used by src/lib/mock while WORDPRESS_USE_MOCK_DATA=true.
      { protocol: "https" as const, hostname: "placehold.co" },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['imagedelivery.net','lh3.googleusercontent.com','i.seadn.io'],
  },
};

export default nextConfig;

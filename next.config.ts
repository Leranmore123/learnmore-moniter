import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  allowedDevOrigins: [
    'localhost:3000',
    'localhost:3001',
    '127.0.0.1:3000',
    '127.0.0.1:3001',
    '192.168.1.2:3000',
    '192.168.1.2:3001',
    '192.168.1.2',
    'app.skyranksolution.com',
  ],
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["razorpay"],
  allowedDevOrigins: ["192.168.0.2"],
  //allowedDevOrigins: ["*"],
};

export default nextConfig;

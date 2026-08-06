import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@cj/ui", "@cj/types", "@cj/utils"],
};

export default nextConfig;

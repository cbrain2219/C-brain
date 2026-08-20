/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    deviceSizes: [
      640,
      720,
      750,
      828,
      900,
      1080,
      1200,
      1440,
      1920,
      2048,
      3840,
    ],
    qualities: [75, 90],
    remotePatterns: [
      {
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
        protocol: "https",
      },
      {
        hostname: "i.ytimg.com",
        pathname: "/vi/**",
        protocol: "https",
      },
    ],
  },
  serverExternalPackages: ["popbill"],
  transpilePackages: ["@repo/content", "@repo/supabase"],
};

export default nextConfig;

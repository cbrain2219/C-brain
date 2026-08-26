/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    deviceSizes: [640, 750, 828, 1080, 1440, 1920],
    minimumCacheTTL: 2678400,
    qualities: [75, 90],
    remotePatterns: [
      {
        hostname: "rtbbtyfjtjeihgovhdvz.supabase.co",
        pathname: "/storage/v1/object/public/public-assets/**",
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

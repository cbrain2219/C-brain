/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
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
  transpilePackages: ["@repo/supabase"],
};

export default nextConfig;

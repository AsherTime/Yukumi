import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false, // 🚀 Disables Strict Mode to speed up development
  webpack: (config) => {
    config.resolve.symlinks = false; // ✅ Prevents duplicate module resolution issues
    return config;
  },
  images: {
    loader: "default",
    domains: ["x8ki-letl-twmt.n7.xano.io", "hebbkx1anhila5yf.public.blob.vercel-storage.com", "cdn.myanimelist.net", "res.cloudinary.com"], // 🔹 Add your API domain here
  },
};

export default nextConfig;

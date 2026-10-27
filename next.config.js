/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // pdf-lib and stripe run on the server only
    serverComponentsExternalPackages: ["pdf-lib"],
  },
};
module.exports = nextConfig;

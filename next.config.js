/** @type {import('next').NextConfig} */
const nextConfig = {
  // lint runs separately (npm run lint); skipping it here shortens deploy builds
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    // pdf-lib and stripe run on the server only
    serverComponentsExternalPackages: ["pdf-lib"],
    // runs src/instrumentation.ts at startup (hourly cleanup of unpaid documents)
    instrumentationHook: true,
  },
};
module.exports = nextConfig;

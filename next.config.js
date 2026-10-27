/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // pdf-lib and stripe run on the server only
    serverComponentsExternalPackages: ["pdf-lib"],
    // runs src/instrumentation.ts at startup (hourly cleanup of unpaid documents)
    instrumentationHook: true,
  },
};
module.exports = nextConfig;

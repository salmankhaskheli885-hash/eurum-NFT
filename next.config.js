/** @type {import('next').NextConfig} */
const nextConfig = {
  // The app directory is enabled by default in Next.js 13.4+
  // We are keeping this explicit for clarity.
  experimental: {
    appDir: true,
  },
  // Add any other Next.js configurations here if needed in the future.
};

module.exports = nextConfig;

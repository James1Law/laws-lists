/** @type {import('next').NextConfig} */
const nextConfig = {
  // No special configuration needed for Vercel
  // Production optimizations
  poweredByHeader: false, // Remove X-Powered-By header
  compress: true, // Enable gzip compression
  reactStrictMode: true, // Enable React strict mode
  swcMinify: true, // Use SWC for minification
}

module.exports = nextConfig 
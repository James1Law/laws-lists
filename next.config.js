/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuration for GitHub Pages
  output: 'export',
  // Disable image optimization since it's not supported in static exports
  images: {
    unoptimized: true,
  },
  // Base path for GitHub Pages (should match your repository name)
  basePath: '/laws-lists',
  // No special configuration needed for Vercel
  // Production optimizations
  poweredByHeader: false, // Remove X-Powered-By header
  compress: true, // Enable gzip compression
  reactStrictMode: true, // Enable React strict mode
}

module.exports = nextConfig 
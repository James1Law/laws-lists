export function getSiteUrl() {
  // First check for Vercel's automatic URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // Then use environment-specific URLs
  return process.env.NODE_ENV === 'production'
    ? 'https://james-laws-lists.vercel.app'  // Production URL
    : 'http://localhost:3000';               // Development URL
} 
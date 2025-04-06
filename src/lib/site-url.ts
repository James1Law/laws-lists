export function getSiteUrl() {
  // First check for explicit SITE_URL
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  
  // Then check for Vercel deployment URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // Use the production URL if available
  if (process.env.NODE_ENV === 'production') {
    return 'https://james-laws-lists.vercel.app';
  }
  
  // Default to localhost for development
  return 'http://localhost:3000';
} 
export function getSiteUrl() {
  // In production, use Vercel's URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // In development, use localhost
  return process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3000'
    : 'https://james-laws-lists.vercel.app';
} 
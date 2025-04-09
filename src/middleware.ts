import { NextResponse, type NextRequest } from 'next/server';

// This middleware is now a placeholder for future functionality
// We're removing all Supabase Auth-based protection
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function middleware(request: NextRequest) {
  // Allow all requests
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - manifest files
     * - api routes
     */
    '/((?!_next/static|_next/image|favicon.ico|apple-touch-icon|android-chrome|site.webmanifest|api).*)',
  ],
}; 
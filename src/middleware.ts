import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getSiteUrl } from './lib/site-url';
import type { CookieOptions } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // If the cookie is being set with an empty value, remove it
          if (!value) {
            response.cookies.delete(name);
            return;
          }

          response.cookies.set({
            name,
            value,
            ...options,
            // Ensure secure cookies in production
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            httpOnly: true,
            path: '/',
          });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.delete(name);
        },
      },
    }
  );

  const { data: { session }, error } = await supabase.auth.getSession();

  // Handle auth pages
  if (request.nextUrl.pathname === '/') {
    if (session) {
      // If user is signed in and on the auth page, redirect to dashboard
      return NextResponse.redirect(new URL('/dashboard', getSiteUrl()));
    }
    // If not signed in and on auth page, allow access
    return response;
  }

  // Special handling for accept-invite page
  if (request.nextUrl.pathname.startsWith('/accept-invite')) {
    return response;
  }

  // Protected routes
  if (!session) {
    // Store the attempted URL to redirect back after login
    const redirectTo = request.nextUrl.pathname + request.nextUrl.search;
    const encodedRedirectTo = encodeURIComponent(redirectTo);
    return NextResponse.redirect(new URL(`/?redirectTo=${encodedRedirectTo}`, getSiteUrl()));
  }

  return response;
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
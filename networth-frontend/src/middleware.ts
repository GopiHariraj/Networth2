import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Public paths that don't require authentication
    const publicPaths = [
        '/login',
        '/register',
        '/reset-password',
        '/auth/reset-password',
        '/auth/magic-login',
        '/auth/reset',
        '/_next',
        '/api',
        '/favicon.ico'
    ];

    // Check if the path is public
    const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

    // Get token from cookie
    const token = request.cookies.get('token')?.value;

    // Redirect to login if accessing protected route without token
    if (!isPublicPath && !token) {
        const loginUrl = new URL('/login', request.url);
        return NextResponse.redirect(loginUrl);
    }

    // Redirect to dashboard if accessing login with valid token
    if (pathname === '/login' && token) {
        const dashboardUrl = new URL('/', request.url);
        return NextResponse.redirect(dashboardUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isSecure = req.nextUrl.protocol === 'https:';
  const cookieName = isSecure ? '__Secure-authjs.session-token' : 'authjs.session-token';

  let token = await getToken({ 
    req, 
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
    cookieName
  });

  // Fallback to default v4 cookie name
  if (!token) {
    token = await getToken({
      req,
      secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET
    });
  }

  const role = token?.role;

  if (pathname.startsWith('/admin') && role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (pathname.startsWith('/student') && role !== 'STUDENT') {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (pathname === '/') {
    if (token) {
      const homeUrl = (token.home as string) || (role === 'ADMIN' ? '/admin' : '/student');
      return NextResponse.redirect(new URL(homeUrl, req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/student/:path*', '/']
};
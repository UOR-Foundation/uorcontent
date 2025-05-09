import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { nextUrl, headers: requestHeaders } = request;
  const url = nextUrl.clone();
  const response = NextResponse.next();

  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https://*.vercel.app https://*.vercel-insights.com; frame-src 'self'; worker-src 'self' blob:; manifest-src 'self'"
  );
  
  response.headers.set('Referrer-Policy', 'no-referrer');

  if (process.env.NODE_ENV !== 'production') {
    console.log(`Middleware processing: ${url.pathname}`);
    console.log(`Request method: ${request.method}`);
    console.log(`User-Agent: ${requestHeaders.get('user-agent')}`);
  }

  return response;
}

export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
};

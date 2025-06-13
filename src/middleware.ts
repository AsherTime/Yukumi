import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res });

  // Refresh session if expired
  await supabase.auth.getSession();

  // Allow access to public uploads
  if (request.nextUrl.pathname.startsWith('/uploads/')) {
    return NextResponse.next();
  }

  // Allow access to the upload API endpoint
  if (request.nextUrl.pathname === '/api/upload') {
    return NextResponse.next();
  }

  return res;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

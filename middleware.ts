import { NextRequest, NextResponse } from 'next/server';

const MAX_BODY_SIZE = 1 * 1024 * 1024; // 1 MB

export function middleware(request: NextRequest) {
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_SIZE) {
    return NextResponse.json(
      { error: 'payload_too_large', detail: 'Request body exceeds 1 MB limit' },
      { status: 413 },
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};

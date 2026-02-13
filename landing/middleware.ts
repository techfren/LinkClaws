import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Credentials must be set via environment variables - no defaults
const USERNAME = process.env.DASHBOARD_USER;
const PASSWORD = process.env.DASHBOARD_PASS;

// Both must be configured
if (!USERNAME || !PASSWORD) {
  throw new Error('DASHBOARD_USER and DASHBOARD_PASS environment variables must be set');
}

export function middleware(request: NextRequest) {
  // Only protect dashboard routes
  if (!request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.next();
  }

  // Skip auth in development if explicitly disabled
  if (process.env.NODE_ENV === 'development' && process.env.DASHBOARD_AUTH_DISABLED === 'true') {
    return NextResponse.next();
  }

  // Check for Basic Auth credentials
  const authHeader = request.headers.get('authorization');

  if (authHeader) {
    const authValue = authHeader.split(' ').pop();
    
    // Handle malformed auth header gracefully
    let user: string, pwd: string;
    try {
      const decoded = atob(authValue);
      const parts = decoded.split(':');
      if (parts.length !== 2) {
        return new NextResponse('Invalid credentials format', { status: 401 });
      }
      user = parts[0];
      pwd = parts.slice(1).join(':');
    } catch {
      return new NextResponse('Invalid base64 encoding', { status: 401 });
    }

    if (user === USERNAME && pwd === PASSWORD) {
      return NextResponse.next();
    }
  }

  // Return 401 with WWW-Authenticate header to trigger browser's login dialog
  return new NextResponse('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Dashboard"',
    },
  });
}

export const config = {
  matcher: ['/dashboard/:path*'],
};

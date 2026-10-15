import { NextResponse, type NextRequest } from 'next/server';
import { isLiveRequest } from '@/lib/siteEnv';

/**
 * Keeps every copy of the site except kommissary.com out of sight:
 *
 * - Search engines are told not to index it (X-Robots-Tag), on every response.
 * - When STAGING_PASSWORD is set on the server, it asks for a password first (any
 *   username). Set it on the staging site only; on kommissary.com it's ignored anyway.
 *
 * The weekly Instagram token refresh is let through: it carries its own secret (see
 * app/api/instagram/refresh), and a password prompt would block it.
 */
export function middleware(req: NextRequest) {
  if (isLiveRequest(req)) return NextResponse.next();

  const password = process.env.STAGING_PASSWORD;
  if (password && req.nextUrl.pathname !== '/api/instagram/refresh' && !hasPassword(req, password)) {
    return new NextResponse('This is a preview of the new Kommissary site.', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Kommissary preview", charset="UTF-8"',
        'X-Robots-Tag': 'noindex, nofollow',
      },
    });
  }

  const res = NextResponse.next();
  res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return res;
}

function hasPassword(req: NextRequest, password: string): boolean {
  const auth = req.headers.get('authorization') ?? '';
  if (!auth.startsWith('Basic ')) return false;
  try {
    const decoded = atob(auth.slice(6));
    return decoded.slice(decoded.indexOf(':') + 1) === password;
  } catch {
    return false;
  }
}

export const config = {
  // Everything but Next's own static files, which carry no content of their own.
  matcher: ['/((?!_next/static|_next/image).*)'],
};

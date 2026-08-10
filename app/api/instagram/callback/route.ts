import { IG_APP_ID, IG_APP_SECRET, IG_REDIRECT_URI } from '@/lib/instagram/config';

/**
 * Step 2 of connecting the Instagram account: Instagram sends the account holder back
 * here with a one-time `code`. We trade it for a short-lived token, immediately upgrade
 * that to a 60-day long-lived one, and show it so it can be saved into the env.
 *
 * The exchange happens server-side because it needs the app secret, which must never
 * reach the browser.
 */

function page(title: string, body: string, ok = true) {
  return new Response(
    `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
     <title>${title}</title>
     <style>
       body{font:16px/1.6 system-ui,sans-serif;background:#000666;color:#fff;margin:0;padding:48px 24px;display:flex;justify-content:center}
       .card{max-width:640px;width:100%}
       h1{color:${ok ? '#ff6666' : '#ffcf33'};font-size:24px;margin:0 0 16px}
       code{display:block;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);
            border-radius:10px;padding:14px;margin:8px 0 20px;word-break:break-all;font-size:13px}
       .muted{color:rgba(255,255,255,.6);font-size:14px}
     </style></head>
     <body><div class="card"><h1>${title}</h1>${body}</div></body></html>`,
    { status: ok ? 200 : 400, headers: { 'content-type': 'text/html; charset=utf-8' } }
  );
}

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;

  const denied = params.get('error');
  if (denied) {
    return page(
      'Not connected',
      `<p>Instagram reported: <strong>${params.get('error_description') ?? denied}</strong></p>
       <p class="muted">Nothing was saved. You can close this tab and try the link again.</p>`,
      false
    );
  }

  const code = params.get('code');
  if (!code) return page('Missing authorisation code', '<p class="muted">Open the connect link again.</p>', false);
  if (!IG_APP_ID || !IG_APP_SECRET) {
    return page('Server not configured', '<p class="muted">INSTAGRAM_APP_ID / INSTAGRAM_APP_SECRET are missing.</p>', false);
  }

  try {
    // 1. One-time code → short-lived token (also returns the account's numeric id).
    const shortRes = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: IG_APP_ID,
        client_secret: IG_APP_SECRET,
        grant_type: 'authorization_code',
        redirect_uri: IG_REDIRECT_URI,
        // Instagram appends this to the code on some flows; it isn't part of the value.
        code: code.replace(/#_$/, ''),
      }),
    });
    const short = (await shortRes.json()) as {
      access_token?: string;
      user_id?: number | string;
      error_message?: string;
    };
    if (!short.access_token) {
      return page('Could not complete the handshake', `<p class="muted">${short.error_message ?? 'No token returned.'}</p>`, false);
    }

    // 2. Short-lived (1 hour) → long-lived (60 days).
    const longRes = await fetch(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${IG_APP_SECRET}&access_token=${short.access_token}`
    );
    const long = (await longRes.json()) as { access_token?: string; expires_in?: number };
    const token = long.access_token ?? short.access_token;
    const days = long.expires_in ? Math.round(long.expires_in / 86400) : null;

    return page(
      'Instagram connected',
      `<p>Copy both values below and send them to your developer. Then you can close this tab.</p>
       <p class="muted">Access token${days ? ` (valid ${days} days)` : ''}</p>
       <code>${token}</code>
       <p class="muted">Instagram user ID</p>
       <code>${short.user_id ?? 'unknown'}</code>`
    );
  } catch (err) {
    console.error('Instagram OAuth callback failed:', err);
    return page('Something went wrong', '<p class="muted">Please try the connect link again.</p>', false);
  }
}

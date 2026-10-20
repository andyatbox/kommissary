import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';

/**
 * /og.png: the branded 1200×630 card link previews show for pages without a picture of
 * their own (see shareImage in lib/seo.ts). The arched logo and a line of copy in New
 * Spirit on navy, with a little of the site's gradient. Drawn once, at build.
 */
export const dynamic = 'force-static';

export async function GET() {
  const root = process.cwd();
  const [font, logo] = await Promise.all([
    readFile(join(root, 'public/fonts/NewSpirit.woff')),
    readFile(join(root, 'public/images/kommissary-arched-logo.svg')),
  ]);
  const logoSrc = `data:image/svg+xml;base64,${logo.toString('base64')}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#000666',
          backgroundImage:
            'radial-gradient(circle at 18% 20%, rgba(255,207,51,0.28), rgba(0,6,102,0) 45%), radial-gradient(circle at 85% 85%, rgba(160,40,140,0.45), rgba(0,6,102,0) 50%)',
          fontFamily: 'New Spirit',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} width={820} height={202} alt="" />
        <div style={{ marginTop: 44, fontSize: 40, color: '#ffffff', textAlign: 'center', maxWidth: 900 }}>
          Chef-crafted meals and food logistics for New York City
        </div>
        <div style={{ marginTop: 28, fontSize: 28, color: '#ff6666' }}>kommissary.com</div>
      </div>
    ),
    { width: 1200, height: 630, fonts: [{ name: 'New Spirit', data: font, weight: 500, style: 'normal' }] }
  );
}

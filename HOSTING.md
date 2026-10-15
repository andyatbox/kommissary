# Hosting Kommissary 2.0 on Hostinger

How the new site (this repo) gets a private preview on Kommissary's Hostinger account, and
how it later replaces the live 1.0 site at kommissary.com. Nothing here touches the live
site until the **Launch** section, and launch can be rolled back.

## Where things are

| What | Where | Status |
|---|---|---|
| **2.0 site** (this repo) | `~/Documents/kommissary` | In progress. Branch `v2-outreach-pages` adds /bronx, /educator, /dycd, /privacy |
| **1.0 site** (live) | `~/Documents/kommissary 1.0` → Hostinger `domains/kommissary.com/public_html` via its `deploy.sh` | Live at kommissary.com. Untouched by any of this |
| 1.0's Nutrition Box pages (source) | `~/Documents/kommissary-bronx` | Retired at launch: those pages now live in 2.0 |
| 2.0 preview (old) | Vercel, `kommissary-omega.vercel.app` (personal account) | Retire after the steps below |

## How the preview stays private

Everything that could leak a preview is decided by **the address in the browser**, not by
build settings (`lib/siteEnv.ts`). On any address other than `kommissary.com` /
`www.kommissary.com`:

- **Search engines are told not to index it** (an `X-Robots-Tag: noindex` header on every response, `middleware.ts`).
- **It asks for a password** when `STAGING_PASSWORD` is set (any username).
- **Google Analytics and the Meta pixels don't load**, so test visits never reach the real reports.
- **Forms don't send.** The Nutrition Box, Educator, Community Leader and Contact forms show their thank-you and send nothing, so no test lead is emailed to the care team. To send one for real on purpose, add `?livesubmit=1` to the page address (it *will* reach careservices@ / contact@).

On kommissary.com all of the above is reversed automatically: there's no flag to remember at launch.

---

## 1. Set up the preview (one time)

### 1a. Move the code to a Kommissary-owned GitHub account
The repo is currently `github.com/andyatbox/kommissary` (personal). Hostinger builds the
site from GitHub, so first give Kommissary ownership:
GitHub → the repo → **Settings → General → Transfer ownership** → a Kommissary
organization. History, branches and issues move with it; GitHub redirects the old address.

### 1b. Create the Node.js app in hPanel
Menu names below are approximate; hPanel's wording shifts between versions.

1. hPanel → **Websites → Add website → Node.js app** (requires a Business or Cloud plan;
   if it isn't offered, the plan needs upgrading).
2. **Domain:** a new subdomain, `preview.kommissary.com`. ⚠️ Never choose
   `kommissary.com` itself here: that would replace the live site.
3. **Source:** the GitHub repo from 1a, branch **`v2-outreach-pages`** (or whichever branch
   is being previewed).
4. **Node.js version:** 22 (20 also works).
5. **Build command:** `npm run build`  **Start command:** `npm start`
6. **Environment variables:** see the table below. Must be in place *before* the first
   build (the Sanity ones are read at build time).

| Variable | Preview | Live (at launch) |
|---|---|---|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` = `9axriqng` | ✅ | ✅ |
| `NEXT_PUBLIC_SANITY_DATASET` = `production` | ✅ | ✅ |
| `NEXT_PUBLIC_SANITY_API_VERSION` = `2024-10-01` | ✅ | ✅ |
| `STAGING_PASSWORD` (pick one) | ✅ | ❌ never |
| `INSTAGRAM_TOKEN_KEY` (same value as today's) | ✅ for reels on the phones | ✅ |
| `GEMINI_API_KEY` | optional (Kai) | ✅ |
| `SANITY_WRITE_TOKEN`, `CRON_SECRET` | only if the preview runs the Instagram cron (§4) | ✅ |
| `INSTAGRAM_APP_ID`, `INSTAGRAM_APP_SECRET`, `INSTAGRAM_REDIRECT_URI`, `INSTAGRAM_ACCESS_TOKEN` | ❌ | ✅ |

`.env.example` explains each one. Secret values live in Vercel today (Project → Settings →
Environment Variables) and in your local `.env.local`.

**If the build fails with `Missing environment variable: NEXT_PUBLIC_SANITY_PROJECT_ID`,**
the variables aren't reaching the build step: check they're saved on the app, then rebuild.

### 1c. Let Sanity Studio work on the preview
sanity.io/manage → project **Kommissary** (`9axriqng`) → **API → CORS origins → Add CORS
origin**: `https://preview.kommissary.com`, **Allow credentials: ✅ on**. Without it,
`/studio` on the preview can't sign in. (`http://localhost:3001` should already be listed.)

### 1d. Load the page copy into Sanity
The Nutrition Box, Educators and Community Leaders pages read their copy from Sanity and
fall back to built-in copy, so they work before this step. Importing gives editors the
current copy to start from. In Terminal, in this folder:

```
npx sanity login
npx sanity dataset import sanity/seed/outreach-pages.ndjson production --missing
```

`--missing` only adds documents that don't exist yet, so it can never overwrite edits. The
pages then appear in Studio under **Nutrition Box (/bronx)**, **Educators (/educator)** and
**Community Leaders (/dycd)**.

### 1e. Check it
- `https://preview.kommissary.com` asks for the password.
- In Terminal: `curl -sI -u x:PASSWORD https://preview.kommissary.com | grep -i x-robots` → `x-robots-tag: noindex, nofollow`.
- `/bronx`, `/educator`, `/dycd`, `/privacy` load; the EN/ES switch works; a form ends at its thank-you (and nothing arrives at careservices@).

### Updating the preview
Push to the branch hPanel watches; Hostinger rebuilds. Copy edits in Sanity show within a
minute with no rebuild.

---

## 2. Before launch: decisions

### Old 1.0 addresses
Once 2.0 serves kommissary.com, any 1.0 address 2.0 doesn't have returns "not found".
Links in emails, social posts and **printed QR codes** break. Each needs a 2.0 page or a
redirect (added in `next.config.mjs` → `redirects()`):

| 1.0 address | 2.0 | Suggested |
|---|---|---|
| /bronx, /educator, /dycd, /privacy, /careers, /contact, /our-impact | same address | — |
| /medicaid, /screening | → /bronx | ✅ done |
| /about | — | → /our-story? |
| /services | — | → a services page? |
| /spotlight | — | ? |
| /nyc-groceries, /jobs-fair | — | campaign pages: check for flyers/QR codes |
| /box, /labs, /v2, /kommissary1.0, /src | — | old experiments: probably let go |

### Instagram reconnect address
Meta app → Instagram settings → add `https://kommissary.com/api/instagram/callback` as a
valid redirect URI, and set `INSTAGRAM_REDIRECT_URI` to it on the live app. (Only matters if
Instagram ever needs re-connecting; the weekly refresh doesn't use it.)

---

## 3. Launch (2.0 replaces 1.0)

1. **Back up the server-only files.** A few things exist only on the server, not in
   `~/Documents/kommissary 1.0` (e.g. `.htaccess`, `box/`, `nyc-groceries/`). hPanel → File
   Manager → `domains/kommissary.com/public_html` → compress → download.
2. **Point kommissary.com at the Node.js app.** Easiest: a second Node.js app on
   `kommissary.com` from the `main` branch with the **Live** variables above. ⚠️ No
   `STAGING_PASSWORD` on it.
3. **Verify** within minutes:
   - `curl -sI https://kommissary.com | grep -i x-robots` prints **nothing**. If it prints
     `noindex`, the server isn't passing the real address through to the app; fix before
     search engines see it.
   - No password prompt. `/bronx`, `/educator`, `/dycd` load.
   - Google Analytics → Realtime shows your visit.
   - One real test submission per form, then tell the care team to expect and ignore it.
4. **Move the Instagram cron** (§4) to kommissary.com.
5. **Retire:** the Vercel project (§5), and `kommissary-bronx` (its pages now live here).

**Rolling back:** point kommissary.com back to the plain website in hPanel. As long as
`public_html` was left in place (step 1), 1.0 returns as it was. `~/Documents/kommissary 1.0`
and its `deploy.sh` still work as before.

---

## 4. The Instagram token cron

The homepage phones show Instagram reels. The token expires 60 days after each refresh, so
something must call the refresh weekly. Today that's Vercel's cron (`vercel.json`).

hPanel → **Advanced → Cron Jobs**, weekly, Monday 04:00:

```
curl -fsS -H "Authorization: Bearer YOUR_CRON_SECRET" https://kommissary.com/api/instagram/refresh > /dev/null
```

The site running it needs `CRON_SECRET`, `SANITY_WRITE_TOKEN` and `INSTAGRAM_TOKEN_KEY`. Before
launch it can run against the preview instead (`https://preview.kommissary.com/...`; the
refresh is let past the password). **Only run it from one place.** Check any time at
`/api/instagram/refresh` in a browser: `daysLeft` should never drop much below 30.

## 5. Retiring the Vercel preview

Do this only after the cron runs somewhere else (§4), or the token lapses within 60 days and
the reels disappear. Then: Vercel → project **kommissary** → Settings → **Delete Project**.
Until then, pushing to `main` still deploys there; this branch adds noindex and turns
forms and pixels off on that address too, so it's safe to leave running in the meantime.

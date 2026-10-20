#!/bin/bash
# Publishes this branch to the private 2.0 preview on Hostinger. One command, no hPanel:
#
#   scripts/deploy-preview.sh             build, upload, switch over, check
#   scripts/deploy-preview.sh --rollback  switch back to the previous version
#
# The preview is a Hostinger Node.js app. Hostinger serves whatever its `hbuilds/current`
# points at (a Next.js standalone bundle in `nodejs/`, started by Passenger), so this
# builds that same bundle here, uploads it as a new version next to the running one,
# repoints `current` in a single step and restarts. The previous versions stay on the
# server, which is what --rollback switches back to.
#
# Safety:
#   - It can only deploy to the preview's domain folder. kommissary.com is refused
#     outright: that site is 1.0, deployed by ~/Documents/kommissary 1.0/deploy.sh.
#   - Only committed work is deployed, so what's live is always a known commit.
#   - It builds in .next-deploy/, so a running `npm run dev` is left alone.
#   - Secrets aren't uploaded: the server keeps its own (hPanel's environment variables).

set -euo pipefail
cd "$(dirname "$0")/.."

HOST="145.79.4.183"
PORT="65002"
USER="u388606080"
SSH_KEY="$HOME/.ssh/id_ed25519"
DOMAIN="darkseagreen-porcupine-317758.hostingersite.com"
APP="domains/$DOMAIN/hbuilds"
URL="https://$DOMAIN"
KEEP=4 # versions kept on the server (the running one always among them)

if [[ "$DOMAIN" == *kommissary.com* || -z "$DOMAIN" ]]; then
  echo "Refusing: this script only deploys the preview, never kommissary.com." >&2
  exit 1
fi

SSH=(ssh -p "$PORT" -i "$SSH_KEY" -o BatchMode=yes -o ConnectTimeout=20 "$USER@$HOST")
remote() { "${SSH[@]}" "set -euo pipefail; cd ~/$APP; $1"; }

# The preview answers with a password prompt and stays out of search engines. Checked
# after every deploy and rollback, from one response at a time (status and header together),
# with a few retries: just after a restart the server can briefly answer something else.
check_preview() {
  local headers code robots
  for i in $(seq 1 6); do
    headers=$(curl -s -o /dev/null -m 30 -D - "$URL/" | tr -d '\r')
    code=$(awk 'NR==1{print $2}' <<<"$headers")
    robots=$(awk -F': ' 'tolower($1)=="x-robots-tag"{print $2}' <<<"$headers")
    if [[ "$code" == "401" && "$robots" == "noindex, nofollow" ]]; then
      echo "    Password prompt and noindex: in place."
      return 0
    fi
    sleep 5
  done
  echo "!! Unexpected: $URL/ answered $code with x-robots-tag '$robots' (expected 401, noindex)." >&2
  return 1
}

if [[ "${1:-}" == "--rollback" ]]; then
  echo "==> Switching the preview back to the previous version"
  remote '
    cur=$(basename "$(readlink current)")
    prev=$(ls -1t versions | grep -vx "$cur" | head -1)
    [ -n "$prev" ] || { echo "No earlier version to roll back to." >&2; exit 1; }
    ln -sfn "versions/$prev" current.next && mv -Tf current.next current
    touch current/nodejs/tmp/restart.txt
    echo "    now serving $prev (was $cur)"'
  sleep 5
  check_preview
  exit 0
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Refusing: uncommitted changes. Commit them first; nothing was deployed." >&2
  exit 1
fi

COMMIT=$(git rev-parse --short HEAD)
VERSION="$(date +%Y%m%d-%H%M%S)-$COMMIT"
DIST=".next-deploy"
STAGE=$(mktemp -d)
trap 'rm -rf "$STAGE"' EXIT

echo "==> Building $COMMIT ($(git log -1 --format=%s))"
rm -rf "$DIST"
NEXT_OUTPUT=standalone NEXT_DIST_DIR="$DIST" npx next build > "$STAGE/build.log" 2>&1 || {
  tail -30 "$STAGE/build.log" >&2
  echo "Build failed; nothing was deployed." >&2
  exit 1
}

# The bundle Hostinger runs: the standalone server, plus the static assets and public/
# folder, which Next deliberately leaves out of standalone.
#
# Copied as `src/.` into a made-sure folder, so it always MERGES. Standalone can already
# hold a partial public/ (files a route reads from disk get traced in, e.g. the font and
# logo app/og.png draws with), and `cp -R public dest` into an existing dest nests it as
# dest/public instead: the site then loses every image, model and font (October 2026).
B="$STAGE/nodejs"
cp -R "$DIST/standalone" "$B"
mkdir -p "$B/$DIST/static" "$B/public"
cp -R "$DIST/static/." "$B/$DIST/static/"
cp -R public/. "$B/public/"
mkdir -p "$B/tmp"
missing=$(comm -23 <(cd public && find . -type f | sort) <(cd "$B/public" && find . -type f | sort))
if [[ -n "$missing" || -e "$B/public/public" ]]; then
  echo "Refusing: the bundle's public/ doesn't match the repo's; nothing was deployed." >&2
  [[ -n "$missing" ]] && echo "$missing" | head -10 >&2
  exit 1
fi
if [[ -n "$(find "$B" -maxdepth 3 -name '.env*' -print -quit)" ]]; then
  echo "Refusing: an .env file ended up in the bundle; nothing was deployed." >&2
  exit 1
fi
BUILD_ID=$(cat "$DIST/BUILD_ID")

echo "==> Uploading as version $VERSION"
CUR=$(remote 'basename "$(readlink current)"')
remote "mkdir -p versions/$VERSION/nodejs versions/$VERSION/public_html"
# Files unchanged since the running version are hard-linked rather than re-sent.
rsync -az --delete --link-dest="../../$CUR/nodejs/" -e "ssh -p $PORT -i $SSH_KEY" \
  "$B/" "$USER@$HOST:$APP/versions/$VERSION/nodejs/"

# Keep Hostinger's own copy of the source current too, so a rebuild started from hPanel
# builds this same code instead of reverting to an older upload.
git archive --format=tar HEAD | remote 'rm -rf last-source.next && mkdir last-source.next && tar -x -C last-source.next && rm -rf last-source && mv last-source.next last-source'

echo "==> Switching over"
remote "ln -sfn versions/$VERSION current.next && mv -Tf current.next current && touch current/nodejs/tmp/restart.txt"

# Static files bypass the password, so this confirms the new build is the one serving.
for i in $(seq 1 12); do
  sleep 5
  if [[ "$(curl -s -o /dev/null -m 20 -w '%{http_code}' "$URL/_next/static/$BUILD_ID/_buildManifest.js")" == "200" ]]; then
    echo "    New build is serving."
    break
  fi
  [[ "$i" == 12 ]] && { echo "!! The new build isn't answering yet. Check $URL, or run --rollback." >&2; exit 1; }
done
# public/ is behind the password, so check the files on the server instead.
remote "test -f current/nodejs/public/images/certs.svg && test -d current/nodejs/public/models" ||
  { echo "!! The new build is missing its public/ files. Run --rollback." >&2; exit 1; }
echo "    Public files (images, models, fonts): in place."
check_preview

# Older versions beyond KEEP are removed (never the one serving). `|| true`: finding none
# to remove isn't a failure.
remote "ls -1t versions | tail -n +$((KEEP + 1)) | { grep -vx \"\$(basename \"\$(readlink current)\")\" || true; } | xargs -r -I{} rm -rf versions/{}"
echo "==> Done. $URL is serving $COMMIT."

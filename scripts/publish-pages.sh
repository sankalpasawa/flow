#!/usr/bin/env bash
# publish-pages.sh — build the DayFlow Expo web export for GitHub Pages and
# force-push the artifact (and only the artifact) to the gh-pages branch of
# sankalpasawa/flow. Serves at https://sankalpasawa.github.io/flow/
#
# What it does (WEB-2 migration, 2026-09-11):
#   1. cd mobile && PAGES_EXPORT=1 npx expo export --platform web   -> mobile/dist
#      (PAGES_EXPORT=1 makes mobile/app.config.js set experiments.baseUrl=/flow;
#       the default build, used by Vercel/EAS/local dev, is untouched.)
#   2. Adds SPA fallback (404.html = index.html) and .nojekyll.
#   3. Scans the artifact: no source maps, no env/lock/config/report files,
#      no secret-looking strings, no absolute local paths.
#   4. Copies dist into a fresh mktemp dir, inits an orphan gh-pages branch,
#      and force-pushes it. Force-push is scoped to gh-pages ONLY; main is never
#      touched by this script.
#
# Usage:  scripts/publish-pages.sh            (from the repo root)
#         DRY_RUN=1 scripts/publish-pages.sh  (build + scan, skip the push)
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/sankalpasawa/flow.git}"
BRANCH="gh-pages"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST="$ROOT/mobile/dist"

echo "==> [1/4] Building web export with PAGES_EXPORT=1"
(cd "$ROOT/mobile" && PAGES_EXPORT=1 npx expo export --platform web)
[ -d "$DIST" ] || { echo "ERROR: $DIST missing after export" >&2; exit 1; }

echo "==> [2/4] SPA fallback + hygiene"
cp "$DIST/index.html" "$DIST/404.html"
: > "$DIST/.nojekyll"

echo "==> [3/4] Artifact scan"
fail=0
maps=$(find "$DIST" -name '*.map' | wc -l | tr -d ' ')
if [ "$maps" != "0" ]; then echo "ERROR: $maps source map(s) in dist" >&2; fail=1; fi

stray=$(cd "$DIST" && find . \( -name '.env*' -o -name '.git' -o -name 'node_modules' -o -name '*.md' \
        -o -name 'package-lock.json' -o -name 'yarn.lock' -o -name 'pnpm-lock.yaml' \
        -o -name 'app.json' -o -name 'app.config.js' -o -name 'vercel.json' -o -name 'tsconfig.json' \) | wc -l | tr -d ' ')
if [ "$stray" != "0" ]; then echo "ERROR: stray non-artifact files in dist" >&2; fail=1; fi

# Root-absolute asset URLs that lack the /flow prefix would 404 on Pages.
if grep -rIlE '(src|href)="/(_expo|assets)/' "$DIST" >/dev/null 2>&1; then
  echo "ERROR: root-absolute /_expo or /assets URL found in dist (missing /flow prefix)" >&2; fail=1
fi

secrets=$(grep -rIlE 'sk_live|sk_test|AKIA|-----BEGIN|SERVICE_ROLE|PRIVATE_KEY|SECRET|/Users/' "$DIST" || true)
if [ -n "$secrets" ]; then
  echo "ERROR: secret-looking strings found in:" >&2; echo "$secrets" >&2; fail=1
fi
[ "$fail" = "0" ] || exit 1

echo "    EXPO_PUBLIC_ names embedded (names only):"
grep -rIohE 'EXPO_PUBLIC_[A-Z0-9_]+' "$DIST" | sort -u | sed 's/^/      /' || true
echo "    files: $(find "$DIST" -type f | wc -l | tr -d ' ')  bytes: $(du -sk "$DIST" | cut -f1)K"
echo "    manifest sha256: $(cd "$DIST" && find . -type f | sort | xargs shasum -a 256 | shasum -a 256 | cut -d' ' -f1)"

if [ "${DRY_RUN:-0}" = "1" ]; then echo "DRY_RUN=1: skipping publish"; exit 0; fi

echo "==> [4/4] Publishing to $BRANCH"
P="$(mktemp -d)"
trap 'rm -rf "$P"' EXIT
cp -R "$DIST/." "$P/"
cd "$P"
git init -q -b "$BRANCH"
git add -A
git commit -q -m "publish flow $(date -u +%Y-%m-%dT%H:%M:%SZ) (WEB-2)"
git push --force "$REPO_URL" "$BRANCH"
echo "published $(git rev-parse HEAD) -> $BRANCH"

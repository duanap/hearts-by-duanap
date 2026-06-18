#!/usr/bin/env bash
set -euo pipefail

# Dry-run by default. To execute on the server:
#   EXECUTE=1 CUTOVER_CONFIRM=SVELTE_PUBLIC_CUTOVER bash scripts/cutover-linux.example.sh

ROOT="${ROOT:-/www/wwwroot/hearts.duanap.cn}"
DIST_SOURCE="${DIST_SOURCE:-$ROOT/frontend/dist}"
PUBLIC="$ROOT/public"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP="$ROOT/public_backup_$TIMESTAMP"
EXECUTE="${EXECUTE:-0}"

run() {
  printf '\n==> %s\n' "$*"
  if [ "$EXECUTE" = "1" ]; then
    "$@"
  else
    printf 'DRY RUN: not executing. Set EXECUTE=1 and CUTOVER_CONFIRM=SVELTE_PUBLIC_CUTOVER to run.\n'
  fi
}

run_shell() {
  printf '\n==> %s\n' "$*"
  if [ "$EXECUTE" = "1" ]; then
    sh -c "$*"
  else
    printf 'DRY RUN: not executing. Set EXECUTE=1 and CUTOVER_CONFIRM=SVELTE_PUBLIC_CUTOVER to run.\n'
  fi
}

case "$PUBLIC" in
  "$ROOT"/public) ;;
  *) echo "Refusing unexpected public path: $PUBLIC" >&2; exit 1 ;;
esac

echo "Linux cutover example for Svelte frontend"
echo "Root:        $ROOT"
echo "Public:      $PUBLIC"
echo "Dist source: $DIST_SOURCE"
echo "Backup:      $BACKUP"
echo "Mode:        $([ "$EXECUTE" = "1" ] && echo EXECUTE || echo DRY_RUN)"

if [ "$EXECUTE" = "1" ] && [ "${CUTOVER_CONFIRM:-}" != "SVELTE_PUBLIC_CUTOVER" ]; then
  echo "Set CUTOVER_CONFIRM=SVELTE_PUBLIC_CUTOVER to execute." >&2
  exit 1
fi

run cd "$ROOT"

if [ -f "$ROOT/scripts/preview-dist-check.mjs" ]; then
  run node "$ROOT/scripts/preview-dist-check.mjs"
else
  echo "warning: $ROOT/scripts/preview-dist-check.mjs not found; run the dist check before deploying." >&2
fi

run test -d "$PUBLIC"
run test -d "$DIST_SOURCE"

run cp -a "$PUBLIC" "$BACKUP"
run_shell "find '$PUBLIC' -mindepth 1 -maxdepth 1 -exec rm -rf -- {} +"
run_shell "cp -a '$DIST_SOURCE'/. '$PUBLIC'/"

run test -f "$PUBLIC/index.html"
run test -f "$PUBLIC/manifest.webmanifest"
run test -f "$PUBLIC/sw.js"
run test -d "$PUBLIC/assets"
run test -d "$PUBLIC/css"
run test -d "$PUBLIC/icons"
run test -f "$PUBLIC/table-bg-v1210.webp"

run pm2 restart hearts-online
run nginx -t
run nginx -s reload
run curl -fsS http://127.0.0.1:3000/healthz
run curl -fsS https://hearts.duanap.cn/healthz

echo
echo "Dry-run complete. No files were changed unless EXECUTE=1 was set."

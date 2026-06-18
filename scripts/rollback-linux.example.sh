#!/usr/bin/env bash
set -euo pipefail

# Dry-run by default. To execute on the server:
#   EXECUTE=1 ROLLBACK_CONFIRM=RESTORE_PUBLIC_BACKUP bash scripts/rollback-linux.example.sh /www/wwwroot/hearts.duanap.cn/public_backup_YYYYMMDD-HHMMSS

ROOT="${ROOT:-/www/wwwroot/hearts.duanap.cn}"
PUBLIC="$ROOT/public"
BACKUP="${1:-${BACKUP_DIR:-}}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
FAILED_PUBLIC="$ROOT/public_failed_$TIMESTAMP"
EXECUTE="${EXECUTE:-0}"

run() {
  printf '\n==> %s\n' "$*"
  if [ "$EXECUTE" = "1" ]; then
    "$@"
  else
    printf 'DRY RUN: not executing. Set EXECUTE=1 and ROLLBACK_CONFIRM=RESTORE_PUBLIC_BACKUP to run.\n'
  fi
}

if [ -z "$BACKUP" ]; then
  echo "Usage: BACKUP_DIR=/path/to/public_backup_xxx bash scripts/rollback-linux.example.sh" >&2
  echo "   or: bash scripts/rollback-linux.example.sh /path/to/public_backup_xxx" >&2
  exit 1
fi

case "$PUBLIC" in
  "$ROOT"/public) ;;
  *) echo "Refusing unexpected public path: $PUBLIC" >&2; exit 1 ;;
esac

echo "Linux rollback example for Svelte frontend cutover"
echo "Root:          $ROOT"
echo "Public:        $PUBLIC"
echo "Backup source: $BACKUP"
echo "Failed copy:   $FAILED_PUBLIC"
echo "Mode:          $([ "$EXECUTE" = "1" ] && echo EXECUTE || echo DRY_RUN)"

if [ "$EXECUTE" = "1" ] && [ "${ROLLBACK_CONFIRM:-}" != "RESTORE_PUBLIC_BACKUP" ]; then
  echo "Set ROLLBACK_CONFIRM=RESTORE_PUBLIC_BACKUP to execute." >&2
  exit 1
fi

run cd "$ROOT"
run test -d "$BACKUP"
run test -f "$BACKUP/index.html"
run test -d "$PUBLIC"

# Keep the failed public copy for inspection instead of deleting it immediately.
run mv "$PUBLIC" "$FAILED_PUBLIC"
run cp -a "$BACKUP" "$PUBLIC"

run test -f "$PUBLIC/index.html"
run test -f "$PUBLIC/sw.js"
run test -f "$PUBLIC/manifest.webmanifest"

run pm2 restart hearts-online
run nginx -t
run nginx -s reload
run curl -fsS http://127.0.0.1:3000/healthz
run curl -fsS https://hearts.duanap.cn/healthz

echo
echo "Dry-run complete. No files were changed unless EXECUTE=1 was set."
echo "After a successful rollback and verification, remove $FAILED_PUBLIC manually if it is no longer needed."

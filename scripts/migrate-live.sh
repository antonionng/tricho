#!/usr/bin/env bash
# Applies any new migrations to the live database. Migrations in this repo are
# additive only. Run `bash scripts/migrate-live.sh` to see what's pending, then
# `bash scripts/migrate-live.sh --apply` to apply it.
set -euo pipefail
cd "$(dirname "$0")/.."

LIVE=$(grep -E '^DATABASE_URL=' .env | head -1 | sed -E 's/^DATABASE_URL="?([^"]*)"?$/\1/')
[ -n "$LIVE" ] || { echo "No DATABASE_URL in .env"; exit 1; }

if [ "${1:-}" = "--apply" ]; then
  DATABASE_URL="$LIVE" npx prisma migrate deploy
else
  DATABASE_URL="$LIVE" npx prisma migrate status || true
  echo
  echo "Nothing changed. Pass --apply to apply the pending migrations."
fi

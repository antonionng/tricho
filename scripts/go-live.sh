#!/usr/bin/env bash
# Brings the live database up to date for the redesign. Additive only.
# 1. applies prisma/go-live/2026-10-01-catch-up.sql
# 2. marks every migration as applied so future deploys run cleanly
# 3. runs the go-live backfill (dry run unless --apply is passed)
set -euo pipefail
cd "$(dirname "$0")/.."

LIVE=$(grep -E '^DATABASE_URL=' .env | head -1 | sed -E 's/^DATABASE_URL="?([^"]*)"?$/\1/')
[ -n "$LIVE" ] || { echo "No DATABASE_URL in .env"; exit 1; }

if [ "${1:-}" = "--apply" ]; then
  echo "Applying the catch-up SQL to the live database"
  DATABASE_URL="$LIVE" npx prisma db execute --file prisma/go-live/2026-10-01-catch-up.sql

  echo "Marking migrations as applied"
  for m in prisma/migrations/2*/; do
    DATABASE_URL="$LIVE" npx prisma migrate resolve --applied "$(basename "$m")"
  done

  echo "Running the backfill"
  ENV_FILE=.env npx tsx scripts/go-live-backfill.ts --live --apply
else
  echo "Dry run: the backfill reports what it would change. Pass --apply to update the live database."
  ENV_FILE=.env npx tsx scripts/go-live-backfill.ts --live
fi

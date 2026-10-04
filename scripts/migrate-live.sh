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
  # New tables must never be readable through Supabase's public data API. The app
  # connects as the table owner, which isn't subject to row level security.
  echo "DO \$\$ DECLARE t record; BEGIN FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND NOT rowsecurity LOOP EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename); END LOOP; END \$\$;" \
    | DATABASE_URL="$LIVE" npx prisma db execute --stdin
  echo "Row level security is on for every public table."
else
  DATABASE_URL="$LIVE" npx prisma migrate status || true
  echo
  echo "Nothing changed. Pass --apply to apply the pending migrations."
fi

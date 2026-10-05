#!/usr/bin/env bash
# Re-sends a live Stripe event to the live webhook, signed with the webhook
# secret, exactly as Stripe would. Used to recover events that failed while the
# webhook secret was wrong.
#
#   bash scripts/replay-stripe-event.sh whsec_... evt_... [evt_...]
#   bash scripts/replay-stripe-event.sh whsec_... path/to/event.json   (an event saved from Stripe)
set -euo pipefail
cd "$(dirname "$0")/.."

SK=$(grep -E '^STRIPE_SECRET_KEY=' .env | head -1 | sed -E 's/^STRIPE_SECRET_KEY="?([^"]*)"?$/\1/')
WH="${1:-}"; shift || true
case "$WH" in whsec_*) ;; *) echo "First argument must be the webhook's whsec_ secret"; exit 1;; esac
URL="https://www.trichollective.net/api/webhooks/stripe"
[ $# -gt 0 ] || { echo "Pass one or more event ids"; exit 1; }

for EV in "$@"; do
  if [ -f "$EV" ]; then
    BODY=$(cat "$EV")
  else
    [ -n "$SK" ] || { echo "No STRIPE_SECRET_KEY in .env, so pass a saved event file instead"; exit 1; }
    BODY=$(curl -s -m 20 -u "$SK:" "https://api.stripe.com/v1/events/$EV")
  fi
  TS=$(date +%s)
  SIG=$(printf "%s.%s" "$TS" "$BODY" | openssl dgst -sha256 -hmac "$WH" -hex | awk '{print $NF}')
  CODE=$(curl -s -o /dev/null -w '%{http_code}' -m 30 -X POST "$URL" \
    -H 'Content-Type: application/json' -H "Stripe-Signature: t=$TS,v1=$SIG" --data-binary "$BODY")
  echo "$EV -> $CODE"
done

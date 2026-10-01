#!/usr/bin/env bash
# Prints {"date", "dow", "hhmm", "anytypeUp"} for the journal gate. Liveness only: any HTTP
# response from the Anytype local API (even 401) counts as up; no API key is sent.
set -uo pipefail

PORT="${ANYTYPE_API_PORT:-31009}"
code=$(curl -s -o /dev/null -m 3 -w '%{http_code}' "http://127.0.0.1:$PORT/" 2>/dev/null)
up=false
[[ "$code" != "000" && -n "$code" ]] && up=true

TZ=America/Los_Angeles date +"{\"date\":\"%F\",\"dow\":%u,\"hhmm\":\"%H%M\",\"anytypeUp\":$up}"

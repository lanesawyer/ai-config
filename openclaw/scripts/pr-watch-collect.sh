#!/usr/bin/env bash
# Collects everything the PR watcher script payload needs in one exec call:
# Pacific wall time, the pr-brief.sh result, and (optionally) whether Lane is in a meeting.
# Prints one JSON object on stdout. stderr is discarded because the exec tool merges it into stdout.
set -uo pipefail

SCRIPTS_DIR="${OPENCLAW_SCRIPTS:-$(cd "$(dirname "$0")" && pwd)}"
PR_BRIEF="${PR_BRIEF:-$SCRIPTS_DIR/pr-brief.sh}"
CAL_NOW="${CAL_NOW:-$SCRIPTS_DIR/cal-now}"

now=$(TZ=America/Los_Angeles date +'{"date":"%F","dow":%u,"hhmm":%H%M}' | sed 's/"hhmm":0*\([0-9]\)/"hhmm":\1/')

brief_raw=$("$PR_BRIEF" 2>/dev/null)
if jq -e 'type == "object"' >/dev/null 2>&1 <<<"$brief_raw"; then
  brief=$(jq -c 'del(.unreadNotifications, .notificationsStatus)' <<<"$brief_raw")
else
  brief=$(jq -n --arg s "$(head -n1 <<<"$brief_raw")" '{status: $s}')
fi

calendar=null
if [[ -x "$CAL_NOW" ]]; then
  cal_raw=$("$CAL_NOW" 2>/dev/null)
  jq -e 'type == "object"' >/dev/null 2>&1 <<<"$cal_raw" && calendar="$cal_raw"
fi

jq -cn --argjson now "$now" --argjson brief "$brief" --argjson calendar "$calendar" \
  '{now: $now, brief: $brief, calendar: $calendar}'

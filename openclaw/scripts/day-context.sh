#!/usr/bin/env bash
# Prints Pacific-time date facts that automation prompts otherwise make the model work out:
# today/tomorrow, weekday flags, the journal title with an ordinal day, and the email lookback.
set -euo pipefail

export TZ=America/Los_Angeles
NOW="${DAY_CONTEXT_NOW:-now}"

day=$((10#$(date -d "$NOW" +%d)))
case $day in
  11|12|13) suffix=th ;;
  *1) suffix=st ;;
  *2) suffix=nd ;;
  *3) suffix=rd ;;
  *) suffix=th ;;
esac

dow=$(date -d "$NOW" +%u)
week=$(for i in 1 2 3 4 5 6 7; do date -d "$NOW +$i day" +%F; done | jq -R . | jq -cs .)

jq -cn \
  --arg today "$(date -d "$NOW" +%F)" \
  --arg tomorrow "$(date -d "$NOW +1 day" +%F)" \
  --arg weekday "$(date -d "$NOW" +%A)" \
  --arg time "$(date -d "$NOW" +%H:%M)" \
  --arg title "$(date -d "$NOW" +%B) ${day}${suffix}, $(date -d "$NOW" +%Y)" \
  --argjson dow "$dow" \
  --argjson week "$week" \
  '{
    today: $today, tomorrow: $tomorrow, weekday: $weekday, time: $time,
    isWeekend: ($dow >= 6), isMonday: ($dow == 1),
    journalTitle: $title,
    emailQuery: (if $dow == 1 then "in:inbox after:3d" else "in:inbox after:1d" end),
    next7Days: $week
  }'

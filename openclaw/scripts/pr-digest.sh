#!/usr/bin/env bash
# Runs pr-brief.sh once and pre-sorts it into the buckets the morning brief and journal prompts use,
# so the model formats instead of filtering. Passes a "STATUS: ..." line through unchanged.
# Reads pr-brief JSON from stdin instead when given `-` (used by tests).
set -uo pipefail

SCRIPTS_DIR="${OPENCLAW_SCRIPTS:-$(cd "$(dirname "$0")" && pwd)}"
STALE_DAYS="${STALE_DAYS:-14}"

if [[ "${1:-}" == "-" ]]; then
  raw=$(cat)
else
  raw=$("${PR_BRIEF:-$SCRIPTS_DIR/pr-brief.sh}" 2>/dev/null)
fi

if ! jq -e 'type == "object"' >/dev/null 2>&1 <<<"$raw"; then
  head -n1 <<<"$raw"
  exit 0
fi

jq -c --argjson staleDays "$STALE_DAYS" --arg now "${PR_DIGEST_NOW:-$(date -u +%FT%TZ)}" '
  ($now | fromdateiso8601) as $nowS
  | def fresh: (($nowS - (.updatedAt | fromdateiso8601)) / 86400) < $staleDays;
  def slim: {repo, number, title, url};
  [.reviewRequested[] | select(.isDraft | not)] as $rr
  | {
    notificationsStatus,
    reviewRequests: [$rr[] | select(fresh) | slim + {author}],
    staleReviewRequests: ([$rr[] | select(fresh | not)] | length),
    needsMe: [.myPRs[]
      | select(.ci == "FAILURE" or .reviewDecision == "CHANGES_REQUESTED" or .unresolvedThreadsAwaitingMe > 0)
      | slim + {ci, reviewDecision, unresolvedThreadsAwaitingMe}],
    waitingOnOthers: [.myPRs[]
      | select((.isDraft | not) and .ci == "SUCCESS"
               and (.reviewDecision == null or .reviewDecision == "REVIEW_REQUIRED")
               and .unresolvedThreadsAwaitingMe == 0)
      | slim],
    drafts: ([.myPRs[] | select(.isDraft)] | length),
    notifications: {
      unread: (.unreadNotifications | length),
      byReason: (.unreadNotifications | group_by(.reason) | map({key: .[0].reason, value: length}) | from_entries),
      top: [.unreadNotifications[] | select(.reason == "mention" or .reason == "team_mention" or .reason == "assign")
            | {reason, repo, title, url}][:8]
    }
  }' <<<"$raw"

#!/usr/bin/env bash
# Lists Lane's PRs merged in the last N days (default 7) as compact JSON for the impact-log draft.
# One GitHub search request, no retries. Prints a "STATUS: ..." line on failure, like pr-brief.sh.
set -uo pipefail

DAYS="${1:-7}"
since=$(date -d "$DAYS days ago" +%F)

if ! out=$(gh search prs --author=@me --merged --merged-at=">=$since" --limit 50 \
    --json number,title,url,repository,closedAt,body 2>&1); then
  if grep -qiE 'rate limit|abuse|secondary' <<<"$out"; then
    echo "STATUS: RATE_LIMITED (GitHub rate limit; token is fine)"
  elif grep -qiE 'bad credentials|401|not logged|authentication' <<<"$out"; then
    echo "STATUS: AUTH_INVALID (run: gh auth refresh -h github.com)"
  else
    echo "STATUS: ERROR ($(head -c 200 <<<"$out" | tr '\n' ' '))"
  fi
  exit 0
fi

jq -c --arg since "$since" '{
  since: $since,
  merged: [.[] | {
    repo: .repository.nameWithOwner, number, title, url,
    mergedOn: (.closedAt[:10]),
    body: ((.body // "") | gsub("<!--[\\s\\S]*?-->"; "") | gsub("\\s+"; " ") | .[:600])
  }] | sort_by(.mergedOn)
}' <<<"$out"

---
name: plan-day
description: 'Summarize GitHub notifications and open PRs into a prioritized daily work list. Use when: planning the day, checking what needs attention, morning standup prep, what should I work on.'
---

# Plan Day

Produce a prioritized bullet list of things that need attention today, pulled from GitHub.

## Step 1: Fetch data in parallel

Use the GitHub MCP tools to fetch all of the following simultaneously:

1. **Review requests** — PRs where you've been asked to review (search: `is:pr is:open draft:false review-requested:@me -author:app/dependabot`)
2. **Your open non-draft PRs** — (`is:pr is:open is:unmerged draft:false author:@me sort:updated-desc`)
3. **Your draft PRs** — (`is:pr is:open draft:true author:@me sort:updated-desc`)
4. **Recent activity** — issues/PRs involving you recently (`is:open involves:@me updated:>DATE` where DATE is 2 weeks ago)

Note: There is no bulk notifications list tool available — skip that step.

## Step 2: Build the priority list

Output a single prioritized list using this ordering:

### 🔴 Review requests
PRs where you've been explicitly requested as a reviewer. For each:
- `[REPO#NUMBER] Title` — link to the PR
- Author and how long it's been open

### 🟡 Your open PRs (ready for merge)
Non-draft PRs you authored that are still open. Split into two groups:

**Recent** (updated in the last 30 days):
- `[REPO#NUMBER] Title` — link to the PR
- How long it's been open, comment count

**Stale** (not updated in 30+ days) — list briefly, flag as candidates to close or nudge.

### ⚪ Your draft PRs
Draft PRs you authored. For each:
- `[REPO#NUMBER] Title` — link to the PR
- Brief note on what's in progress

### 📬 Other activity
From the `involves:@me` search: mentions, issue assignments, or anything else not already covered above. Group by repo. Skip bot noise (Dependabot, automated releases) unless they require action.

## Step 3: Call out blockers

After the list, add a short "Blockers / needs action" section for anything that is explicitly blocked on someone else or needs a decision before you can proceed.

## Notes

- If a section is empty, omit it.
- Keep descriptions to one line per item — this is a scan list, not a summary.
- Use the actual PR/issue URLs so items are clickable.

---
name: impact-log
description: 'Append an accomplishment, framed as impact, to the Anytype page titled "Impact Log" for perf reviews and promo packets. Use when: logging an accomplishment, updating the impact log, recording impact, capturing what I shipped this week.'
argument-hint: 'A short description of what was accomplished (optional; if omitted, derived from recent merged PRs / git history)'
---

# Impact Log

Append a dated, impact-framed entry to the Anytype page titled **Impact Log**.

> Requires an Anytype MCP server (e.g. [anyproto/anytype-mcp](https://github.com/anyproto/anytype-mcp)). If no Anytype MCP tools are available, stop and tell the user to configure the server first — do not fall back to a local file.

## Step 1: Determine the entry

- If the user described an accomplishment, use that.
- Otherwise, derive it from GitHub activity — this is the reliable source regardless of which local directory Claude is running from:
  1. Run `gh search prs --author="@me" --state=merged --sort=updated --order=desc --limit=50` to find recently merged PRs. If that fails, try `gh pr list --author="@me" --state=merged --limit=50`.
  2. `git log --author` is a weak fallback only if `gh` is unavailable AND Claude happens to be inside a relevant repo — don't rely on it (e.g. when running from a top-level folder like `~/dev` that isn't itself a git repo).
  3. Summarize the PRs as candidate entries and confirm with the user before logging.
  > If `gh search prs` doesn't support a `--merged-after` flag on the installed version, filter by checking dates in the output.

## Step 2: Frame as impact, not activity

Lead with the outcome, not the task. Capture, where known:
- **What changed** and the scope (users, systems, team affected)
- **Why it mattered** — the problem solved or risk reduced
- **Evidence** — metric, PR link, or ticket

"Cut checkout p95 latency 40% by reworking the discount lookup (PROJ-812)" beats "worked on checkout performance."

## Step 3: Locate the Impact Log page

Using the Anytype MCP tools (names below are the anyproto server's; if the configured server differs, discover the equivalents from the tool list):

1. `get_spaces` — select the space named **"Knowledge Base"**. If it isn't found, ask which space to use rather than guessing.
2. `search_space` within that space for an object named **"Impact Log"**. Match exactly; if multiple match, ask. If none exists, tell the user and offer to create it with `create_object`.
3. `get_object_content` (or `export_object` to markdown) to read the current `body`.

## Step 4: Append the entry

The API has no append-a-block primitive, so append by rewriting the markdown `body`: take the current content, add the new entry under a `## <Month Year>` heading (create the heading if this is the first entry of the month), and write the full updated `body` back with `update_object` (PATCH `/v1/spaces/:space_id/objects/:object_id`). Preserve all existing content — never reorder or drop prior entries.

```
## June 2026
- 2026-06-11 — <impact-framed entry> [PR/ticket link]
```

Confirm what was appended and to which space/page.

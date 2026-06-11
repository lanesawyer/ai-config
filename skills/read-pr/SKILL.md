---
name: read-pr
description: 'Resolve a GitHub pull request (from a link, number, or the current branch) and fetch its details, diff, and review threads. Use when: looking up a PR, pulling PR context, fetching a pull request and its comments. Building block for other skills that operate on a PR.'
argument-hint: 'Optional: PR link, org/repo#123, or bare number — defaults to the current branch'
---

# Read PR

Resolve a pull request and fetch everything a caller needs to reason about it. This is a read-only building block — fetch and read, never post or modify. Other skills call it to get PR context.

## Step 1: Resolve the PR

Determine the repo and PR number:
- **Argument given:**
  - Full URL (`https://github.com/org/repo/pull/123`) → parse `org/repo` and `123`
  - Short form (`org/repo#123`) → same
  - Bare number (`123`) → use the current repo's `origin` remote
- **No argument:** find the open PR for the current branch via the GitHub tools. If multiple open PRs match the branch, ask the user which one.

If no PR can be resolved, report that clearly (and ask for a link/number) rather than guessing.

## Step 2: Fetch the PR

Use the GitHub MCP tools to retrieve:
- Title, body/description, author, state, and base/head branches
- The full diff (all changed files)
- Review threads and comments, each with its file/line, author, and **resolved/unresolved** state

## Step 3: Report

Hand back a structured summary the caller can use directly:

```
**<org/repo>#<number>: <title>** (<state>) — @<author>
base `<base>` ← head `<head>`

<one-line description from the PR body>

**Changed files:** <count> (<rough sense of scope>)
**Review threads:** <N unresolved, M resolved> (or "none")
```

Keep the diff and thread details available for the caller — this skill gathers and structures; it does not review, fix, or post anything.

---
name: review-pr
description: 'Review a GitHub pull request from a link or PR number, using the linked Jira ticket and PR body for context. Use when: reviewing a PR, giving feedback on a pull request, code review of someone else''s PR, looking over a PR.'
argument-hint: 'PR link or number (e.g. https://github.com/org/repo/pull/123 or org/repo#123)'
---

# Review PR

Read a pull request and provide a focused code review. This is a **review only** — do not run tests, linters, formatters, or any static analysis. Read the code and reason about it.

**Do not post anything to GitHub** — no review, no comments, no approvals, no status changes. The output is for the user to read and evaluate themselves. Never write to the PR even if it seems convenient.

## Step 1: Read the PR

Follow the `read-pr` skill, passing the argument (link, `org/repo#123`, or number) if one was given. This resolves the PR and fetches its title, body, branches, diff, and review threads.

Skim existing review comments for context so you don't duplicate points already raised.

## Step 2: Get ticket context

Follow the `jira-read-ticket` skill, passing the PR title, body, and branch name so it can extract a Jira key. Use the resulting summary to judge whether the PR actually does what it's supposed to.

If `jira-read-ticket` finds no ticket, rely on the PR body alone for intent. Don't ask the user for a ticket — just note that context came only from the PR description.

## Step 3: Review the code

Read the diff carefully and evaluate:
- **Correctness** — bugs, logic errors, off-by-one, null/undefined handling, race conditions, incorrect edge-case behavior
- **Intent match** — does the change actually satisfy the ticket / PR description? Anything missing or out of scope?
- **Clarity & maintainability** — naming, structure, dead code, needless complexity
- **Reuse & consistency** — duplicated logic, ignoring existing patterns or helpers in the codebase
- **Risk** — security, data integrity, breaking changes, error handling

Read surrounding files when the diff alone doesn't give enough context to judge a change. Do not run any tooling.

## Step 4: Write the review

Output a review organized by severity. Reference findings as `path/to/file.ts:line`.

```
## Review: <PR title> (#<number>)

**Context:** <one line — ticket key + what the PR is meant to do>

### 🔴 Blocking
- `src/foo.ts:42` — <issue and why it matters>

### 🟡 Should fix
- `src/bar.ts:17` — <issue and suggested change>

### 🔵 Nits / optional
- `src/baz.ts:5` — <minor suggestion>

### ✅ Looks good
- <brief note on what's done well, if anything stands out>
```

- Omit any severity section that has no findings.
- If nothing is blocking, say so clearly.
- Do not post anything to GitHub under any circumstances — this is a review for the user to read and evaluate. If they later want it posted, they will explicitly ask.

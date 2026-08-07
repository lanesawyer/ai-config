---
name: conventional-commit
description: 'Craft a conventional commit message from staged changes and get user approval. Returns the message — does not commit or push. Use when: writing a commit message, wording a commit, naming a change.'
argument-hint: 'Optional: Jira ticket (e.g. DT-1234) for the Refs footer'
---

# Conventional Commit

Produce an approved commit message and hand it back to the caller. **This skill does not run `git commit` or `git push`** — the caller owns that, because the commit mechanism differs by workflow (plain `git commit` for `ship`, `gh stack add -Am` for `stacked-prs`).

## Step 1: Craft the commit message

Analyze the change being committed — `git diff --staged`, or `git diff` when the caller stages later (e.g. `gh stack add -A`) — and produce a message following [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<optional scope>): <short description>

<optional body: bullet points of notable changes>

<optional footer: "Refs: TICKET-###" if a ticket is known>
```

**Types**: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `style`, `perf`, `ci`, `build`, `revert`

- Subject line ≤ 72 chars, imperative mood ("add" not "adds")
- Include a `Refs:` footer if a Jira ticket is known
- Present the proposed message and **stop**. Ask: *"Does this commit message look good? Reply with any edits, or 'yes' / 'lgtm' / 'go' to proceed."*
- **This is a hard stop.** Do not return a message, and do not let the caller proceed to commit, until the user explicitly approves.

## Step 2: Return the message

Hand the approved message back to the caller verbatim. Nothing else — no `git commit`, no `git push`.

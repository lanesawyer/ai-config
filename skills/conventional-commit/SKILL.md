---
name: conventional-commit
description: 'Craft a conventional commit message from staged changes, get user approval, then commit and push. Use when: writing a commit message, committing staged changes, pushing a commit.'
argument-hint: 'Optional: Jira ticket (e.g. DT-1234) for the Refs footer'
---

# Conventional Commit

## Step 1: Craft the commit message

Analyze `git diff --staged` and produce a message following [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<optional scope>): <short description>

<optional body: bullet points of notable changes>

<optional footer: "Refs: TICKET-###" if a ticket is known>
```

**Types**: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `style`, `perf`, `ci`, `build`, `revert`

- Subject line ≤ 72 chars, imperative mood ("add" not "adds")
- Include a `Refs:` footer if a Jira ticket is known
- Present the proposed message and **stop**. Ask: *"Does this commit message look good? Reply with any edits, or 'yes' / 'lgtm' / 'go' to proceed."*
- **Do not run `git commit` until the user explicitly approves.** This is a hard stop.

## Step 2: Commit and push

```bash
git commit -m "<approved message>"
git push origin HEAD
```

If the push is rejected (non-fast-forward), report the error — do not force-push.

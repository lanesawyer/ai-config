---
name: ship
description: 'Ship work: validate branch naming (lane/PROJ-###-description), stage changes, craft a conventional commit message, commit, push, and open a GitHub PR using the repo pull_request_template.md. Use when: ship, commit and push, open PR, create pull request, submit work.'
argument-hint: 'Optional: Jira ticket (e.g. DT-1234) and/or brief description of the change'
---

# Ship

End-to-end workflow: branch → commit → push → PR.

## Step 1: Check the branch

Run `git branch --show-current` to get the current branch name.

The branch must match: `lane/<TICKET>-<slug>` or `lane/<slug>` (no ticket).

- If the branch is `main`, `dev`, `staging`, or another protected/default branch, you must create a new branch. **Do not commit to a default branch.**
  - Ask the user only: *"Do you have a Jira ticket for this? If so, what is it? (Enter to skip)"*
  - Derive a slug automatically from the staged diff (e.g. `remove-offset-slice`, `fix-auth-redirect`). Do not ask the user for a slug.
  - Create and switch to the new branch: `git checkout -b lane/<TICKET>-<slug>` (or `lane/<slug>` if no ticket)
  - Push the new branch: `git push origin HEAD`
- If already on a feature branch that lacks a Jira-style ticket, ask the user: *"Do you have a Jira ticket for this? If so, what is it? (Enter to skip)"*
  - If a ticket is provided, rename the branch: `git branch -m lane/<TICKET>-<existing-slug>`
  - Then push the renamed branch: `git push origin HEAD --no-verify`

## Step 2: Review staged/unstaged changes

Run `git status` and `git diff --stat` to understand what's changing. If nothing is staged, run `git add -A` (ask the user first if the diff is large or contains unexpected files).

## Step 3: Craft a conventional commit message

Analyze the diff and produce a commit message following [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<optional scope>): <short description>

<optional body: bullet points of notable changes>

<optional footer: "Refs: TICKET-###" if a ticket is known>
```

**Types**: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `style`, `perf`, `ci`, `build`, `revert`

- Keep the subject line ≤ 72 chars, imperative mood ("add" not "adds")
- Include a `Refs:` footer if a Jira ticket is known
- Present the proposed message to the user and **stop**. Ask: *"Does this commit message look good? Reply with any edits, or 'yes' / 'lgtm' / 'go' to proceed."*
- **Do not run `git commit` until the user explicitly approves.** This is a hard stop — do not infer approval from silence or prior context.

## Step 4: Commit and push

```bash
git commit -m "<approved message>"
git push origin HEAD
```

If the push is rejected (non-fast-forward), report the error — do not force-push.

## Step 5: Open a GitHub PR

1. Look for a PR template at `.github/PULL_REQUEST_TEMPLATE.md` (or `.github/pull_request_template.md`) in the repo root. If found, read it and use it as the PR body structure.
2. Determine the default branch: run `git remote show origin | grep 'HEAD branch'` or check the repo's default branch from context.
3. Use the GitHub tools to create a pull request:
   - **title**: the conventional commit subject line (or a short summary if multiple commits)
   - **body**: fill out the PR template using context from the diff and commit message; if no template exists, write a concise description of what changed and why
   - **base**: the repo's default branch
   - **head**: current branch
4. Report the PR URL to the user.

## Step 6: Transition Jira issue to Code Review

If a Jira ticket was identified (from the branch name or provided by the user):

1. Use the Jira MCP tools to transition the issue to **"In Code Review"** (or the closest equivalent status — check available transitions with `getTransitionsForJiraIssue` if unsure).
2. Confirm the transition to the user.
3. If Jira tools are unavailable, remind the user to manually move the ticket to Code Review.

## Notes

- Never force-push (`--force` / `-f`) without explicit user confirmation.
- Never bypass hooks with `--no-verify` on the final commit (only on branch renames if needed).

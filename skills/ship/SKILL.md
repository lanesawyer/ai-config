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

## Step 3: Commit and push

Follow the `conventional-commit` skill.

## Step 4: Open a GitHub PR

Follow the `github-pr` skill.

## Step 5: Transition Jira issue to Code Review

If a Jira ticket was identified (from the branch name or provided by the user), follow the `jira-transition` skill targeting **"In Code Review"**.

## Notes

- Never force-push (`--force` / `-f`) without explicit user confirmation.
- Never bypass hooks with `--no-verify` on the final commit (only on branch renames if needed).

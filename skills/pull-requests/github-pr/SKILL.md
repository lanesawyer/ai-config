---
name: github-pr
description: 'Open a GitHub pull request for the current branch. Use when: opening a PR, creating a pull request, submitting code for review.'
argument-hint: 'Optional: base branch (defaults to repo default branch)'
---

# GitHub PR

## Procedure

1. Look for a PR template at `.github/PULL_REQUEST_TEMPLATE.md` (or `.github/pull_request_template.md`). If found, use it as the PR body structure.
2. Determine the default branch: run `git remote show origin | grep 'HEAD branch'`.
3. Use the GitHub tools to create the pull request:
   - **title**: the most recent commit subject line (or a short summary if multiple commits)
   - **body**: fill out the PR template from the diff and commit history; if no template exists, write a concise description of what changed and why
   - **base**: the repo's default branch (or the branch provided as an argument)
   - **head**: current branch
4. Report the PR URL to the user.

---
name: create-worktree
description: 'Create a git worktree with a lane/TICKET-description or lane/description branch name. Use when: creating a new worktree, spinning up a new branch workspace.'
argument-hint: 'Branch name or slug; optionally a Jira ticket key prefix (e.g. DT-1234)'
---

# Create Worktree

Create a new git worktree with a correctly named branch.

## Step 1: Build the branch name

You should already have a ticket key and/or a slug from context. If not:
- Ticket key: use what was provided, or none
- Slug: ask *"What are you working on? (brief description for the branch name)"*
  - Lowercase, kebab-case, strip filler words, ≤ 40 chars
  - Example: "Add discount code field to checkout" → `add-discount-code-checkout`

| Has ticket | Branch name pattern |
|---|---|
| Yes | `lane/<TICKET>-<slug>` (e.g. `lane/DT-1234-add-discount-code-checkout`) |
| No  | `lane/<slug>` (e.g. `lane/add-discount-code-checkout`) |

## Step 2: Confirm with the user

Present the branch name: *"Branch: `<branch>` — looks good? (Enter to confirm, or type a correction)"*

Do not proceed until confirmed.

## Step 3: Run the worktree helper

```bash
git worktree-new <branch>
```

If `git worktree-new` is not on PATH, fall back to:

```bash
~/dev/ai-config/bin/git-worktree-new <branch>
```

This creates a sibling worktree directory, copies `.env*` files, symlinks `.npmrc`, installs dependencies, and opens the new worktree in VS Code.

Report the worktree path to the user when done.

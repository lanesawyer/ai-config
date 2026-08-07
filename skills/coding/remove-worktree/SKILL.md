---
name: remove-worktree
description: 'Remove a git worktree and clean up its directories. Use when: removing a worktree, cleaning up a finished branch workspace.'
argument-hint: 'Worktree path or branch name'
---

# Remove Worktree

Remove a git worktree and clean up the empty parent directories left by the `../worktrees/<repo>/<branch>/<repo>` layout.

## Step 1: Identify the worktree path

If the user gives a branch name, resolve it to a path:

```bash
git worktree list
```

## Step 2: Confirm with the user

Present the path to be removed: *"Remove worktree at `<path>`? This cannot be undone."*

Do not proceed until confirmed. Note: the branch is NOT deleted unless `--delete-branch` is passed — the user keeps their code.

## Step 3: Run the remove helper

```bash
git worktree-rm <path>
```

If `git worktree-rm` is not on PATH, fall back to the script via its installed symlink (location-independent):

```bash
~/.agents/skills/remove-worktree/scripts/git-worktree-rm <path>
```

This removes the worktree, cleans up empty parent directories, and optionally deletes the branch with `--delete-branch`.

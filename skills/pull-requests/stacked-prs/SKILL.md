---
name: stacked-prs
description: 'Split a large change into a stack of dependent GitHub pull requests using the gh stack CLI extension — plan layers, submit linked PRs, rebase mid-stack, and merge bottom-up. Use when: stacked PRs, gh stack, splitting a big PR into smaller reviewable pieces, dependent pull requests, stacking branches.'
argument-hint: 'Optional: Jira ticket (e.g. DT-1234) and/or a description of the change to split into layers'
---

# Stacked PRs

Ship a large change as a chain of small, dependent pull requests using GitHub's native stacked PRs (`gh stack`). Each layer targets the branch below it, so reviewers see only that layer's diff.

## Constraints

- **All branches must live in the same repository.** Cross-fork stacks are not supported — if you only have fork access, stop and use a single PR instead.
- The stack's **trunk** is usually the repo default branch, but can be any branch (a release branch, or another PR's branch).
- The `gh stack` extension is in public preview, so flags can shift. `gh stack <command> --help` is authoritative — prefer it over this file if they disagree.

## Step 1: Plan the layers

Do this before touching git. Present the plan to the user and get confirmation.

The one rule that makes a stack valid: **if code in one layer depends on code in another, the dependency must be in the same layer or a lower one.** Circular dependencies between layers cannot be expressed in a stack.

Order bottom-up:

1. Foundational, dependency-free changes — shared types, db schema/migrations, config
2. Core logic that uses them — services, API routes
3. Consumers — UI components, CLI surfaces
4. Anything optional or contentious — put it at the top so it can't block the layers below

Split at a **change of concern** (backend → frontend, logic → tests) or when a layer is getting large. Prefer more small layers over fewer big ones; the whole point is short review queues.

Name each layer with the repo convention plus a layer slug, so ticket detection keeps working:

| Has ticket | Layer branch names |
|---|---|
| Yes | `lane/<TICKET>-<layer-slug>` (e.g. `lane/DT-1234-schema`, `lane/DT-1234-api`, `lane/DT-1234-ui`) |
| No | `lane/<layer-slug>` |

Present the plan as an ordered list of layers with branch name, what goes in it, and why it sits at that height. Do not proceed until the user confirms.

## Step 2: Initialize the stack

From the trunk branch, clean working tree:

```bash
gh stack init lane/<TICKET>-<first-layer-slug>
```

To stack on something other than the default branch:

```bash
gh stack init -b <trunk-branch> lane/<TICKET>-<first-layer-slug>
```

`gh stack init` with no branch argument prompts for the name. You can also pass several branch names at once to lay out the whole stack up front.

## Step 3: Build each layer

Work on the current layer, then commit it. Get the message by following the `conventional-commit` skill — it returns an approved message without committing, so the commit happens here, scoped to this layer.

```bash
git add <paths>
git commit -m "<approved message>"
```

Then add the next layer on top:

```bash
gh stack add lane/<TICKET>-<next-layer-slug>
```

Shorthand that stages everything, commits, and creates the next branch in one step — still get the message from `conventional-commit` first:

```bash
gh stack add -Am "<approved message>" lane/<TICKET>-<next-layer-slug>
```

Repeat until every planned layer exists. Keep each layer independently buildable — a layer whose tests fail on its own will show red checks on its own PR, and mid-stack PRs run CI just like the bottom one.

## Step 4: Submit the stack

```bash
gh stack submit
```

This pushes the branches, then creates or updates one PR per layer with the correct base branch and links them into a stack. Re-run it after any change to the stack — it updates existing PRs rather than duplicating them.

Useful flags:
- `--open` — open the PRs in the browser afterward
- `--auto` — skip the interactive prompts (non-interactive/scripted runs)

`gh stack push` pushes branches without touching PRs; `submit` normally covers both.

Then confirm the shape:

```bash
gh stack view          # full stack with PR numbers and status
gh stack view --short   # compact
gh stack view --json    # machine-readable, for reporting back
```

Report each layer's PR URL to the user, bottom to top.

## Step 5: Navigate and revise

Move between layers instead of `git checkout`, so tracking stays intact:

```bash
gh stack down [n]    # toward the trunk
gh stack up [n]      # away from the trunk
gh stack bottom
gh stack top
gh stack trunk
gh stack switch      # interactive picker
gh stack checkout <stack-number | pr-number | pr-url | branch>
```

To fix something in a **mid-stack** layer:

1. `gh stack checkout <branch>` (or `gh stack down`) to land on that layer
2. Commit the fix there — the layer that owns the code, not the top of the stack
3. Cascade the change into the layers above:
   ```bash
   gh stack rebase --upstack
   ```
4. `gh stack submit` to update the PRs

To restructure the stack itself — reorder, drop, or re-parent layers — use:

```bash
gh stack modify
```

## Step 6: Keep the stack current

When the trunk has moved on:

```bash
gh stack sync
```

One command: fetch, cascading rebase, push, and sync PR state on GitHub. Add `--prune` to clean up branches whose PRs are merged or closed.

`gh stack rebase` is the narrower tool when you want to control scope:
- `--downstack` — this layer and everything below
- `--upstack` — this layer and everything above
- `--no-trunk` — don't pull the trunk in first

**On conflicts:** the rebase stops on the conflicting layer. Resolve the files, `git add` them, then:

```bash
gh stack rebase --continue
```

Or back out entirely with `gh stack rebase --abort`. Never resolve a stack conflict by force-pushing a single branch by hand — that desyncs the stack. Use `--continue`/`--abort` and let the extension re-push.

## Step 7: Merge bottom-up

Stacks merge from the bottom. GitHub handles the rest server-side: when a layer merges, the layers above are automatically rebased and retargeted onto the new base.

```bash
gh stack merge                    # merge what's ready, from the bottom
gh stack merge <pr-number>        # merge up to and including this layer
```

Merging a mid-stack PR also merges everything below it. Layers above stay open and retarget themselves.

Merge method flags: `--squash`, `--merge`, `--rebase`, or `--merge-method <method>`. Match the repo's configured method — check the repo settings rather than assuming squash. `-y`/`--yes` skips confirmation; only use it when the user has already approved the merge.

Branch protection, CODEOWNER approvals, required checks, and merge queues are enforced on **every** layer, mid-stack included. If a merge is blocked, read the merge box on that specific PR — the blocker is per-layer.

After the stack is fully merged:

```bash
gh stack sync --prune
gh stack unstack          # drop local tracking and unstack on GitHub (--local to keep GitHub as-is)
```

## Step 8: Transition the Jira ticket

If a ticket is known (from the branch names or the user), follow the `jira-transition` skill targeting **"In Code Review"** once the stack is submitted.

## Adopting existing PRs into a stack

If open PRs already form a logical chain in the same repo, link them without local tracking:

```bash
gh stack link <branch-or-pr> <branch-or-pr> [...]
gh stack link --base <trunk-branch> <branch-or-pr> <branch-or-pr>
```

Order the arguments bottom to top. GitHub also surfaces a "convert to stack" recommendation on the PRs themselves.

## Rules

- Never hand-edit a PR's base branch on a stacked PR — `gh stack` owns the targeting.
- Never force-push an individual layer branch. Use `gh stack rebase` / `gh stack sync`.
- Don't merge out of order or via the plain web merge button on a mid-stack PR when lower layers are unmerged.
- Put fixes in the layer that owns the code, then `gh stack rebase --upstack`. Patching at the top hides the fix from the reviewer of the layer it belongs to.
- Review feedback on a single layer: follow the `address-pr-comments` skill on that layer's branch, then `gh stack submit`.

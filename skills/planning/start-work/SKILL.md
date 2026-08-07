---
name: start-work
description: 'Start work on a new task: read a Jira ticket, create a git worktree with a properly named branch, produce a coding plan, and move the ticket to In Progress. Use when: starting a new task, picking up a ticket, beginning a feature, start work, new worktree.'
argument-hint: 'Optional: Jira ticket number (e.g. DT-1234)'
---

# Start Work

Full workflow to go from a ticket (or description) to a ready-to-code workspace with a plan.

## Step 1: Claim the ticket

If a Jira ticket was provided (or can be inferred from context):
- Read the ticket by following the `jira-read-ticket` skill
- Follow the `jira-transition` skill targeting **"In Progress"** — this also assigns the ticket to you if it's unassigned
- Derive a short kebab-case slug from the ticket summary:
  - Lowercase, strip filler words, replace spaces with hyphens
  - Keep it ≤ 40 chars (e.g. "Add discount code field to checkout" → `add-discount-code-checkout`)

If no ticket, ask: *"What are you working on? (brief description for the branch name)"* and derive the slug from the answer.

## Step 2: Create the worktree (if needed)

Check whether Claude is already running inside a linked worktree:

```bash
git rev-parse --git-dir
git rev-parse --git-common-dir
```

If the two outputs differ, you are already in a linked worktree — skip to Step 3.

If they are the same (main checkout), follow the `create-worktree` skill, passing the ticket key (if any) and the derived slug as context for the branch name.

## Step 3: Produce a coding plan

Follow the `plan-work` skill using the ticket (or the user's description) fetched in Step 1.

## Step 4: Hand off to the user

Present the coding plan. If a new worktree was created in Step 2, also share the worktree path. If already in a worktree, just confirm the branch and present the plan.

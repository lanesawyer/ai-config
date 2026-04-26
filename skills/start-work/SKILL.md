---
name: start-work
description: 'Start work on a new task: read a Jira ticket, create a git worktree with a properly named branch, produce a coding plan, and move the ticket to In Progress. Use when: starting a new task, picking up a ticket, beginning a feature, start work, new worktree.'
argument-hint: 'Optional: Jira ticket number (e.g. DT-1234)'
---

# Start Work

Full workflow to go from a ticket (or description) to a ready-to-code workspace with a plan.

## Step 1: Claim the ticket

If a Jira ticket was provided (or can be inferred from context):
- Fetch the full ticket using the `getJiraIssue` MCP tool
- Assign the ticket to yourself using `atlassianUserInfo` to get your account ID, then `editJiraIssue` to set the assignee
- Follow the `jira-transition` skill targeting **"In Progress"**
- Derive a short kebab-case slug from the ticket summary:
  - Lowercase, strip filler words, replace spaces with hyphens
  - Keep it ≤ 40 chars (e.g. "Add discount code field to checkout" → `add-discount-code-checkout`)

If no ticket, ask: *"What are you working on? (brief description for the branch name)"* and derive the slug from the answer.

## Step 2: Create the worktree

Follow the `create-worktree` skill, passing the ticket key (if any) and the derived slug as context for the branch name.

## Step 3: Produce a coding plan

Follow the `plan-ticket` skill using the ticket (or the user's description) fetched in Step 1.

## Step 4: Hand off to the user

Confirm that the worktree is ready, share the worktree path, and present the coding plan. The user will open the worktree in their editor of choice and continue in this session.

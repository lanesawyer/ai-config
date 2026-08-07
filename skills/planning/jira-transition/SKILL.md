---
name: jira-transition
description: 'Transition a Jira issue to a new status using MCP tools. Use when: moving a ticket to In Progress, In Code Review, Done, or any other status.'
argument-hint: 'Jira ticket (e.g. DT-1234) and target status (e.g. "In Code Review")'
---

# Jira Transition

## Procedure

1. Identify the ticket — from the argument, the current branch name (`lane/<TICKET>-<slug>`), or ask the user.
2. Check assignment with `getJiraIssue` — if the issue is unassigned, assign it to the current user:
   - Get the current user's account ID with `atlassianUserInfo`.
   - Call `editJiraIssue` to set the `assignee` to that account ID.
   - If the issue is already assigned (to anyone), leave it unchanged.
3. Use `getTransitionsForJiraIssue` to fetch available transitions for the ticket.
4. Find the transition that best matches the requested target status (case-insensitive, partial match is fine).
5. Call `transitionJiraIssue` with the matching transition ID.
6. Confirm the transition (and assignment, if changed) to the user.

If Jira MCP tools are unavailable, remind the user to move the ticket manually.

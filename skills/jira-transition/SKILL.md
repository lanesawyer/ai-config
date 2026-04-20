---
name: jira-transition
description: 'Transition a Jira issue to a new status using MCP tools. Use when: moving a ticket to In Progress, In Code Review, Done, or any other status.'
argument-hint: 'Jira ticket (e.g. DT-1234) and target status (e.g. "In Code Review")'
---

# Jira Transition

## Procedure

1. Identify the ticket — from the argument, the current branch name (`lane/<TICKET>-<slug>`), or ask the user.
2. Use `getTransitionsForJiraIssue` to fetch available transitions for the ticket.
3. Find the transition that best matches the requested target status (case-insensitive, partial match is fine).
4. Call `transitionJiraIssue` with the matching transition ID.
5. Confirm the transition to the user.

If Jira MCP tools are unavailable, remind the user to move the ticket manually.

---
name: jira-transition
description: 'Transition a Jira issue to a new status using the Atlassian CLI (acli). Use when: moving a ticket to In Progress, In Code Review, Done, or any other status.'
argument-hint: 'Jira ticket (e.g. DT-1234) and target status (e.g. "In Code Review")'
---

# Jira Transition

Requires the official Atlassian CLI (`acli`), signed in with `acli jira auth login`. If `acli` is missing or `acli jira auth status` shows no account, tell the user to install it or sign in (or to move the ticket manually) and stop.

## Procedure

1. Identify the ticket — from the argument, the current branch name (`lane/<TICKET>-<slug>`), or ask the user.
2. Check the current assignee and status:
   ```bash
   acli jira workitem view <KEY> --fields assignee,status --json
   ```
   If the issue is unassigned, assign it to the current user. If it's already assigned (to anyone), leave it unchanged.
   ```bash
   acli jira workitem assign --key <KEY> --assignee "@me" --yes
   ```
3. Transition it by status name:
   ```bash
   acli jira workitem transition --key <KEY> --status "<Target Status>" --yes
   ```
   Use the workflow's status name with its usual capitalization (e.g. "In Progress", "In Code Review", "Done"). Skip this step if the ticket is already in that status. If `acli` rejects the status, report its error and the ticket's current status, and ask the user for the exact name rather than guessing.
4. Confirm the transition (and assignment, if changed) to the user.

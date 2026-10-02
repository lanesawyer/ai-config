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
3. Map the requested status to the workflow's status name. Other skills ask for generic names, but the DT and ABC projects use their own:

   | Requested | Workflow status |
   |---|---|
   | In Progress | `DEVELOPMENT` |
   | In Code Review | `CODE REVIEW` |
   | Done | `Done` |

   If the ticket is already in the target status, skip to step 5.
4. Transition it by status name and check the result. `acli` exits 0 even when the transition fails, so read `successCount` and `results[].message` from the JSON:
   ```bash
   acli jira workitem transition --key <KEY> --status "<Workflow Status>" --yes --json
   ```
   On `"No allowed transitions found for given status"`, list the statuses the project uses and retry once with the clear match:
   ```bash
   acli jira workitem search --jql "project = <PROJECT> AND updated >= -180d" --fields status --limit 500 --json | jq -r '.[].fields.status.name' | sort | uniq -c
   ```
   If nothing clearly matches, or the retry fails too, report the error and the ticket's current status and ask the user for the exact name. Don't guess. The workflow may also not allow a direct move from the current status.
5. Confirm the transition (and assignment, if changed) to the user.

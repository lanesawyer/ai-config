---
name: jira-read-ticket
description: 'Fetch a Jira ticket via the Atlassian MCP and summarize its intent and acceptance criteria. Use when: reading a Jira ticket, pulling ticket context, looking up a ticket''s details, getting acceptance criteria. Building block for other skills that need ticket context.'
argument-hint: 'Jira ticket key (e.g. DT-1234), or text/branch/PR to extract one from'
---

# Jira Read Ticket

Fetch a Jira ticket and produce a concise, structured summary of its intent. This is a building block — other skills call it whenever they need ticket context.

## Step 1: Resolve the ticket key

Find a Jira key (e.g. `DT-1234`, `PROJ-567` — typically uppercase letters, a hyphen, and digits) from, in order of preference:
- An explicit key passed as the argument
- The provided text (PR title/body, branch name, commit message, user message)

If no key is found, report that no ticket could be identified and stop — let the caller decide how to proceed (ask the user, fall back to other context, etc.). Do not invent or guess a key.

## Step 2: Fetch the ticket

Retrieve the full issue with the `getJiraIssue` MCP tool. Capture:
- Summary (title) and current status
- Description
- Acceptance criteria
- Linked issues and any comments or attachments worth noting

If the fetch fails (no access, bad key), report that clearly rather than fabricating details.

## Step 3: Summarize

Output a brief, structured summary the caller can use directly:

```
**<KEY>: <summary>** (<status>)

<2–4 sentence plain-English description of the goal>

**Acceptance criteria:**
- <criterion> (or "none stated")

**Notes:** <constraints, dependencies, linked tickets — omit if none>
```

Keep it tight. The point is shared, reliable ticket context, not a transcript of the ticket.

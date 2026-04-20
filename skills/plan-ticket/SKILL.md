---
name: plan-ticket
description: 'Read a Jira ticket and produce a concrete coding plan: file locations, implementation steps, and edge cases. Use when: planning work on a ticket, breaking down implementation, figuring out where to start coding.'
argument-hint: 'Jira ticket key (e.g. DT-1234)'
---

# Plan Ticket

Read a Jira ticket in full and produce a concrete, actionable coding plan.

## Step 1: Fetch the ticket

Use `getJiraIssue` to retrieve the full ticket — summary, description, acceptance criteria, linked issues, and any attachments or comments worth noting.

If no ticket is available, ask the user to describe the work and skip to Step 2.

## Step 2: Summarize what needs to be done

Write a brief (3–5 sentence) plain-English summary of the goal. Include:
- What the user/system should be able to do after this is complete
- Any explicit acceptance criteria from the ticket
- Known constraints or dependencies

## Step 3: Explore the codebase

Search the codebase to understand where the change lives:
- Find relevant files, modules, and entry points
- Identify existing patterns to follow (naming, structure, tests)
- Note any related code that may need updating (e.g. types, routes, tests, migrations)

## Step 4: Produce the coding plan

Output a numbered implementation plan. Each step should be:
- Specific enough to act on immediately (file name + what changes)
- Ordered so each step builds on the last
- Explicit about any new files to create vs. existing files to edit

Example format:
```
1. Edit `src/checkout/DiscountField.tsx` — add controlled input for discount code
2. Update `src/checkout/checkoutSlice.ts` — add `discountCode` to state and a `setDiscountCode` action
3. Edit `src/api/checkout.ts` — pass `discountCode` in the order payload
4. Add `src/checkout/DiscountField.test.tsx` — unit tests for input validation
```

## Step 5: Call out risks and open questions

List any:
- Edge cases the ticket doesn't address
- Ambiguities that need product/design clarification before coding
- Performance or security considerations

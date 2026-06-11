---
name: plan-work
description: 'Produce a concrete coding plan from a Jira ticket or a plain description: file locations, implementation steps, and edge cases. Use when: planning work, breaking down implementation, figuring out where to start coding.'
argument-hint: 'Jira ticket key (e.g. DT-1234) or a description of the work'
---

# Plan Work

Produce a concrete, actionable coding plan from a ticket or a plain description of the work.

## Step 1: Understand the goal

If a Jira ticket is available, follow the `jira-read-ticket` skill to fetch and summarize it.

Otherwise, use the user's description of the work. If it's too vague to plan from, ask a clarifying question. Write a brief summary of the goal before continuing.

## Step 2: Explore the codebase

Search the codebase to understand where the change lives:
- Find relevant files, modules, and entry points
- Identify existing patterns to follow (naming, structure, tests)
- Note any related code that may need updating (e.g. types, routes, tests, migrations)

## Step 3: Produce the coding plan

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

## Step 4: Call out risks and open questions

List any:
- Edge cases the ticket doesn't address
- Ambiguities that need product/design clarification before coding
- Performance or security considerations

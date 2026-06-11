---
name: write-design-doc
description: 'Author a technical design doc / RFC from a problem statement or Jira ticket, grounded in the actual codebase. Use when: writing a design doc, drafting an RFC, proposing a technical approach, documenting a system design before building.'
argument-hint: 'A problem statement or Jira ticket key (e.g. DT-1234)'
---

# Write Design Doc

Produce a technical design doc / RFC grounded in the real codebase, with the trade-offs and open questions made explicit.

## Step 1: Gather context

Establish the problem, constraints, and stakeholders.

- If a Jira ticket is provided, follow the `jira-read-ticket` skill to pull intent and acceptance criteria.
- Otherwise use the user's problem statement. If it's too vague to design from, ask one or two clarifying questions before continuing.

Write a one-paragraph problem statement and confirm it captures the goal.

## Step 2: Ground the design in code

Explore the codebase so the design reflects reality, not assumptions:
- Affected modules, entry points, and the current behavior being changed
- Existing patterns and abstractions the design should reuse or extend
- Constraints the current architecture imposes (data models, interfaces, deploy boundaries)

## Step 3: Draft the doc

Output a single markdown doc with this skeleton. Omit a section only if genuinely not applicable.

```
# <Title>

## Problem
What's broken or missing, and why it matters now.

## Goals & non-goals
Explicit in-scope outcomes; explicit out-of-scope items.

## Proposed approach
The design. Reference concrete files/modules (`path:line`). Include a diagram or
data-flow sketch if it clarifies.

## Alternatives considered
Each alternative with why it was rejected. At least one.

## Risks & trade-offs
What this approach costs, what could go wrong, blast radius.

## Rollout & testing
Sequencing, feature flags/migrations, how it gets verified.

## Open questions
Unresolved decisions, ordered by how much they block progress.
```

## Step 4: Surface the open questions

After the doc, restate the open questions as a short list for the user to resolve, flagging which ones block starting implementation. Do not paper over a real decision with a guess.

---
name: decompose-epic
description: 'Break a large initiative into sequenced, independently-shippable tickets and milestones. Use when: decomposing an epic, breaking down a large project, planning a multi-ticket initiative, sequencing work across milestones.'
argument-hint: 'An initiative description or a parent Jira ticket key (e.g. DT-1234)'
---

# Decompose Epic

Turn a large initiative into a sequenced set of discrete, independently-shippable tickets. This is the altitude above `plan-work` — it produces the tickets; `plan-work`/`start-work` then plan each one.

## Step 1: Establish the goal and scope

- If a parent Jira ticket is provided, follow the `jira-read-ticket` skill to pull its intent and scope.
- Otherwise use the user's description. If the desired end state is unclear, ask before decomposing.

State the initiative's goal and what "done" looks like in one paragraph.

## Step 2: Identify workstreams and dependencies

Explore the codebase enough to ground the breakdown in reality. Then:
- Group the work into workstreams (e.g. data model, API, UI, migration, rollout)
- Map dependencies between them — what must land before what
- Identify the critical path

## Step 3: Propose tickets

Break each workstream into tickets that are **independently shippable** and small enough to fit a few days. For each:

```
- <Proposed title>
  Scope: one-line description of what it delivers.
  Size: S / M / L (rough).
  Depends on: <other ticket(s)>, or "none".
```

Prefer vertical slices that deliver value over horizontal layers that don't ship alone.

## Step 4: Sequence into milestones

Order the tickets into milestones along the critical path. Output:
- A milestone-ordered list of the tickets
- A short dependency/sequencing note calling out anything that can be parallelized
- Risks or unknowns that should be spiked before committing to estimates

Ticket creation in Jira is out of scope — this produces the plan. Mention creating the tickets as the manual follow-up.

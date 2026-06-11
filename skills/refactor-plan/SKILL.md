---
name: refactor-plan
description: 'Sequence a large, multi-step refactor into small, independently-shippable, green-to-green steps behind a test safety net. Use when: planning a big refactor, restructuring a module safely, breaking a risky change into steps, migrating a pattern across a codebase.'
argument-hint: 'The target module/pattern and the desired end state'
---

# Refactor Plan

Produce an ordered, low-risk plan for a large refactor — small steps that each keep the suite green and could ship on their own. This plans the refactor; it does not make the changes.

## Step 1: Define start and end state

State precisely what's being refactored and the desired end shape. If the target or end state is ambiguous, ask before planning.

## Step 2: Map the blast radius

Explore the codebase to find everything the refactor touches:
- All call sites, implementers, and consumers of the code being changed
- Public API / cross-module boundaries that constrain the change
- Coupled code that moves with it (types, tests, fixtures, docs)

## Step 3: Check the safety net

Assess test coverage over the affected code:
- Where coverage is solid, the refactor can move fast
- Where seams are untested, flag them — characterization tests come **first** (hand off to `write-tests`) so behavior is pinned before it's moved

## Step 4: Sequence the steps

Produce an ordered list of small steps, each **green-to-green** (suite passes before and after) and ideally independently shippable:

```
1. Add characterization tests for <seam> — pins current behavior.
2. Introduce <new abstraction> alongside the old, unused — no behavior change.
3. Migrate <call sites A, B> to the new path — suite stays green.
...
N. Delete the old path once no callers remain.
```

Prefer parallel-change (expand → migrate → contract) over big-bang cutovers.

## Step 5: Call out risk and rollback

Flag the riskiest steps, anything that can't be done incrementally, and the rollback/feature-flag strategy for each risky step. Output the plan only — no code changes.

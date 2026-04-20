---
name: improve-skills
description: 'Review recent skill usage and suggest concrete improvements based on issues, workarounds, or friction encountered. Use when: a skill did not work as expected, after completing a workflow, refining skill instructions.'
argument-hint: 'Optional: specific skill name to focus on (e.g. ship, plan-ticket)'
---

# Improve Skills

Review how a skill (or all skills) performed recently and propose concrete edits to make them better.

## Step 1: Identify the skill(s) to review

- If a specific skill name was provided, focus on that one.
- Otherwise, look at the current conversation history for any skills that were invoked, and review all of them.

## Step 2: Diagnose issues from recent usage

For each skill under review, look for evidence of:

- **Steps that were skipped or reordered** — did the actual execution deviate from the written procedure?
- **Ambiguity** — were there points where you had to guess or ask a clarifying question that the skill should have answered?
- **Missing context** — did the skill assume something about the environment or repo that wasn't true?
- **Tool failures** — did any MCP tool calls fail or return unexpected results that the skill didn't account for?
- **Over-specification** — steps that were too prescriptive and got in the way of a better approach?
- **Under-specification** — steps vague enough that a different run might produce a different result?

## Step 3: Read the current SKILL.md

Load the relevant skill file(s) from `~/dev/ai-config/skills/<name>/SKILL.md`.

## Step 4: Propose specific edits

For each issue identified, propose a concrete diff-style change to the SKILL.md. Be specific:

- Quote the existing text that should change
- Show the replacement text
- One sentence explaining why

Do not suggest wholesale rewrites — prefer targeted, minimal changes that fix the identified issue.

## Step 5: Ask before writing

Present all proposed changes and ask: *"Should I apply these? You can approve all, pick individual ones, or suggest alternatives."*

Only write to disk after explicit approval. Use `replace_string_in_file` for each approved change.

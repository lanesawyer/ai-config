---
name: improve-skills
description: 'Review recent skill usage and suggest concrete improvements based on issues, workarounds, or friction encountered. Use when: a skill did not work as expected, after completing a workflow, refining skill instructions.'
argument-hint: 'Optional: specific skill name to focus on (e.g. ship, plan-work)'
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

## Step 3: Locate the ai-config repo and read the SKILL.md

The repo path is **not** fixed — it may be `~/dev/ai-config`, `~/Dev/ai-config` (macOS), or elsewhere. Resolve it, don't assume:

1. Global skills are symlinked into `~/.agents/skills/`. Resolve the repo from one that exists:
   ```bash
   readlink -f ~/.agents/skills/ship | xargs dirname | xargs dirname
   ```
   That prints `<repo>/skills` → its parent is the repo root.
2. If that fails, **ask the user** for the ai-config path. Do not guess or hardcode.

A skill lives in one of two places under the repo:

- **Global skills:** `<repo>/skills/<name>/SKILL.md`
- **Project-local skills:** `<repo>/.agents/skills/<name>/SKILL.md`

If you don't know which, check both, and edit the file in whichever location holds it.

## Step 4: Propose specific edits

For each issue identified, propose a concrete diff-style change to the SKILL.md. Be specific:

- Quote the existing text that should change
- Show the replacement text
- One sentence explaining why

Do not suggest wholesale rewrites — prefer targeted, minimal changes that fix the identified issue.

## Step 5: Ask before writing

Present all proposed changes and ask: *"Should I apply these? You can approve all, pick individual ones, or suggest alternatives."*

Only write to disk after explicit approval.

## Step 6: Apply the edits

For each approved change, edit the source SKILL.md at the path resolved in Step 3. This works even when you're running from a different repo — you're editing files by absolute path, not the current working directory.

## Step 7: Open a PR in ai-config

You are almost always running this from some other repo, so the `conventional-commit` and `github-pr` skills can't be invoked directly — they operate on the *current* repo and would target the wrong one. **Follow their conventions, but scope every git command to ai-config with `git -C <repo>`.** Let `REPO` be the path resolved in Step 3:

```bash
git -C "$REPO" checkout -b improve-skills/<short-slug>
git -C "$REPO" add <changed SKILL.md paths>
git -C "$REPO" commit -m "<conventional-commit message>"
git -C "$REPO" push -u origin HEAD
```

- **Commit message:** follow the `conventional-commit` skill's format (e.g. `docs(skills): <summary of the improvement>`).
- **PR:** open it against ai-config's default branch with the GitHub tools (head = the branch you just pushed, repo = ai-config's `origin`). Follow the `github-pr` skill for body structure (use ai-config's PR template if present); summarize the friction that prompted each change.

Report the PR URL. Do not switch the user's current working directory or touch the repo they're actually in.

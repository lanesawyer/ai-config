---
name: add-skill
description: 'Scaffold a new skill in this ai-config repo: create the SKILL.md, update the README table and mermaid diagram, then run setup. Use when: adding a new skill, creating a skill, scaffolding a SKILL.md in this repo.'
argument-hint: 'Skill name (kebab-case) and a short description of what it does'
---

# Add Skill

Scaffold a new global skill in this repo and wire it into all the places that must stay in sync. This skill is itself **project-local** — its source lives in `.agents/skills/` (AI-agnostic) and is symlinked into `.claude/skills/`; it is not linked into the global skill set.

## Step 1: Gather the skill details

You need:
- **Name** — kebab-case, matches the directory (e.g. `read-pr`)
- **Description** — the `description:` frontmatter, including the `Use when:` trigger phrases that help the agent know when to invoke it
- **Argument hint** (optional) — what the skill takes as input
- **Building block?** — does it compose other skills, get composed by them, or stand alone?

If any of these are unclear from the request, ask before scaffolding.

## Step 2: Create the SKILL.md

Create `skills/<name>/SKILL.md` (note: the repo's `skills/` dir, **not** `.claude/skills/`, so setup links it globally).

Follow the structure of existing skills:
- YAML frontmatter with `name`, `description`, and optional `argument-hint`
- A title heading and a one-line purpose
- Numbered `## Step N:` sections for the procedure
- Match the voice and concision of the existing skills (imperative, no filler)

If the skill needs helper scripts, put them in `skills/<name>/scripts/` and add a `chmod +x` line for them to `setup` under the "make sure scripts are executable" section.

## Step 3: Update the README table

In `README.md`, add a row to the skills table (`## AI Skills`). Keep the row order sensible — group it near related skills. Mark it as a building block in the description if it's meant to be composed by other skills.

## Step 4: Update the mermaid diagram

In the same README, update the **How the skills relate** mermaid diagram:
- If the skill composes others or is composed, add it to the appropriate `subgraph` (`workflows` or `blocks`) and draw the `-->` edges.
- If it's standalone, add it to the `standalone` subgraph and the prose line below the diagram.

## Step 5: Run setup

Run the setup script so the new skill is installed into `~/.agents/skills/` (and the `~/.claude/skills/` symlink). This skill runs inside the ai-config repo, so resolve the script from the repo root rather than hardcoding a path:

```bash
"$(git rev-parse --show-toplevel)/setup"
```

Confirm the output shows `<name>: linked`.

## Step 6: Summarize

Report what was created and changed:
- The new `skills/<name>/SKILL.md` path
- The README table row and diagram edges added
- Confirmation that setup linked the skill

Remind the user the skill won't appear in an already-running Claude Code session until it's restarted.

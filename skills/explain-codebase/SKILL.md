---
name: explain-codebase
description: 'Map an unfamiliar repo or subsystem fast: entry points, data flow, key abstractions, and where to make a change. Use when: onboarding to a codebase, understanding unfamiliar code, getting oriented in a new repo or subsystem, figuring out how something works.'
argument-hint: 'A repo path, directory, or subsystem name (optional; defaults to the current directory)'
---

# Explain Codebase

Produce a fast, accurate orientation to an unfamiliar repo or subsystem — enough to know how it works and where to change it.

## Step 1: Scope the target

Use the provided path, directory, or subsystem name. If none is given, default to the current directory. If the repo is large, ask which subsystem to focus on rather than mapping everything.

## Step 2: Survey structure and entry points

Explore breadth-first:
- Build/run config and dependency surface (`package.json`, `pyproject.toml`, `go.mod`, `Makefile`, etc.)
- Top-level layout and what each major directory owns
- Entry points: `main`, server bootstrap, CLI commands, route registration, exported public API

## Step 3: Trace the primary flow

For the target area, follow one representative path end to end — request → handler → service → data, or input → transform → output. Note where state lives (DB, cache, in-memory) and the boundaries it crosses.

## Step 4: Identify the key abstractions

Name the 3–6 core concepts the codebase is built around (the domain types, base classes, or modules everything routes through) and how they relate.

## Step 5: Output the orientation

Produce a tight, scannable summary:

```
## <Target> — orientation

**What it does:** 1–2 sentences.

**Architecture:** the major pieces and how they connect.

**Primary flow:** the traced path, step by step.

**Key files (most-to-least important):**
- `path/to/file.ts:42` — what it owns
- ...

**Where to change X:** for the user's likely task, where the edit goes.

**Gotchas:** non-obvious coupling, surprising patterns, or landmines.
```

Every file reference must be a clickable `path:line`. Keep it a map, not a transcript — the goal is orientation, not exhaustive coverage.

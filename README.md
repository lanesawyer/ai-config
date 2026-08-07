# AI Config

Personal tooling for AI-assisted development workflows. Portable across macOS and Linux.

## Setup

Clone the repo wherever you keep your code and run the setup script — it self-locates, so the clone path doesn't matter:

```bash
git clone <remote-url> ai-config
cd ai-config && ./setup
```

The setup script is **idempotent** — safe to run again after pulling updates. It:
- Makes skill scripts executable
- Symlinks each skill in `skills/<category>/` **flat** into `~/.agents/skills/` and `~/.claude/skills/` — the category folders are for organizing the repo, not the install
- Symlinks `zed/tasks.json` to `~/.config/zed/tasks.json`
- Symlinks `AGENTS.md` to `~/.config/zed/AGENTS.md` and `~/.claude/CLAUDE.md`

---

## AI Skills

Reusable agent skills in `skills/<category>/<name>/SKILL.md`, available as slash commands in Claude Code. The category folders organize the repo only — skills install flat, so every skill name must be unique across categories.

#### `planning/` — deciding what to build

| Skill | Description |
|---|---|
| `start-work` | Read a Jira ticket, create a worktree (if needed), produce a coding plan, and move the ticket to In Progress |
| `plan-work` | Produce a concrete, file-level coding plan from a Jira ticket or a plain description |
| `write-design-doc` | Author a technical design doc / RFC from a problem statement or ticket, grounded in the codebase |
| `decompose-epic` | Break a large initiative into sequenced, independently-shippable tickets and milestones |
| `refactor-plan` | Sequence a large refactor into small, green-to-green steps behind a test safety net |
| `plan-day` | Summarize GitHub notifications and open PRs into a prioritized daily work list |
| `jira-read-ticket` | Fetch a Jira ticket and summarize its intent and acceptance criteria (building block) |
| `jira-transition` | Transition a Jira issue to a new status (building block) |

#### `coding/` — doing the work

| Skill | Description |
|---|---|
| `create-worktree` | Create a git worktree with a `lane/TICKET-description` branch (building block) |
| `remove-worktree` | Remove a git worktree and clean up its directories |
| `write-tests` | Generate tests for a file or function, following the project's existing testing conventions |
| `explain-codebase` | Map an unfamiliar repo or subsystem: entry points, data flow, key abstractions, where to change |
| `conventional-commit` | Craft a conventional commit message and get approval — returns the message, the caller commits (building block) |

#### `pull-requests/` — from opening a PR through review

| Skill | Description |
|---|---|
| `ship` | Full ship workflow: validate branch, stage, commit, push, open a GitHub PR, and transition the Jira ticket |
| `stacked-prs` | Split a large change into a stack of dependent PRs with `gh stack`: plan layers, submit, rebase mid-stack, merge bottom-up |
| `review-pr` | Review a GitHub PR from a link or number, using the linked Jira ticket and PR body for context |
| `address-pr-comments` | Fix open review threads in code and produce a checklist summary |
| `read-pr` | Resolve a GitHub PR (link, number, or current branch) and fetch its details, diff, and review threads (building block) |
| `github-pr` | Open a GitHub PR for the current branch (building block) |

#### `website/` — website creation

| Skill | Description |
|---|---|
| `create-website` | Full new-website workflow: Astro repo, GitHub Pages for static sites or Turso + Fly.io when db-backed, and CI/deploy workflows |
| `setup-astro-repo` | Scaffold a web repo with pnpm, Astro, astro-bulma (+ Drizzle when db-backed) + oxlint/oxfmt/vitest (building block) |
| `turso-new-db` | Create a Turso database, asking for a new or existing database group (building block) |
| `fly-new-app` | Create a Fly.io app for the current project without deploying (building block) |
| `add-ci-workflow` | GitHub Actions CI workflow: build, lint, test, fmt with pnpm (building block) |
| `gh-pages-deploy-workflow` | GitHub Actions workflow: build + deploy a static site to GitHub Pages on merge to main (building block) |
| `fly-deploy-workflow` | GitHub Actions workflow: db:migrate + deploy to Fly.io on merge to main (building block) |
| `fly-pr-preview` | GitHub Actions workflow: temporary per-PR Fly.io preview apps with a forked Turso db |

#### `career/` — my own record of the work

| Skill | Description |
|---|---|
| `impact-log` | Append an impact-framed accomplishment to the Anytype "Impact Log" page for perf/promo |

#### `tooling/` — the AI tooling itself

| Skill | Description |
|---|---|
| `improve-skills` | Review recent skill usage and suggest improvements to SKILL.md files |

### How the skills relate

Several skills are **building blocks** that larger workflow skills compose. `start-work` and `ship` are the two top-level entry points; `plan-work`, `review-pr`, and `address-pr-comments` reuse the same shared pieces. Subgraphs are the `skills/` sub-folders — composition crosses them freely, since a stage-based grouping isn't the same as a dependency graph.

Solid arrows mean the skill invokes the other as part of its procedure; dotted arrows mean it only suggests it as a next step.

```mermaid
graph TD
    subgraph planning["planning/"]
        start-work
        plan-work
        write-design-doc
        decompose-epic
        refactor-plan
        jira-read-ticket
        jira-transition
    end

    subgraph coding["coding/"]
        create-worktree
        conventional-commit
        write-tests
    end

    subgraph prs["pull-requests/"]
        ship
        stacked-prs
        review-pr
        address-pr-comments
        read-pr
        github-pr
    end

    start-work --> jira-read-ticket
    start-work --> jira-transition
    start-work --> create-worktree
    start-work --> plan-work

    plan-work --> jira-read-ticket

    write-design-doc --> jira-read-ticket

    decompose-epic --> jira-read-ticket
    decompose-epic -. suggests .-> plan-work

    refactor-plan -. suggests .-> write-tests

    ship --> conventional-commit
    ship --> github-pr
    ship --> jira-transition
    ship --> stacked-prs

    stacked-prs --> conventional-commit
    stacked-prs --> jira-transition
    stacked-prs -. suggests .-> address-pr-comments

    review-pr --> read-pr
    review-pr --> jira-read-ticket

    address-pr-comments --> read-pr
    address-pr-comments -. suggests .-> ship
```

The `website/` family is its own self-contained tree, driven by `create-website`:

```mermaid
graph TD
    subgraph website["website/"]
        create-website
        setup-astro-repo
        turso-new-db
        fly-new-app
        add-ci-workflow
        gh-pages-deploy-workflow
        fly-deploy-workflow
    end

    create-website --> setup-astro-repo
    create-website --> turso-new-db
    create-website --> fly-new-app
    create-website --> add-ci-workflow
    create-website --> gh-pages-deploy-workflow
    create-website --> fly-deploy-workflow
    fly-deploy-workflow -. suggests .-> fly-new-app
```

The rest compose nothing and are composed by nothing — invoke them directly:

```mermaid
graph LR
    subgraph planning["planning/"]
        plan-day
    end

    subgraph coding["coding/"]
        remove-worktree
        explain-codebase
    end

    subgraph website["website/"]
        fly-pr-preview
    end

    subgraph career["career/"]
        impact-log
    end

    subgraph tooling["tooling/"]
        improve-skills
    end

    subgraph local["Project-local (ai-config only)"]
        add-skill
    end
```

### Project-local skills

Project-local skills live in `.agents/skills/` (AI-agnostic source of truth). The whole folder is symlinked as `.claude/skills` → `../.agents/skills`, so anything added under `.agents/skills/` shows up in Claude Code automatically. They only load when working inside this repo — `setup` does **not** link them globally. Currently:

- `add-skill` — scaffold a new skill in `skills/<category>/`, update the README table and diagram, then run `setup`.

---

## Agent Instructions

`AGENTS.md` at the repo root contains style and workflow instructions for AI agents. It is symlinked to:

- `~/.config/zed/AGENTS.md` — loaded by Zed
- `~/.claude/CLAUDE.md` — loaded by Claude Code as user-level instructions

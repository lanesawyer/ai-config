# AI Config

Personal tooling for AI-assisted development workflows. Portable across macOS and Linux.

## Setup

Clone the repo and run the setup script:

```bash
git clone <remote-url> ~/dev/ai-config
~/dev/ai-config/setup
```

The setup script is **idempotent** — safe to run again after pulling updates. It:
- Makes skill scripts executable
- Symlinks each skill in `skills/` into `~/.agents/skills/` and `~/.claude/skills/`
- Symlinks `zed/tasks.json` to `~/.config/zed/tasks.json`
- Symlinks `AGENTS.md` to `~/.config/zed/AGENTS.md` and `~/.claude/CLAUDE.md`

---

## AI Skills

Reusable agent skills in `skills/<name>/SKILL.md`, available as slash commands in Claude Code.

| Skill | Description |
|---|---|
| `start-work` | Read a Jira ticket, create a worktree (if needed), produce a coding plan, and move the ticket to In Progress |
| `create-worktree` | Create a git worktree with a `lane/TICKET-description` branch |
| `remove-worktree` | Remove a git worktree and clean up its directories |
| `ship` | Full ship workflow: validate branch, stage, commit, push, open a GitHub PR, and transition the Jira ticket |
| `read-pr` | Resolve a GitHub PR (link, number, or current branch) and fetch its details, diff, and review threads (building block) |
| `review-pr` | Review a GitHub PR from a link or number, using the linked Jira ticket and PR body for context |
| `address-pr-comments` | Fix open review threads in code and produce a checklist summary |
| `plan-work` | Produce a concrete, file-level coding plan from a Jira ticket or a plain description |
| `plan-day` | Summarize GitHub notifications and open PRs into a prioritized daily work list |
| `conventional-commit` | Craft a conventional commit message, get approval, then commit and push |
| `github-pr` | Open a GitHub PR for the current branch |
| `jira-read-ticket` | Fetch a Jira ticket and summarize its intent and acceptance criteria (building block) |
| `jira-transition` | Transition a Jira issue to a new status |
| `write-tests` | Generate tests for a file or function, following the project's existing testing conventions |
| `improve-skills` | Review recent skill usage and suggest improvements to SKILL.md files |

### How the skills relate

Several skills are **building blocks** that larger workflow skills compose. `start-work` and `ship` are the two top-level entry points; `plan-work`, `review-pr`, and `address-pr-comments` reuse the same shared pieces.

```mermaid
graph TD
    subgraph workflows[Top-level workflows]
        start-work
        ship
        review-pr
        address-pr-comments
        plan-work
    end

    subgraph blocks[Building blocks]
        jira-read-ticket
        jira-transition
        create-worktree
        read-pr
        conventional-commit
        github-pr
    end

    start-work --> jira-read-ticket
    start-work --> jira-transition
    start-work --> create-worktree
    start-work --> plan-work

    plan-work --> jira-read-ticket

    ship --> conventional-commit
    ship --> github-pr
    ship --> jira-transition

    review-pr --> read-pr
    review-pr --> jira-read-ticket

    address-pr-comments --> read-pr
    address-pr-comments -. suggests .-> ship

    %% Standalone skills (no composition): plan-day, remove-worktree, write-tests, improve-skills
```

Standalone skills — `plan-day`, `remove-worktree`, `write-tests`, and `improve-skills` — don't compose other skills and aren't composed by them.

---

## Agent Instructions

`AGENTS.md` at the repo root contains style and workflow instructions for AI agents. It is symlinked to:

- `~/.config/zed/AGENTS.md` — loaded by Zed
- `~/.claude/CLAUDE.md` — loaded by Claude Code as user-level instructions

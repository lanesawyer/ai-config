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
| `address-pr-comments` | Fix open review threads in code and produce a checklist summary |
| `plan-ticket` | Read a Jira ticket and produce a concrete, file-level coding plan |
| `plan-day` | Summarize GitHub notifications and open PRs into a prioritized daily work list |
| `conventional-commit` | Craft a conventional commit message, get approval, then commit and push |
| `github-pr` | Open a GitHub PR for the current branch |
| `jira-transition` | Transition a Jira issue to a new status |
| `improve-skills` | Review recent skill usage and suggest improvements to SKILL.md files |

---

## Agent Instructions

`AGENTS.md` at the repo root contains style and workflow instructions for AI agents. It is symlinked to:

- `~/.config/zed/AGENTS.md` — loaded by Zed
- `~/.claude/CLAUDE.md` — loaded by Claude Code as user-level instructions

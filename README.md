# AI Config

Personal tooling for AI-assisted development workflows. Portable across macOS and Linux.

## Setup

Clone the repo and run the setup script:

```bash
git clone <remote-url> ~/dev/ai-config
~/dev/ai-config/setup
source ~/.zshrc   # or source ~/.bashrc
```

The setup script is **idempotent** — safe to run again after pulling updates. It:
- Makes all `bin/` scripts executable
- Adds the `source` line to `~/.zshrc` and `~/.bashrc` (whichever exist) — skipping if already present
- Symlinks each skill in `skills/` into `~/.agents/skills/` (GitHub Copilot) and `~/.claude/skills/` (Claude Code)
- Warns if the `code` CLI isn't on PATH (needed for auto-opening VS Code)

> **Linux note:** Works identically on Linux. The only prerequisite is that the `code` CLI is on your PATH (true by default when VS Code is installed via the official `.deb` or `.rpm`). Use `--no-open` if you don't use VS Code.

**Manual alternative** — add one line to your `~/.zshrc` yourself:
```zsh
source ~/dev/ai-config/shell/init.zsh
```

---

## AI Skills

Reusable agent skills in `skills/<name>/SKILL.md` are automatically available in:

- **GitHub Copilot** (VS Code) — loaded from `~/.agents/skills/<name>/`
- **Claude Code** — loaded from `~/.claude/skills/<name>/`

`setup` symlinks each skill directory into `~/.claude/skills/`, which is scanned by both Claude Code and GitHub Copilot. `~/.agents/skills/` is *also* scanned by Copilot, so linking to both would cause each skill to appear twice in Copilot's slash command menu.

> **Migrating an existing non-symlinked skill:** If `~/.agents/skills/<name>` or `~/.claude/skills/<name>` already exists as a real directory, `setup` will warn and skip it. Remove the directory manually, then re-run `setup` to replace it with a symlink to this repo.

### Available skills

| Skill | Description |
|---|---|
| `ship` | Validate branch, stage changes, write a conventional commit, push, open a GitHub PR, and transition the Jira ticket |

---

## git-worktree-new

Create a git worktree with local config files carried over and dependencies installed.

```
git worktree-new <branch> [path] [--existing] [--no-install] [--no-open]
# or:
worktree-new <branch> [path] [--existing] [--no-install] [--no-open]
```

### What it does

1. Runs `git worktree add [-b] <path> <branch>`
2. Copies all untracked `.env*` files from the main worktree (e.g. `.env`, `.env.local`)
3. Symlinks an untracked `.npmrc` from the main worktree — so auth tokens stay in sync automatically
4. Detects the package manager (`pnpm`, `yarn`, or `npm`) from the lockfile and runs install
5. Opens the new worktree in VS Code

### Arguments

| Argument | Description |
|---|---|
| `<branch>` | Branch name to create (required) |
| `[path]` | Worktree path. Defaults to `../<repo>-<branch-slug>` |
| `--existing` | Checkout an existing branch instead of creating a new one |
| `--no-install` | Skip the package manager install step |
| `--no-open` | Skip opening in VS Code |

### Examples

```bash
# New branch — worktree lands at ../repo-name-my-feature
cd ~/dev/repo-name
git worktree-new lane/my-feature

# Explicit output path
git worktree-new lane/my-feature ~/dev/repo-name-scratch

# Checkout an existing remote branch
git worktree-new some-branch --existing

# Skip install and editor (useful in CI or remote SSH sessions)
git worktree-new lane/my-feature --no-install --no-open
```

---

## git-worktree-rm

Cleanly remove a worktree (strips `node_modules` first so git doesn't complain,
then optionally deletes the branch).

```
git worktree-rm <path> [--delete-branch]
# or:
worktree-rm <path> [--delete-branch]
```

### Arguments

| Argument | Description |
|---|---|
| `<path>` | Path to the worktree to remove (required) |
| `--delete-branch` | Also delete the associated git branch after removal |

### Examples

```bash
git worktree-rm ../repo-name-my-feature
git worktree-rm ../repo-name-my-feature --delete-branch
```

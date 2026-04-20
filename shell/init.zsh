# ai-config/shell/init.zsh
# Bootstrap for ai-config tools — source this from ~/.zshrc with:
#   source ~/dev/ai-config/shell/init.zsh

# Resolve the ai-config root relative to this file (works on any machine)
_AI_CONFIG_ROOT="${${(%):-%x}:A:h:h}"

export PATH="$_AI_CONFIG_ROOT/bin:$PATH"

# Ergonomic short aliases that delegate to the git-worktree-* scripts
alias worktree-new='git worktree-new'
alias worktree-rm='git worktree-rm'

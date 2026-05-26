#!/bin/sh
if [ -f "$ZED_MAIN_GIT_WORKTREE/.env" ]; then
  cp "$ZED_MAIN_GIT_WORKTREE/.env" "$ZED_WORKTREE_ROOT/.env"
  echo "copied .env"
else
  echo "no .env in main worktree — skipping"
fi

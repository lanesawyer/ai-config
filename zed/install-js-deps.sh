#!/bin/sh
cd "$ZED_WORKTREE_ROOT"
if [ -f pnpm-lock.yaml ]; then
  pnpm install
elif [ -f package-lock.json ]; then
  npm install
else
  echo "no JS lockfile — skipping"
fi

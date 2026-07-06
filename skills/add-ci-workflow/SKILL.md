---
name: add-ci-workflow
description: 'Add a GitHub Actions CI workflow running build, lint, test, and fmt checks with pnpm. Use when: adding CI, setting up GitHub Actions checks, adding a build/lint/test workflow. Building block for create-website.'
---

# Add CI Workflow

Add `.github/workflows/ci.yml` that gates every PR on build, lint, test, and formatting.

## Step 1: Confirm the scripts exist

Check package.json for `build`, `lint`, `test`, and `fmt:check`. If any are missing, add them (or adapt the workflow to what the repo actually uses) — don't ship a workflow that calls scripts that don't exist.

## Step 2: Create the workflow

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/setup@v1
        with:
          cache: true
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - run: pnpm lint
      - run: pnpm test
      - run: pnpm fmt:check
```

If build needs env vars (e.g. Turso credentials for a build-time db connection), add them from repo secrets.

## Step 3: Verify

If the repo is on GitHub and the user wants it pushed now, push and watch the run (`gh run watch`) until green. Otherwise note that verification happens on first push.

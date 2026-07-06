---
name: fly-deploy-workflow
description: 'Add a GitHub Actions workflow that runs db:migrate and deploys to Fly.io on merge to main. Use when: adding a deploy workflow, deploying on merge, setting up continuous deployment to Fly.io. Building block for create-website.'
---

# Fly.io Deploy Workflow

Add `.github/workflows/deploy.yml`: on push to main, run database migrations, then deploy to Fly.io.

## Step 1: Preflight

- Confirm `fly.toml` exists (if not, follow the `fly-new-app` skill first) and package.json has a `db:migrate` script.
- Create a deploy token and set the repo secrets:

```bash
fly tokens create deploy --app <app-name>
gh secret set FLY_API_TOKEN
gh secret set TURSO_DATABASE_URL
gh secret set TURSO_AUTH_TOKEN
```

## Step 2: Create the workflow

```yaml
name: Deploy

on:
  push:
    branches: [main]

concurrency:
  group: deploy
  cancel-in-progress: false

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/setup@v1
        with:
          cache: true
      - run: pnpm install --frozen-lockfile
      - run: pnpm db:migrate
        env:
          TURSO_DATABASE_URL: ${{ secrets.TURSO_DATABASE_URL }}
          TURSO_AUTH_TOKEN: ${{ secrets.TURSO_AUTH_TOKEN }}
      - uses: superfly/flyctl-actions/setup-flyctl@master
      - run: flyctl deploy --remote-only
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

Migrations run before the deploy on purpose: new code never ships against an un-migrated schema. Keep schema changes backward-compatible with the still-running old version.

## Step 3: Verify

On the next merge to main, watch the run (`gh run watch`) and confirm the app is healthy: `fly status --app <app-name>`.

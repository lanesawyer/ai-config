---
name: fly-deploy-workflow
description: 'Add a GitHub Actions workflow that deploys to Fly.io on merge to main, with db migrations run as a Fly release_command. Use when: adding a deploy workflow, deploying on merge, setting up continuous deployment to Fly.io. Building block for create-website.'
---

# Fly.io Deploy Workflow

Add `.github/workflows/fly-deploy.yml`: on push to main, deploy to Fly.io. Migrations run as a Fly `release_command`, so they execute against prod right before the new version starts serving — the workflow itself stays a plain deploy.

## Step 1: Preflight

- Confirm `fly.toml` exists (if not, follow the `fly-new-app` skill first).
- Create a deploy token and set the repo secret:

```bash
fly tokens create deploy --app <app-name>
gh secret set FLY_API_TOKEN
```

## Step 2: Wire migrations as a release command

In `fly.toml`:

```toml
# Call tsx directly instead of `pnpm db:migrate`: the runtime image has no
# pnpm-lock.yaml, so pnpm's pre-run dependency check would kick off a full
# re-install of everything (and time the release machine out).
[deploy]
release_command = 'node_modules/.bin/tsx src/db/migrate.ts'
```

This needs three things in place (the `setup-astro-repo` skill sets them up):

- `src/db/migrate.ts` applying the `./drizzle` migrations via `drizzle-orm/libsql/migrator`
- `tsx` in `dependencies` (not devDependencies — the runtime image only has prod deps)
- The Dockerfile copying the migration inputs into the runtime image:

```dockerfile
# Migration inputs for the Fly release_command
COPY drizzle ./drizzle
COPY src/db ./src/db
```

**Exception:** if migrations can't run from the runtime image (e.g. Better Auth's CLI needs the TS config and dev deps), run them from CI instead — add a migrate step before `flyctl deploy` with `TURSO_DATABASE_URL`/`TURSO_AUTH_TOKEN` repo secrets.

## Step 3: Create the workflow

```yaml
# See https://fly.io/docs/app-guides/continuous-deployment-with-github-actions/

name: Fly Deploy
on:
  push:
    branches:
      - main
jobs:
  deploy:
    name: Deploy app
    runs-on: ubuntu-latest
    timeout-minutes: 15
    concurrency: deploy-group
    steps:
      - uses: actions/checkout@v6
      - uses: superfly/flyctl-actions/setup-flyctl@master
      - run: flyctl deploy --remote-only
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

Keep schema changes backward-compatible with the still-running old version — the release command migrates before the new machines take over.

## Step 4: Verify

On the next merge to main, watch the run (`gh run watch`) and confirm the release command succeeded and the app is healthy: `fly status --app <app-name>`.

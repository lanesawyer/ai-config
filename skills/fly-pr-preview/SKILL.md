---
name: fly-pr-preview
description: 'Add a GitHub Actions workflow that spins up a temporary Fly.io preview app per pull request, backed by a fork of the production Turso database, and destroys both on close. Use when: adding PR previews, review apps, per-PR deploy environments. Building block for create-website.'
---

# Fly.io PR Preview

Add `.github/workflows/preview.yml`: each PR gets its own temporary Fly.io app backed by its own copy of the production Turso database — previews never touch prod data. Both are torn down when the PR closes.

## Step 1: Preflight

- Confirm `fly.toml` exists and note the production Turso db name and group (from `.env` / `turso db list`).
- Set the two secrets the workflow needs:

```bash
fly tokens create org          # deploy-scoped tokens can't create apps
gh secret set FLY_PREVIEW_TOKEN

turso auth api-tokens mint github-preview
gh secret set TURSO_API_TOKEN
```

## Step 2: Create the workflow

Fill in `<app-name>`, `<prod-db>`, and `<group>`:

```yaml
name: PR Preview

on:
  pull_request:
    types: [opened, reopened, synchronize, closed]

concurrency:
  group: preview-${{ github.event.number }}

env:
  DB_NAME: <app-name>-pr-${{ github.event.number }}
  TURSO_API_TOKEN: ${{ secrets.TURSO_API_TOKEN }}

jobs:
  preview:
    runs-on: ubuntu-latest
    environment:
      name: pr-${{ github.event.number }}
      url: ${{ steps.deploy.outputs.url }}
    steps:
      - uses: actions/checkout@v4
      - name: Install Turso CLI
        run: |
          curl -sSfL https://get.tur.so/install.sh | bash
          echo "$HOME/.turso" >> "$GITHUB_PATH"

      - name: Fork production database
        if: github.event.action != 'closed'
        run: |
          turso db create "$DB_NAME" --group <group> --from-db <prod-db> || true
          echo "TURSO_DATABASE_URL=$(turso db show "$DB_NAME" --url)" >> "$GITHUB_ENV"
          token=$(turso db tokens create "$DB_NAME")
          echo "::add-mask::$token"
          echo "TURSO_AUTH_TOKEN=$token" >> "$GITHUB_ENV"

      - uses: pnpm/setup@v1
        if: github.event.action != 'closed'
        with:
          cache: true
      - name: Migrate preview database
        if: github.event.action != 'closed'
        run: |
          pnpm install --frozen-lockfile
          pnpm db:migrate

      - id: deploy
        uses: superfly/fly-pr-review-apps@1.5.0
        with:
          name: <app-name>-pr-${{ github.event.number }}
          secrets: TURSO_DATABASE_URL=${{ env.TURSO_DATABASE_URL }} TURSO_AUTH_TOKEN=${{ env.TURSO_AUTH_TOKEN }}
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_PREVIEW_TOKEN }}

      - name: Destroy preview database
        if: github.event.action == 'closed'
        run: turso db destroy "$DB_NAME" --yes
```

How it works:

- `turso db create --from-db` forks the production database at the moment the PR opens; the `|| true` makes later `synchronize` runs reuse the existing fork instead of resetting it.
- The PR's own migrations run against the fork before deploy, so schema changes are exercised on real data without touching prod.
- The fly-pr-review-apps action creates/updates the app while the PR is open and destroys it on close; the final step destroys the forked database alongside it.

## Step 3: Verify

Open a test PR and confirm the preview app comes up (the environment URL appears on the PR) and `turso db list` shows the fork. Close it and confirm both `fly apps list` and `turso db list` are clean again.

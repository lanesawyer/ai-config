---
name: fly-pr-preview
description: 'Add a GitHub Actions workflow that spins up a temporary Fly.io preview app per pull request, backed by a fork of the production Turso database, and destroys both on close. Use when: adding PR previews, review apps, per-PR deploy environments.'
---

# Fly.io PR Preview

Add `.github/workflows/fly-preview.yml`: each PR gets its own temporary Fly.io app backed by its own copy of the production Turso database — previews never touch prod data. Both are torn down when the PR closes. This pattern is proven in tutti-belli and the sawyer-suite apps; prefer copying from one of those over rederiving it.

## Step 1: Preflight

- Note the production Turso db name (from `turso db list`) and the Fly app name (from `fly.toml`).
- Set the two secrets the workflow needs:

```bash
fly tokens create org -o <org-slug>   # deploy-scoped tokens can't create apps.
                                      # The -o flag is required — without it the
                                      # command can silently print nothing.
gh secret set FLY_ORG_TOKEN

turso auth api-tokens mint <token-name>
gh secret set TURSO_API_TOKEN
```

## Step 2: Create fly.preview.toml

Copy `fly.toml` and adjust:

- Placeholder app name (it's overridden at deploy time via `--app`)
- Keep the migration `release_command` so the PR's own migrations run against the branch db during deploy
- `auto_stop_machines = 'stop'` is fine for previews

```toml
# Fly.io config for PR preview deployments.
# The app name is overridden at deploy time via --app, so the value here
# is just a placeholder. See .github/workflows/fly-preview.yml.
app = '<app-name>-preview'
primary_region = 'sjc'

[build]

# Call tsx directly instead of `pnpm db:migrate`: the runtime image has no
# pnpm-lock.yaml, so pnpm's pre-run dependency check would kick off a full
# re-install of everything (and time the release machine out).
[deploy]
release_command = 'node_modules/.bin/tsx src/db/migrate.ts'

[env]
PORT = "8080"
HOST = "0.0.0.0"

[http_service]
internal_port = 8080
force_https = true
auto_stop_machines = 'stop'
auto_start_machines = true
min_machines_running = 0
processes = ['app']

[[vm]]
memory = '512mb'
cpu_kind = 'shared'
cpus = 1
```

## Step 3: Create the workflow

Fill in `<app-name>`, `<turso-org>`, and `<prod-db>`, and adapt the "Set runtime secrets" step to whatever env the app needs (only the Turso values come from the branch-db step; anything else is app-specific).

```yaml
name: PR Preview Deployment

on:
  pull_request:
    types: [opened, synchronize, reopened, closed]

concurrency:
  group: preview-${{ github.event.pull_request.number }}
  cancel-in-progress: true

env:
  APP_NAME: <app-name>-pr-${{ github.event.pull_request.number }}
  DB_NAME: <app-name>-pr-${{ github.event.pull_request.number }}
  TURSO_ORG: <turso-org>
  TURSO_MAIN_DB: <prod-db>

jobs:
  deploy-preview:
    name: Deploy preview
    if: github.event.action != 'closed'
    runs-on: ubuntu-latest
    # A permissions block REPLACES the default grants — without contents: read,
    # checkout fails on private repos with a misleading "Repository not found".
    permissions:
      contents: read
      issues: write
      pull-requests: write
    environment:
      name: preview
      url: https://<app-name>-pr-${{ github.event.pull_request.number }}.fly.dev
    steps:
      - uses: actions/checkout@v6

      - uses: superfly/flyctl-actions/setup-flyctl@master

      # ── Turso branch DB ──────────────────────────────────────────────────────
      # Creates a new Turso database seeded from the main DB on first run;
      # subsequent pushes to the same PR reuse the existing branch. The PR's
      # own migrations run against it via the release_command in
      # fly.preview.toml during deploy.
      - name: Create Turso branch DB if it doesn't exist
        id: turso
        env:
          TURSO_API_TOKEN: ${{ secrets.TURSO_API_TOKEN }}
        run: |
          BASE_URL="https://api.turso.tech/v1/organizations/$TURSO_ORG"

          GET_STATUS=$(curl -sL -o /dev/null -w "%{http_code}" \
            -H "Authorization: Bearer $TURSO_API_TOKEN" \
            "$BASE_URL/databases/$DB_NAME")
          echo "GET $DB_NAME → HTTP $GET_STATUS"

          if [ "$GET_STATUS" != "200" ]; then
            MAIN_DB_INFO=$(curl -sL \
              -H "Authorization: Bearer $TURSO_API_TOKEN" \
              "$BASE_URL/databases/$TURSO_MAIN_DB")
            GROUP=$(echo "$MAIN_DB_INFO" | jq -r '.database.group // empty')
            if [ -z "$GROUP" ]; then
              echo "Could not determine group from main DB; response: $MAIN_DB_INFO"
              exit 1
            fi

            echo "Creating Turso DB: $DB_NAME (group: $GROUP, seeded from $TURSO_MAIN_DB)"
            CREATE_STATUS=$(curl -sL -o /dev/null -w "%{http_code}" -X POST \
              -H "Authorization: Bearer $TURSO_API_TOKEN" \
              -H "Content-Type: application/json" \
              -d "{\"name\":\"$DB_NAME\",\"group\":\"$GROUP\",\"seed\":{\"type\":\"database\",\"name\":\"$TURSO_MAIN_DB\"}}" \
              "$BASE_URL/databases")
            echo "Create → HTTP $CREATE_STATUS"
            if [ "$CREATE_STATUS" != "200" ] && [ "$CREATE_STATUS" != "201" ]; then
              echo "Failed to create Turso DB (HTTP $CREATE_STATUS)"
              exit 1
            fi
          else
            echo "Turso DB $DB_NAME already exists, reusing."
          fi

          # Read the hostname from the API rather than constructing it, so the
          # region infix (e.g. aws-us-west-2) is always right.
          HOSTNAME=$(curl -sL \
            -H "Authorization: Bearer $TURSO_API_TOKEN" \
            "$BASE_URL/databases/$DB_NAME" | jq -r '.database.Hostname')

          TOKEN=$(curl -sL -X POST \
            -H "Authorization: Bearer $TURSO_API_TOKEN" \
            "$BASE_URL/databases/$DB_NAME/auth/tokens" | jq -r '.jwt')
          if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
            echo "Failed to generate Turso auth token"
            exit 1
          fi
          echo "::add-mask::$TOKEN"

          echo "db_url=libsql://$HOSTNAME" >> "$GITHUB_OUTPUT"
          echo "db_token=$TOKEN" >> "$GITHUB_OUTPUT"

      # ── Fly.io app ───────────────────────────────────────────────────────────
      - name: Create Fly app if it doesn't exist
        run: |
          flyctl apps list --json | jq -e ".[] | select(.Name == \"$APP_NAME\")" > /dev/null 2>&1 || \
            flyctl apps create "$APP_NAME"
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_ORG_TOKEN }}

      # Adapt to the app's runtime env. Only the Turso values are wired here;
      # add whatever else the app reads (auth origins, API keys, ...).
      - name: Set runtime secrets
        run: |
          flyctl secrets set \
            TURSO_DATABASE_URL="$TURSO_DATABASE_URL" \
            TURSO_AUTH_TOKEN="$TURSO_AUTH_TOKEN" \
            --app "$APP_NAME" --stage
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_ORG_TOKEN }}
          TURSO_DATABASE_URL: ${{ steps.turso.outputs.db_url }}
          TURSO_AUTH_TOKEN: ${{ steps.turso.outputs.db_token }}

      - name: Deploy to preview app
        run: |
          flyctl deploy \
            --app "$APP_NAME" \
            --config fly.preview.toml \
            --remote-only
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_ORG_TOKEN }}

      - name: Comment preview URL on PR
        uses: actions/github-script@v7
        with:
          script: |
            const appName = process.env.APP_NAME;
            const url = `https://${appName}.fly.dev`;
            const body = [
              '## Preview Deployment',
              '',
              `:rocket: Preview available at: **${url}**`,
              '',
              `_Updated: ${new Date().toUTCString()}_`,
            ].join('\n');

            const { data: comments } = await github.rest.issues.listComments({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
            });

            const existing = comments.find(
              c => c.user.login === 'github-actions[bot]' && c.body.includes('## Preview Deployment')
            );

            if (existing) {
              await github.rest.issues.updateComment({
                owner: context.repo.owner,
                repo: context.repo.repo,
                comment_id: existing.id,
                body,
              });
            } else {
              await github.rest.issues.createComment({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: context.issue.number,
                body,
              });
            }

  destroy-preview:
    name: Destroy preview
    if: github.event.action == 'closed'
    runs-on: ubuntu-latest
    steps:
      - uses: superfly/flyctl-actions/setup-flyctl@master

      - name: Destroy Fly preview app
        # Ignore errors — the app may not exist if the deploy never ran
        run: flyctl apps destroy "$APP_NAME" --yes || true
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_ORG_TOKEN }}

      - name: Destroy Turso branch DB
        # Ignore errors — the DB may not exist if the deploy never ran
        run: |
          curl -sf -X DELETE \
            -H "Authorization: Bearer $TURSO_API_TOKEN" \
            "https://api.turso.tech/v1/organizations/$TURSO_ORG/databases/$DB_NAME" || true
        env:
          TURSO_API_TOKEN: ${{ secrets.TURSO_API_TOKEN }}
```

## Step 4: Verify

Open a test PR and confirm the preview app comes up (the bot comments the URL on the PR) and `turso db list` shows the branch db. Close it and confirm both `fly apps list` and `turso db list` are clean again.

## Notes

- **Check this before adding previews at all**: if the app gates its routes behind a session cookie pinned to another domain (cross-subdomain SSO), previews on fly.dev render as logged-out — `fly.dev` is on the Public Suffix List, so no cookie config can fix it. If nearly every route is gated, a preview is just a landing page: skip this skill. Previews earn their keep when meaningful pages are public, or when the app is the auth server itself (it sets its own host-only cookie, so login flows work standalone).
- Validate the config locally with `fly config validate -c fly.preview.toml`.

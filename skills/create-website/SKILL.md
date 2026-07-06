---
name: create-website
description: 'Create a new website end-to-end: Astro repo with pnpm/astro-bulma/Drizzle, Turso database, Fly.io app, and GitHub Actions for CI, deploy, and PR previews. Use when: creating a new website, spinning up a new web project, new site, scaffolding a full-stack Astro project.'
argument-hint: 'Optional: site name (kebab-case, used for the repo, Fly app, and Turso db)'
---

# Create Website

Meta-skill that composes the full new-website stack: repo scaffold → database → hosting → automation.

## Step 1: Gather inputs upfront

Collect everything before starting so the rest runs without interruption:

- **Site name** — kebab-case; used for the directory, Fly.io app, and Turso database. Ask if not provided.
- **Turso database group** — run `turso group list` and ask whether to use an existing group or create a new one (never assume).
- **Directory** — confirm where the new repo should live (default: a new directory named after the site in the current parent directory).

## Step 2: Scaffold the repo

Follow the `setup-astro-repo` skill in the target directory. This sets up pnpm, Astro, astro-bulma, Drizzle, and the package.json scripts the later steps depend on (`build`, `lint`, `test`, `fmt:check`, `db:migrate`).

## Step 3: Create the database

Follow the `turso-new-db` skill with the site name and the group answer from Step 1. This produces `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` in `.env`.

## Step 4: Create the Fly.io app

Follow the `fly-new-app` skill with the site name. Set the Turso credentials as Fly secrets:

```bash
fly secrets set TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... --stage
```

## Step 5: Add the GitHub Actions workflows

Follow, in order:

1. `add-ci-workflow` — build, lint, test, fmt on every PR and push to main
2. `fly-deploy-workflow` — deploy to Fly.io and run `db:migrate` on merge to main
3. `fly-pr-preview` — temporary per-PR Fly.io preview apps. Skip this one if the site gates nearly all routes behind cross-domain SSO (see that skill's notes) — previews would render logged-out and be useless.

These need repo secrets (`FLY_API_TOKEN` for deploys; `FLY_ORG_TOKEN` and `TURSO_API_TOKEN` for previews); each sub-skill covers setting its own.

## Step 6: Verify and hand off

- Run `pnpm build && pnpm lint && pnpm test && pnpm fmt:check` locally — all green before the first push.
- If the user wants it on GitHub now, create the repo (`gh repo create`), push main, and confirm the CI and deploy workflows pass.
- Summarize: repo path, Fly app name and URL, Turso db and group, and the three workflow files.

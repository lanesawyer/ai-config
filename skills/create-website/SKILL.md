---
name: create-website
description: 'Create a new website end-to-end: Astro repo with pnpm/astro-bulma; GitHub Pages for static sites, or Turso + Fly.io when the site needs a database; GitHub Actions for CI and deploy. Use when: creating a new website, spinning up a new web project, new site, scaffolding a static or full-stack Astro project.'
argument-hint: 'Optional: site name (kebab-case, used for the repo, Fly app, and Turso db)'
---

# Create Website

Meta-skill that composes the full new-website stack: repo scaffold → database → hosting → automation.

## Step 1: Gather inputs upfront

Collect everything before starting so the rest runs without interruption:

- **Site name** — kebab-case; used for the directory and any infra named after it. Ask if not provided.
- **Site shape** — does the site need a database or server-side rendering? A page of static content (landing page, links, docs) needs neither: skip the database and host on GitHub Pages instead of Fly.io. When in doubt, ask — and default to static: infra is easy to add later and wasteful to tear down.
- **Turso database group** — only if the site needs a database: run `turso group list` and ask whether to use an existing group or create a new one (never assume).
- **Directory** — confirm where the new repo should live (default: a new directory named after the site in the current parent directory).

## Step 2: Scaffold the repo

Follow the `setup-astro-repo` skill in the target directory, passing the site shape from Step 1 — static sites skip its adapter and Drizzle steps. This sets up pnpm, Astro, astro-bulma, and the package.json scripts the later steps depend on (`build`, `lint`, `test`, `fmt:check`; plus Drizzle and `db:migrate` for db-backed sites).

## Step 3: Create the database

**Static site: skip this step.**

Follow the `turso-new-db` skill with the site name and the group answer from Step 1. This produces `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` in `.env`.

## Step 4: Create the hosting

**Static site:** no Fly app — hosting is GitHub Pages, set up entirely by the `gh-pages-deploy-workflow` skill in Step 5.

**Db-backed site:** follow the `fly-new-app` skill with the site name. Set the Turso credentials as Fly secrets:

```bash
fly secrets set TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... --stage
```

## Step 5: Add the GitHub Actions workflows

Follow, in order:

1. `add-ci-workflow` — build, lint, test, fmt on every PR and push to main
2. Static site: `gh-pages-deploy-workflow` — build and deploy to GitHub Pages on merge to main (uses the built-in `GITHUB_TOKEN`; no repo secrets). Db-backed site: `fly-deploy-workflow` — deploy to Fly.io and run `db:migrate` on merge to main; needs the `FLY_API_TOKEN` repo secret, which the sub-skill covers setting.

PR previews are deliberately not part of this flow — if the project wants them, follow the standalone `fly-pr-preview` skill (mind its notes on when previews are pointless).

## Step 6: Verify and hand off

- Run `pnpm build && pnpm lint && pnpm test && pnpm fmt:check` locally — all green before the first push.
- If the user wants it on GitHub now: check whether an empty repo already exists (`gh repo view <name>`) before `gh repo create`. On the Fly path, **set the `FLY_API_TOKEN` secret before the first push** — pushing main triggers the deploy workflow immediately, and a push-then-secret order makes the first deploy fail with an empty token (GitHub Pages needs no secret). Then push and confirm both workflows pass.
- Summarize: repo path, the live URL (Pages or Fly), Turso db and group if created, and the workflow files.

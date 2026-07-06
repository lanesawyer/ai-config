---
name: fly-new-app
description: 'Create a new app on Fly.io for the current project without deploying it, generating fly.toml and a Dockerfile. Use when: creating a Fly.io app, setting up Fly hosting, fly launch. Building block for create-website.'
argument-hint: 'Optional: app name (defaults to the repo name)'
---

# Fly.io New App

Create the Fly.io app and config for the current project. No deploy — that's the deploy workflow's job.

## Step 1: Preflight

```bash
fly auth whoami
```

If not authenticated, stop and ask the user to run `fly auth login`.

## Step 2: Launch without deploying

From the repo root:

```bash
fly launch --name <app-name> --no-deploy
```

Fly app names are globally unique — if the name is taken, ask for an alternative. Accept the generated `fly.toml` and Dockerfile; review them and make sure:

- The Dockerfile uses pnpm (corepack) and a Node version matching the project
- The internal port matches what the app serves (Astro's Node adapter defaults to 4321)
- An Astro site needs a server target for Fly — if the project is static-only, add `@astrojs/node` (`pnpm astro add node`) or serve `dist/` with a static file server in the Dockerfile

## Step 3: Set runtime secrets

Set any env the app needs at runtime (staged, so they apply on first deploy):

```bash
fly secrets set TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... --stage
```

Skip values that don't exist yet; note which are missing in the summary.

## Step 4: Report

Summarize the app name, region, and the files created (`fly.toml`, `Dockerfile`), and note that nothing is deployed yet.

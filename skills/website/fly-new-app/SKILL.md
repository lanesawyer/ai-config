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
fly launch --name <app-name> --no-deploy --yes
```

`--yes` accepts the generated config so the launch runs unattended. Fly app names are globally unique — if the name is taken, ask for an alternative. Accept the generated `fly.toml`. **`fly launch` often writes no Dockerfile for Astro projects** — if it didn't, create the standard multi-stage one below (and a `.dockerignore` with `node_modules`, `dist`, `.git`, `.env*`, `.astro`). Review both and make sure:

- The Dockerfile uses pnpm (corepack) and a Node version matching the project
- `internal_port` in fly.toml matches the Dockerfile's `PORT` (fly generates 8080; Astro's Node adapter uses 4321)
- An Astro site needs a server target for Fly — if the project is static-only, add `@astrojs/node` (`pnpm astro add node`) or serve `dist/` with a static file server in the Dockerfile
- If migrations run as a Fly `release_command`, the runtime stage must copy the migration inputs (`COPY drizzle ./drizzle` and `COPY src/db ./src/db`) — see the `fly-deploy-workflow` skill
- Check `auto_stop_machines` against your other Fly apps: `'suspend'` resumes in <1s; the generated `'stop'` needs a ~5s Node boot on wake, during which the proxy can 502 and the dashboard shows "app not listening on the expected port"

Known-good Dockerfile for the standard Astro + Drizzle stack:

```dockerfile
FROM node:22-slim AS base
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
WORKDIR /app

FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM base AS runtime
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4321
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --prod
COPY --from=build /app/dist ./dist
# Migration inputs for the Fly release_command
COPY drizzle ./drizzle
COPY src/db ./src/db
COPY tsconfig.json ./
EXPOSE 4321
CMD ["node", "dist/server/entry.mjs"]
```

## Step 3: Set runtime secrets

Set any env the app needs at runtime (staged, so they apply on first deploy):

```bash
fly secrets set TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... --stage
```

Skip values that don't exist yet; note which are missing in the summary.

## Step 4: Report

Summarize the app name, region, and the files created (`fly.toml`, `Dockerfile`), and note that nothing is deployed yet.

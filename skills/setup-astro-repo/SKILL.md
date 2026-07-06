---
name: setup-astro-repo
description: 'Scaffold a web repo with pnpm, Astro, astro-bulma, and Drizzle, including package.json scripts for build/lint/test/fmt/db:migrate. Use when: setting up a new Astro project, scaffolding a web repo, initializing the standard web stack. Building block for create-website.'
argument-hint: 'Optional: target directory (defaults to current directory)'
---

# Setup Astro Repo

Scaffold the standard web stack: pnpm + Astro + astro-bulma + Drizzle (Turso/libSQL).

## Step 1: Scaffold Astro

In the target directory:

```bash
pnpm create astro@latest . -- --template minimal --install --git
```

Skip `--git` if the directory is already a git repo. Confirm `pnpm dev` isn't needed yet — just check the scaffold completed.

## Step 2: Add astro-bulma

```bash
pnpm add astro-bulma
```

Wire it up per the astro-bulma README (check its docs for the current import pattern — typically importing its CSS in the base layout and using its components in `.astro` files).

## Step 3: Add Drizzle for Turso

```bash
pnpm add drizzle-orm @libsql/client
pnpm add -D drizzle-kit
```

Create:

- `src/db/schema.ts` — empty schema module with one example table commented out
- `src/db/index.ts` — libSQL client + drizzle instance reading `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` from env
- `drizzle.config.ts`:

```ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'turso',
  schema: './src/db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
});
```

Add `.env` to `.gitignore` and create `.env.example` with the two Turso variables.

## Step 4: Lint, test, and format tooling

```bash
pnpm add -D vitest oxlint oxfmt @astrojs/check typescript
```

Set the package.json scripts — later CI/deploy skills depend on these exact names:

```json
{
  "build": "astro build",
  "lint": "astro check && oxlint",
  "test": "vitest run",
  "fmt": "oxfmt",
  "fmt:check": "oxfmt --check",
  "db:generate": "drizzle-kit generate",
  "db:migrate": "drizzle-kit migrate"
}
```

Add one trivial vitest test so `pnpm test` passes from day one.

## Step 5: Verify

Run `pnpm build && pnpm lint && pnpm test && pnpm fmt:check` and fix anything red before finishing.

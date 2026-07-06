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
pnpm add drizzle-orm @libsql/client tsx
pnpm add -D drizzle-kit
```

`tsx` goes in `dependencies`, not devDependencies: the Fly release command runs `src/db/migrate.ts` from the runtime image, which only has prod deps.

Create:

- `src/db/schema.ts` — empty schema module with one example table commented out
- `src/db/index.ts` — libSQL client + drizzle instance reading `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` from env
- `src/db/migrate.ts`:

```ts
import { migrate } from "drizzle-orm/libsql/migrator";
import { db } from "./index";

// Applies the SQL migrations in ./drizzle to whatever TURSO_DATABASE_URL points
// at — the local file in dev, Turso in prod. Works the same either way, unlike
// drizzle-kit's dialect-specific credential checks.
await migrate(db, { migrationsFolder: "./drizzle" });
console.log("Migrations applied.");
```

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
pnpm add -D vitest oxlint oxfmt typescript
```

Create `.oxfmtrc.json`:

```json
{
  "$schema": "./node_modules/oxfmt/configuration_schema.json",
  "ignorePatterns": []
}
```

And `vitest.config.ts`:

```ts
import { getViteConfig } from "astro/config";

export default getViteConfig({
  test: {
    include: ["src/**/*.test.ts"],
  },
});
```

Set the package.json scripts — later CI/deploy skills depend on these exact names:

```json
{
  "build": "astro build",
  "lint": "oxlint .",
  "test": "vitest run",
  "test:watch": "vitest",
  "fmt": "oxfmt .",
  "fmt:check": "oxfmt --check .",
  "db:generate": "drizzle-kit generate",
  "db:migrate": "tsx src/db/migrate.ts"
}
```

Add one trivial vitest test so `pnpm test` passes from day one. Pin pnpm with `"packageManager": "pnpm@<version>"` (and volta if used) matching the Dockerfile's corepack pin.

## Step 5: Verify

Run `pnpm build && pnpm lint && pnpm test && pnpm fmt:check` and fix anything red before finishing.

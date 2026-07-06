---
name: turso-new-db
description: 'Create a new database on Turso, asking whether it goes in a new or existing database group, and wire credentials into .env. Use when: creating a Turso database, setting up libSQL storage, new turso db. Building block for create-website.'
argument-hint: 'Optional: database name (defaults to the repo name)'
---

# Turso New Database

Create a Turso database and capture its credentials for local dev and CI.

## Step 1: Preflight

```bash
turso auth whoami
```

If not authenticated, stop and ask the user to run `turso auth login`.

## Step 2: Pick the database group

**Always ask** — never assume. Run:

```bash
turso group list
```

Show the groups and ask whether to use an existing group or create a new one. If new:

```bash
turso group create <group-name>
```

## Step 3: Create the database

```bash
turso db create <db-name> --group <group>
```

## Step 4: Capture credentials

```bash
turso db show <db-name> --url
turso db tokens create <db-name>
```

Write both to `.env` (create if missing, confirm it's gitignored) and mirror the keys into `.env.example` with empty values:

```
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=...
```

## Step 5: Report

Summarize the db name, group, and URL, and remind the user these same two values are needed as GitHub repo secrets and Fly secrets for deploys (the deploy skills handle setting them).

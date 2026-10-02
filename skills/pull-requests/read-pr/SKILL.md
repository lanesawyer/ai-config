---
name: read-pr
description: 'Resolve a GitHub pull request (from a link, number, or the current branch) and fetch its details, diff, and review threads with the gh CLI. Use when: looking up a PR, pulling PR context, fetching a pull request and its comments. Building block for other skills that operate on a PR.'
argument-hint: 'Optional: PR link, org/repo#123, or bare number — defaults to the current branch'
---

# Read PR

Resolve a pull request and fetch everything a caller needs to reason about it. This is a read-only building block — fetch and read, never post or modify. Other skills call it to get PR context.

## Step 1: Fetch the PR

Run the script with the argument, if one was given:

```bash
~/.agents/skills/read-pr/scripts/read-pr [<url> | <org/repo#123> | <number>]
```

It accepts a full URL, `org/repo#123`, or a bare number (resolved against the current repo). With no argument it uses the open PR for the current branch. It prints one JSON object:

- `pr`: repo, number, title, url, state, isDraft, author, base, head, body
- `files`: each changed file's path, additions, and deletions
- `threads.unresolved`: path, line, isOutdated, and every comment's author and body
- `threads.resolvedCount`: resolved threads are only counted

If it fails to resolve a PR (no PR for the branch, bad reference), report that clearly and ask for a link or number rather than guessing.

## Step 2: Fetch the diff, if the caller needs it

The script leaves the diff out because it's the largest piece and not every caller reads it. When the caller needs it (a review, for example), run:

```bash
gh pr diff <number> -R <repo>
```

On a large PR, drop noise such as lockfiles and generated files with `--exclude` (for example `--exclude 'pnpm-lock.yaml' --exclude '*.snap'`). When the branch is checked out locally, the `files` list plus reading the files directly is often enough.

## Step 3: Report

Hand back a structured summary the caller can use directly:

```
**<org/repo>#<number>: <title>** (<state>) — @<author>
base `<base>` ← head `<head>`

<one-line description from the PR body>

**Changed files:** <count> (<rough sense of scope>)
**Review threads:** <N unresolved, M resolved> (or "none")
```

Keep the diff and thread details available for the caller — this skill gathers and structures; it does not review, fix, or post anything.

---
name: gh-pages-deploy-workflow
description: 'Add a GitHub Actions workflow that builds a static site and deploys it to GitHub Pages, with an optional custom domain. Use when: deploying a static site, GitHub Pages hosting, static site with a custom domain. Building block for create-website.'
argument-hint: 'Optional: custom domain (e.g. suite.example.dev)'
---

# GitHub Pages Deploy Workflow

For static builds only — no server adapter, `astro build` (or equivalent) emits plain files into `dist/`. Deploys with the built-in `GITHUB_TOKEN`, so unlike the Fly flow there is no secret to set before the first push.

## Step 1: Enable Pages via Actions

The repo must exist on GitHub first. Then:

```bash
gh api repos/{owner}/{repo}/pages -X POST -f build_type=workflow
```

A 409 means Pages is already enabled — switch it with `-X PUT` instead.

## Step 2: Create the workflow

`.github/workflows/pages-deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/setup@v1
        with:
          cache: true
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
      - id: deployment
        uses: actions/deploy-pages@v4
```

## Step 3: Custom domain (optional)

- Commit the domain in `public/CNAME` (one line, just the hostname) so every deploy keeps it, and set it on the repo:

```bash
gh api repos/{owner}/{repo}/pages -X PUT -f cname=<domain>
```

- DNS is manual if the provider has no API (e.g. lanesawyer.dev lives at Fastmail): a subdomain gets a CNAME to `<user>.github.io`; an apex domain gets the GitHub Pages A records (185.199.108.153 through 185.199.111.153) and their AAAA equivalents.
- HTTPS: GitHub provisions the cert automatically once DNS resolves. Enforce it afterwards:

```bash
gh api repos/{owner}/{repo}/pages -X PUT -F https_enforced=true
```

## Step 4: Verify

Push to main, watch the run (`gh run watch`) until green, then curl the `*.github.io` URL — and the custom domain once DNS propagates.

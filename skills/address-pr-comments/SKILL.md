---
name: address-pr-comments
description: 'Address review comments (including Copilot comments) on the active pull request. Use when: responding to PR feedback, fixing review comments, resolving PR threads, implementing requested changes from reviewers, addressing code review, fixing PR issues.'
---

# Address PR Comments

Work through open review threads on the current PR and fix the issues raised. Do not post replies or resolve threads — produce a summary the user can use to respond manually.

## Step 1: Identify the PR

Use the current branch to find the open PR via GitHub tools. If multiple PRs exist for this branch, ask the user which one.

## Step 2: Fetch all open review threads

Retrieve all unresolved review comments and threads on the PR. For each thread note:
- File and line number
- The reviewer's comment
- Whether it's a suggested change, a question, or a blocking request

## Step 3: Address each comment in the code

Work through every open thread:
- **Suggested changes / bugs / style**: make the fix directly in the file
- **Questions about intent**: note it in the summary (Step 4) — no code change needed
- **Scope disagreements / "won't fix"**: note it in the summary for the user to respond to

Do not post any GitHub comments or resolve any threads.

## Step 4: Produce a summary for the user

After all fixes are applied, output a checklist the user can use when responding to reviewers:

```
## PR comment summary

**Fixed in code:**
- [ ] `src/foo.ts:42` — @reviewer: "use const here" → changed `let` to `const`
- [ ] `src/bar.ts:17` — @reviewer: "missing null check" → added early return

**Needs your response (question / context):**
- [ ] `src/baz.ts:88` — @reviewer: "why not use X here?" → explain your reasoning

**Won't fix / out of scope:**
- [ ] `src/qux.ts:5` — @reviewer: "rename this file" → outside this PR's scope, consider responding to defer
```

This gives the user everything needed to go reply to threads and resolve them manually.

## Step 5: Suggest next step

Remind the user to:
1. Review the fixes before responding
2. Reply to each thread in GitHub (approving, declining, or answering)
3. Run `/ship` when the PR is ready to push the fixes

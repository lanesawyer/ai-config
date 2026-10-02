# OpenClaw automations

Deterministic helpers for Lane's OpenClaw scheduled jobs. They do the fetch/diff/format work so model turns only judge and write, or so a job needs no model at all. See [DESIGN.md](DESIGN.md) for the per-job plan and measurements.

- `scripts/`: shell helpers run on the Gateway host through `exec`. Jobs reference them as `~/.openclaw/scripts/<name>`.
- `automations/`: TypeScript for script payloads (`--script`) and condition gates (`--trigger-script`). Code mode only runs plain JavaScript, so `pnpm build` strips the types into `dist/<name>.js`; point the CLI at that file. The CLI stores the script body in the job at create/edit time, so after changing a file here, run `pnpm build` and then `openclaw automations edit <id> --script dist/<name>.js`. `automations/globals.d.ts` declares the code-mode globals.
- `test/`: `pnpm test` from `openclaw/` (and `pnpm typecheck`). The harness strips types the same way the build does, then runs the automation with stubbed `exec`, `json`, and `trigger` globals, the same globals headless code mode provides.

| Script | Used by | Output |
|---|---|---|
| `pr-watch-collect.sh` | `automations/pr-watcher.ts` | `{now, brief, calendar}`; `brief` is pr-brief JSON or `{status}` |
| `pr-digest.sh` | morning brief, journal | pr-brief pre-bucketed: `reviewRequests`, `needsMe`, `waitingOnOthers`, … |
| `day-context.sh` | morning brief, journal, triage, email | Pacific dates, weekday flags, journal title, email query |
| `merged-prs.sh [days]` | impact log | PRs merged in the window, bodies trimmed |
| `anytype-up.sh` | `automations/journal-gate.ts` | `{date, dow, hhmm, anytypeUp}` |

Every GitHub-facing script makes one attempt and prints a single `STATUS: RATE_LIMITED|AUTH_INVALID|ERROR ...` line instead of JSON on failure. Retries are what trip GitHub's secondary rate limit.

`pr-brief.sh` still lives in `~/.openclaw/workspace/scripts/`. The helpers find it through `$PR_BRIEF`, or next to themselves once it moves here.

# OpenClaw automation token reduction

Status: design + prototypes. No live job has been changed.

## Measured cost (run history, 2026-09-29 to 2026-10-01)

`openclaw cron runs` reports the context of the run's final model call, so treat these numbers as a floor per run.

| Job | Session | Tokens/run (typical) | Runs/week | Tokens/week |
|---|---|---|---|---|
| PR watcher | main | 105-118k, even for NO_REPLY | 30 | ~3.4M |
| Urgent email check | main | 72-78k | 21 | ~1.6M |
| Evening todo triage | isolated | ~110k (Todoist + calendar payloads) | 7 | ~0.8M |
| Morning brief | main | 108-120k | 5 | ~0.6M |
| Weekday journal | main | 76k (on a run that failed early) | 5 | ~0.4M+ |
| Friday impact log | main | no runs yet | 1 | ? |

For comparison, an isolated email-check run that stopped before any tool call cost ~10.6k. Most of the spend is the main session's ~70-120k of history riding along on every run, not the work itself.

Running on `session:agent:main:main` has two other costs: a busy main session blocks the job (the 09:18 journal rerun failed with "isolated agent setup timed out before runner start" while main sat in a Bash call), and every run's output lands in main's history.

## Recommendations

| Job | Fit | Model tokens after |
|---|---|---|
| PR watcher | (b) script payload `automations/pr-watcher.js` | 0 |
| Weekday journal | (c) gate `automations/journal-gate.js` + (d) isolated light-context turn | 1 turn/day, smaller prompt |
| Morning brief | (d) isolated light-context + `day-context.sh` + `pr-digest.sh` | ~1 turn, no main history |
| Friday impact log | (d) isolated light-context + `merged-prs.sh` | ~1 turn, no main history |
| Urgent email check | (d) isolated light-context, optionally a lighter model | ~1 turn, no main history |
| Evening triage | (d) add `--light-context` + `day-context.sh` | modest |

No job fits (a) `--command` cleanly. The PR watcher could, with its own state file on disk, but the script payload gets scheduler-managed `trigger.state` and the same announce delivery for free.

### PR watcher → script payload

`pr-watcher.js` makes one `exec` call to `scripts/pr-watch-collect.sh`, which bundles Pacific time, `pr-brief.sh` output (notifications stripped, ~18 KB), and an optional calendar answer. The script applies the job's current rules in JS and returns `{ notify?, state? }`:

- Quiet (weekend, outside 10:00-16:00, 12:00-13:00, in a meeting): returns no `state`, so state is untouched and the event is reported at the next non-quiet run, as today.
- First run: saves the baseline silently.
- New events: non-draft review request not seen before, CI newly FAILURE, decision newly CHANGES_REQUESTED/APPROVED, unresolved threads increased. Up to 4 bullets, urgent first, then "…and N more".
- RATE_LIMITED: silent. AUTH_INVALID: one line, once (`authNoted`). Any other pr-brief error throws, so the run is recorded as an error and failure alerts apply instead of going quiet.
- One deliberate change: state stores only non-draft review-request URLs, so a draft that becomes ready for review is reported. The current prompt stores drafts too and would never report them.

State is the same shape as the current scratch and is ~4.3 KB with today's data (limit 16 KB).

Proposed job (not run):

```bash
openclaw automations create --name "PR watcher" --cron "*/15 10-15 * * 1-5" --tz America/Los_Angeles \
  --script ~/.openclaw/automations/pr-watcher.js --tools exec --session isolated \
  --announce --channel discord --to user:244269771191877633
```

With no model cost, every 15 minutes is affordable (2 GitHub requests per run). The current job would be disabled once this one is proven.

**Calendar: scripts can't call MCP.** Per the docs, trigger and script payloads run "with the owning agent's tool policy". In the 2026.9.7 source (`server-cron-*.mjs`), the headless runner builds its tools with `createOpenClawCodingTools` (core + plugin tools) and never materializes the session MCP runtime that agent turns use. There is also no CLI that calls an MCP tool. So Fastmail `search_events` isn't reachable from the script. `pr-watch-collect.sh` instead runs an optional `~/.openclaw/scripts/cal-now` that prints `{"inMeeting": bool}`; with no `cal-now` it acts like today's "calendar errored" path and assumes you're not in a meeting. Options for `cal-now`, in order of preference:
1. Read-only Fastmail CalDAV with an app password scoped to CalDAV, then parse today's events for `CSGb_` and `C1V` (needs a new credential).
2. The morning brief writes today's timed events to a file and `cal-now` reads it. No new credential, but meetings added later in the day are missed.
3. Drop the meeting hold.

### Weekday journal: what went wrong today, and the gate

- 09:15 run: the Anytype MCP server returned `CONNECTION_CLOSED` because the Anytype app wasn't running yet. Its helper process started at 09:18:01. The run is recorded as `ok` because the agent replied with an error line.
- 09:18 manual rerun: failed after 60s with "isolated agent setup timed out before runner start". The gateway log shows `agent:main:main` was `queued_behind_active_work` (Beans was in a Bash tool call), so the job couldn't get the main session.

`journal-gate.js` on `*/15 9-11 * * 1-5`: from 09:15, it fires once as soon as `scripts/anytype-up.sh` sees the Anytype local API answering on 127.0.0.1:31009. It's a liveness check only, with no API key. On the 11:45 slot it fires with `ANYTYPE_DOWN` so the payload reports that instead of going silent. A failed payload doesn't persist `firedOn`, so the next slot retries. The payload becomes isolated + light-context, and the prompt takes `journalTitle` from `day-context.sh` and PR items from `pr-digest.sh`.

### Agent turns with pre-fetch (d)

These jobs still need MCP (Fastmail, Todoist, Anytype), so they stay agent turns with `toolsAllow: ["*"]`. Pattern allowlists (`anytype__*`) didn't load MCP tools. The prompt's first step becomes one exec call, and the deterministic work moves out of the model:

- `day-context.sh`: today, tomorrow, weekday, `isMonday`, the journal title with an ordinal day, the email query (`after:3d` on Mondays), and the next 7 dates. This replaces "get the time with session_status" plus the date math.
- `pr-digest.sh`: runs pr-brief once and pre-buckets `reviewRequests` (fresh, non-draft), `staleReviewRequests` (count), `needsMe`, `waitingOnOthers`, a `drafts` count, and notification counts by reason plus the top mentions/assigns. The prompt's PR filtering rules go away. Today it reduces 28 review requests and 35 PRs to 19 + 9 stale + 11 + 11.
- `merged-prs.sh`: one `gh search prs --merged-at` call for the last N days, with trimmed bodies, replacing "filter by date in the output".

Per-job prompt changes: morning brief = `day-context.sh` + `pr-digest.sh`, then 3 MCP calls. Journal = the same two scripts, then Anytype. Impact log = `merged-prs.sh`, then Anytype + Todoist. Email = `day-context.sh` only, or nothing; it's already one MCP call, so the win is leaving main. Evening triage = `day-context.sh` for dates.

## Verified vs untested

Verified:
- Gate/payload logic: 21 `node --test` cases against the real script files, run with injected `exec`/`json`/`trigger` globals.
- Shell helpers: run against live GitHub and Anytype (read-only). The live `pr-watch-collect.sh` output, run through `pr-watcher.js`, gives a silent baseline and a silent second run.
- Result contract (`json({...})` or the returned value, `notify`/`state`/`fire`/`message`) and the exec result shape (`status`, `exitCode`, `aggregated`): read in the 2026.9.7 dist source.

Untested (needs a disabled test job or a forced run, which means an `openclaw cron` edit):
- A real headless run on the gateway: whether `exec` inside a script payload needs approval, whether `yieldMs: 25000` keeps a slow pr-brief inline under the 10s code-mode call budget, and whether QuickJS accepts the scripts (plain ES2020, no Intl).
- Whether `--light-context` isolated turns still load MCP tools. Isolated MCP loading was flaky on 9/29-30 and worked on the 9/30 20:40 evening-triage run.
- The "scripts can't call MCP" conclusion comes from reading the source, not a runtime probe.

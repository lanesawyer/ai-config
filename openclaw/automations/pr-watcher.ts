// PR watcher: OpenClaw script payload (headless code mode, no model call).
// Runs pr-watch-collect.sh, diffs against trigger.state, and returns `notify` only for NEW events.
// Create with: openclaw automations create --script dist/pr-watcher.js --tools exec --session isolated --announce ...

const COLLECT = "/home/lane/.openclaw/scripts/pr-watch-collect.sh";
const MAX_BULLETS = 4;

interface Now {
  date: string;
  dow: number;
  hhmm: number;
}

interface MyPR {
  title: string;
  url: string;
  ci: string;
  reviewDecision: string | null;
  unresolvedThreadsAwaitingMe: number;
}

interface ReviewPR {
  title: string;
  url: string;
  isDraft: boolean;
  author: string;
}

type Brief = { status: string } | { myPRs: MyPR[]; reviewRequested: ReviewPR[] };

interface Collected {
  now: Now;
  brief: Brief;
  calendar: { inMeeting?: boolean } | null;
}

interface WatcherState {
  seeded?: boolean;
  my?: Record<string, string>;
  review?: string[];
  authNoted?: boolean;
}

interface Outcome {
  notify?: string;
  state?: WatcherState;
  skipped?: string;
}

function isQuiet(now: Now, calendar: Collected["calendar"]): string | null {
  if (now.dow >= 6) return "weekend";
  if (now.hhmm < 1000 || now.hhmm >= 1600) return "outside hours";
  if (now.hhmm >= 1200 && now.hhmm < 1300) return "lunch";
  if (calendar && calendar.inMeeting === true) return "meeting";
  return null;
}

function signature(pr: MyPR): string {
  return [pr.ci, pr.reviewDecision || "NONE", pr.unresolvedThreadsAwaitingMe].join("|");
}

function parseSignature(sig: string) {
  const [ci, decision, unresolved] = String(sig).split("|");
  return { ci, decision, unresolved: Number(unresolved) || 0 };
}

function link(pr: { title: string; url: string }): string {
  return `[${pr.title}](${pr.url})`;
}

function evaluate(prev: WatcherState, data: Collected): Outcome {
  const quiet = isQuiet(data.now, data.calendar);
  if (quiet) return { skipped: quiet };

  const brief = data.brief;
  if ("status" in brief) {
    if (brief.status.startsWith("STATUS: RATE_LIMITED")) return { skipped: "rate limited" };
    if (brief.status.startsWith("STATUS: AUTH_INVALID")) {
      if (prev.authNoted) return { skipped: "auth invalid (already noted)" };
      return {
        notify: "GitHub token looks invalid for the PR watcher (run: gh auth refresh -h github.com).",
        state: Object.assign({}, prev, { authNoted: true }),
      };
    }
    throw new Error(`pr-brief failed: ${brief.status}`);
  }

  const my: Record<string, string> = {};
  for (const pr of brief.myPRs) my[pr.url] = signature(pr);
  const review = brief.reviewRequested.filter((pr) => !pr.isDraft).map((pr) => pr.url);
  const state: WatcherState = { seeded: true, my, review, authNoted: false };

  if (!prev.seeded) return { state, skipped: "baseline" };

  const urgent: string[] = [];
  const other: string[] = [];
  for (const pr of brief.myPRs) {
    const before = prev.my && prev.my[pr.url] ? parseSignature(prev.my[pr.url]) : null;
    const decision = pr.reviewDecision || "NONE";
    if (pr.ci === "FAILURE" && (!before || before.ci !== "FAILURE")) {
      urgent.push(`CI failing: ${link(pr)}`);
    }
    if (decision === "CHANGES_REQUESTED" && (!before || before.decision !== decision)) {
      urgent.push(`Changes requested: ${link(pr)}`);
    }
    if (decision === "APPROVED" && (!before || before.decision !== decision)) {
      other.push(`Approved: ${link(pr)}`);
    }
    const unresolvedBefore = before ? before.unresolved : 0;
    if (pr.unresolvedThreadsAwaitingMe > unresolvedBefore) {
      other.push(`New unresolved threads (${pr.unresolvedThreadsAwaitingMe}): ${link(pr)}`);
    }
  }
  const seenReview = new Set(prev.review || []);
  for (const pr of brief.reviewRequested) {
    if (!pr.isDraft && !seenReview.has(pr.url)) {
      other.push(`Review requested by ${pr.author}: ${link(pr)}`);
    }
  }

  const events = urgent.concat(other);
  if (events.length === 0) return { state };
  const bullets = events.slice(0, MAX_BULLETS).map((e) => `- ${e}`);
  if (events.length > MAX_BULLETS) bullets.push(`- …and ${events.length - MAX_BULLETS} more`);
  return { notify: bullets.join("\n"), state };
}

const res = await exec({ command: COLLECT, yieldMs: 25000 });
if (!res || res.status !== "completed" || res.exitCode !== 0) {
  throw new Error(`pr-watch-collect failed: ${JSON.stringify(res).slice(0, 300)}`);
}
const outcome = evaluate((trigger.state ?? {}) as WatcherState, JSON.parse(res.aggregated) as Collected);
const result: Omit<Outcome, "skipped"> = {};
if (outcome.notify) result.notify = outcome.notify;
if (outcome.state) result.state = outcome.state;
json(result);

#!/usr/bin/env node
// pr-watch: report new events on your GitHub PRs since the last run, with no model involved.
// Prints a short Markdown bullet list when something changed, or --quiet-token (default: nothing).
// Run it on a schedule (cron, an OpenClaw command payload, ...); see the README.

import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { parseArgs } from "node:util";

export interface Now {
  dow: number;
  hhmm: number;
}

export interface MyPR {
  title: string;
  url: string;
  ci: string;
  reviewDecision: string | null;
  unresolvedThreadsAwaitingMe: number;
}

export interface ReviewPR {
  title: string;
  url: string;
  isDraft: boolean;
  author: string;
}

export type Brief = { status: string } | { myPRs: MyPR[]; reviewRequested: ReviewPR[] };

export interface State {
  seeded?: boolean;
  my?: Record<string, string>;
  review?: string[];
  authNoted?: boolean;
}

export interface Outcome {
  notify?: string;
  state?: State;
  skipped?: string;
}

const MAX_BULLETS = 4;
const TIME_ZONE = "America/Los_Angeles";

const QUERY = `
query {
  viewer { login }
  reviewRequested: search(query: "is:pr is:open archived:false review-requested:@me", type: ISSUE, first: 30) {
    nodes { ... on PullRequest { title url isDraft author { login } } }
  }
  mine: search(query: "is:pr is:open archived:false author:@me", type: ISSUE, first: 50) {
    nodes { ... on PullRequest {
      title url reviewDecision
      commits(last: 1) { nodes { commit { statusCheckRollup { state } } } }
      reviewThreads(last: 30) { nodes { isResolved comments(last: 1) { nodes { author { login } } } } }
    } }
  }
}`;

export function isQuiet(now: Now): string | null {
  if (now.dow >= 6) return "weekend";
  if (now.hhmm < 1000 || now.hhmm >= 1600) return "outside hours";
  if (now.hhmm >= 1200 && now.hhmm < 1300) return "lunch";
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

// Diffs the current brief against the saved state. Quiet periods and rate limits return no
// state, so the saved state is left alone and the events are reported on the next run.
export function evaluate(prev: State, brief: Brief, now: Now): Outcome {
  const quiet = isQuiet(now);
  if (quiet) return { skipped: quiet };

  if ("status" in brief) {
    if (brief.status.startsWith("STATUS: RATE_LIMITED")) return { skipped: "rate limited" };
    if (brief.status.startsWith("STATUS: AUTH_INVALID")) {
      if (prev.authNoted) return { skipped: "auth invalid (already noted)" };
      return {
        notify: "GitHub token looks invalid for the PR watcher (run: gh auth refresh -h github.com).",
        state: { ...prev, authNoted: true },
      };
    }
    throw new Error(`GitHub query failed: ${brief.status}`);
  }

  const my: Record<string, string> = {};
  for (const pr of brief.myPRs) my[pr.url] = signature(pr);
  const review = brief.reviewRequested.filter((pr) => !pr.isDraft).map((pr) => pr.url);
  const state: State = { seeded: true, my, review, authNoted: false };

  if (!prev.seeded) return { state, skipped: "baseline" };

  const urgent: string[] = [];
  const other: string[] = [];
  for (const pr of brief.myPRs) {
    const before = prev.my?.[pr.url] ? parseSignature(prev.my[pr.url]) : null;
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
  const seenReview = new Set(prev.review ?? []);
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

interface GqlSearch<T extends object> {
  nodes: (T | Record<string, never>)[];
}

export interface GqlData {
  viewer: { login: string };
  reviewRequested: GqlSearch<{ title: string; url: string; isDraft: boolean; author: { login: string } | null }>;
  mine: GqlSearch<{
    title: string;
    url: string;
    reviewDecision: string | null;
    commits: { nodes: { commit: { statusCheckRollup: { state: string } | null } }[] };
    reviewThreads: { nodes: { isResolved: boolean; comments: { nodes: { author: { login: string } | null }[] } }[] };
  }>;
}

// Search results can include empty objects for items that aren't pull requests.
function prs<T extends object>(search: GqlSearch<T>): T[] {
  return search.nodes.filter((n): n is T => Object.keys(n).length > 0);
}

export function toBrief(data: GqlData): Brief {
  const me = data.viewer.login;
  return {
    reviewRequested: prs(data.reviewRequested).map((pr) => ({
      title: pr.title,
      url: pr.url,
      isDraft: pr.isDraft,
      author: pr.author?.login ?? "ghost",
    })),
    myPRs: prs(data.mine).map((pr) => ({
      title: pr.title,
      url: pr.url,
      reviewDecision: pr.reviewDecision,
      ci: pr.commits.nodes[0]?.commit.statusCheckRollup?.state ?? "NONE",
      unresolvedThreadsAwaitingMe: pr.reviewThreads.nodes.filter(
        (t) => !t.isResolved && t.comments.nodes[0]?.author?.login !== me,
      ).length,
    })),
  };
}

export function classify(err: string): string {
  if (/rate limit|abuse|secondary/i.test(err)) return "STATUS: RATE_LIMITED";
  if (/bad credentials|401|not logged|authentication/i.test(err)) return "STATUS: AUTH_INVALID";
  return `STATUS: ERROR (${err.slice(0, 200).replace(/\n/g, " ")})`;
}

// One GraphQL request and no retries: retries are what trip GitHub's secondary rate limit.
function fetchBrief(): Brief {
  try {
    const out = execFileSync("gh", ["api", "graphql", "-f", `query=${QUERY}`], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return toBrief((JSON.parse(out) as { data: GqlData }).data);
  } catch (error) {
    const e = error as { stderr?: string; message: string };
    return { status: classify(e.stderr || e.message) };
  }
}

export function zonedNow(date: Date, timeZone = TIME_ZONE): Now {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
      .formatToParts(date)
      .map((p) => [p.type, p.value]),
  );
  const dow = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(parts.weekday) + 1;
  return { dow, hhmm: Number(parts.hour) * 100 + Number(parts.minute) };
}

function readState(file: string): State {
  try {
    return JSON.parse(readFileSync(file, "utf8")) as State;
  } catch {
    return {};
  }
}

function writeState(file: string, state: State) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(`${file}.tmp`, JSON.stringify(state));
  renameSync(`${file}.tmp`, file);
}

function main() {
  const { values } = parseArgs({
    options: {
      state: { type: "string" },
      "quiet-token": { type: "string", default: "" },
      now: { type: "string" },
    },
  });
  const stateFile =
    values.state ??
    process.env.PR_WATCH_STATE ??
    join(process.env.XDG_STATE_HOME ?? join(homedir(), ".local/state"), "pr-watch/state.json");
  const now = zonedNow(values.now ? new Date(values.now) : new Date());

  const outcome = evaluate(readState(stateFile), fetchBrief(), now);
  if (outcome.state) writeState(stateFile, outcome.state);
  const text = outcome.notify ?? values["quiet-token"];
  if (text) console.log(text);
}

if (import.meta.main) {
  try {
    main();
  } catch (error) {
    console.error((error as Error).message);
    process.exit(1);
  }
}

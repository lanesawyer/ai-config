import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { chmodSync, existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { classify, evaluate, toBrief, zonedNow } from "./pr-watch.ts";
import type { Brief, GqlData, MyPR, Now, ReviewPR, State } from "./pr-watch.ts";

type FullBrief = { myPRs: MyPR[]; reviewRequested: ReviewPR[] };

const brief: FullBrief = JSON.parse(readFileSync(new URL("./fixtures/brief.json", import.meta.url), "utf8"));
const WORK_HOURS: Now = { dow: 4, hhmm: 1420 };

function seededFrom(b: FullBrief): State & { my: Record<string, string>; review: string[] } {
  const my: Record<string, string> = {};
  for (const pr of b.myPRs) my[pr.url] = [pr.ci, pr.reviewDecision || "NONE", pr.unresolvedThreadsAwaitingMe].join("|");
  return { seeded: true, my, review: b.reviewRequested.filter((p) => !p.isDraft).map((p) => p.url), authNoted: false };
}

const run = (prev: State, b: Brief = brief, now: Now = WORK_HOURS) => evaluate(prev, b, now);

test("first run saves a baseline and stays silent", () => {
  const out = run({});
  assert.equal(out.notify, undefined);
  assert.deepEqual(out.state, seededFrom(brief));
});

test("unchanged data is silent but refreshes state", () => {
  const out = run(seededFrom(brief));
  assert.equal(out.notify, undefined);
  assert.deepEqual(out.state, seededFrom(brief));
});

test("quiet periods leave state untouched so events are held", () => {
  for (const now of [
    { dow: 6, hhmm: 1100 },
    { dow: 4, hhmm: 959 },
    { dow: 4, hhmm: 1600 },
    { dow: 4, hhmm: 1230 },
  ]) {
    const out = run({ seeded: true, my: {}, review: [] }, brief, now);
    assert.equal(out.state, undefined, `hhmm=${now.hhmm} dow=${now.dow}`);
    assert.equal(out.notify, undefined);
  }
});

test("new events are reported, failing CI and changes requested first", () => {
  const prev = seededFrom(brief);
  const fix = "https://github.com/acme/web/pull/120";
  prev.my[fix] = "SUCCESS|REVIEW_REQUIRED|0";
  prev.review = prev.review.filter((u) => !u.endsWith("/101"));
  const out = run(prev);
  assert.equal(
    out.notify,
    [
      "- CI failing: [fix: login redirect](https://github.com/acme/web/pull/120)",
      "- Changes requested: [fix: login redirect](https://github.com/acme/web/pull/120)",
      "- New unresolved threads (2): [fix: login redirect](https://github.com/acme/web/pull/120)",
      "- Review requested by alice: [Add search](https://github.com/acme/web/pull/101)",
    ].join("\n"),
  );
  assert.deepEqual(out.state, seededFrom(brief));
});

test("still-red CI and draft review requests are not news", () => {
  assert.equal(run(seededFrom(brief)).notify, undefined);
});

test("a draft that becomes ready for review is reported", () => {
  const b = structuredClone(brief);
  b.reviewRequested[2].isDraft = false;
  assert.equal(run(seededFrom(brief), b).notify, "- Review requested by carol: [WIP: auth](https://github.com/acme/api/pull/7)");
});

test("approval is reported once", () => {
  const b = structuredClone(brief);
  b.myPRs[0].reviewDecision = "APPROVED";
  const first = run(seededFrom(brief), b);
  assert.equal(first.notify, "- Approved: [feat: tabs](https://github.com/lanesawyer/astro-bulma/pull/30)");
  assert.equal(run(first.state!, b).notify, undefined);
});

test("more than four events are truncated", () => {
  const b = structuredClone(brief);
  b.reviewRequested = Array.from({ length: 6 }, (_, i) => ({
    title: `PR ${i}`, url: `https://github.com/acme/web/pull/${i}`, isDraft: false, author: "dave",
  }));
  const lines = run(seededFrom(brief), b).notify!.split("\n");
  assert.equal(lines.length, 5);
  assert.equal(lines[4], "- …and 2 more");
});

test("rate limits are silent and keep state", () => {
  const out = run(seededFrom(brief), { status: "STATUS: RATE_LIMITED" });
  assert.equal(out.notify, undefined);
  assert.equal(out.state, undefined);
});

test("an invalid token is reported once", () => {
  const b = { status: "STATUS: AUTH_INVALID" };
  const first = run(seededFrom(brief), b);
  assert.match(first.notify!, /token looks invalid/);
  assert.equal(first.state!.authNoted, true);
  const second = run(first.state!, b);
  assert.equal(second.notify, undefined);
  assert.equal(second.state, undefined);
});

test("other GitHub errors throw without touching state", () => {
  assert.throws(() => run(seededFrom(brief), { status: "STATUS: ERROR (boom)" }), /GitHub query failed/);
});

test("classify maps gh errors to statuses", () => {
  assert.equal(classify("API rate limit exceeded"), "STATUS: RATE_LIMITED");
  assert.equal(classify("HTTP 401: Bad credentials"), "STATUS: AUTH_INVALID");
  assert.match(classify("connection reset\nby peer"), /^STATUS: ERROR \(connection reset by peer\)$/);
});

const gql: GqlData = {
  viewer: { login: "me" },
  reviewRequested: {
    nodes: [
      { title: "Add search", url: "https://github.com/acme/web/pull/101", isDraft: false, author: { login: "alice" } },
      { title: "Ghost PR", url: "https://github.com/acme/web/pull/102", isDraft: true, author: null },
      {},
    ],
  },
  mine: {
    nodes: [
      {
        title: "fix: login redirect",
        url: "https://github.com/acme/web/pull/120",
        reviewDecision: "CHANGES_REQUESTED",
        commits: { nodes: [{ commit: { statusCheckRollup: { state: "FAILURE" } } }] },
        reviewThreads: {
          nodes: [
            { isResolved: false, comments: { nodes: [{ author: { login: "bob" } }] } },
            { isResolved: false, comments: { nodes: [{ author: { login: "me" } }] } },
            { isResolved: true, comments: { nodes: [{ author: { login: "bob" } }] } },
          ],
        },
      },
      {
        title: "chore: deps",
        url: "https://github.com/acme/web/pull/121",
        reviewDecision: null,
        commits: { nodes: [{ commit: { statusCheckRollup: null } }] },
        reviewThreads: { nodes: [] },
      },
    ],
  },
};

test("toBrief maps GraphQL results and counts threads awaiting me", () => {
  assert.deepEqual(toBrief(gql), {
    reviewRequested: [
      { title: "Add search", url: "https://github.com/acme/web/pull/101", isDraft: false, author: "alice" },
      { title: "Ghost PR", url: "https://github.com/acme/web/pull/102", isDraft: true, author: "ghost" },
    ],
    myPRs: [
      { title: "fix: login redirect", url: "https://github.com/acme/web/pull/120", reviewDecision: "CHANGES_REQUESTED", ci: "FAILURE", unresolvedThreadsAwaitingMe: 1 },
      { title: "chore: deps", url: "https://github.com/acme/web/pull/121", reviewDecision: null, ci: "NONE", unresolvedThreadsAwaitingMe: 0 },
    ],
  });
});

test("zonedNow converts to Pacific weekday and time", () => {
  assert.deepEqual(zonedNow(new Date("2026-10-01T21:20:00Z")), { dow: 4, hhmm: 1420 });
  assert.deepEqual(zonedNow(new Date("2026-10-04T07:05:00Z")), { dow: 7, hhmm: 5 });
});

function cli(args: string[], gh: string, stateFile: string) {
  const dir = mkdtempSync(join(tmpdir(), "pr-watch-"));
  writeFileSync(join(dir, "gh"), `#!/usr/bin/env bash\n${gh}\n`);
  chmodSync(join(dir, "gh"), 0o755);
  return execFileSync(process.execPath, [new URL("./pr-watch.ts", import.meta.url).pathname, "--state", stateFile, ...args], {
    encoding: "utf8",
    env: { ...process.env, PATH: `${dir}:${process.env.PATH}` },
  });
}

test("the CLI saves a baseline, then prints new events or the quiet token", () => {
  const stateFile = join(mkdtempSync(join(tmpdir(), "pr-watch-state-")), "nested/state.json");
  const now = ["--now", "2026-10-01T21:20:00Z", "--quiet-token", "NO_REPLY"];
  const respond = (data: GqlData) => `cat <<'EOF'\n${JSON.stringify({ data })}\nEOF`;

  assert.equal(cli(now, respond(gql), stateFile), "NO_REPLY\n");
  assert.ok(existsSync(stateFile));
  assert.equal(cli(now, respond(gql), stateFile), "NO_REPLY\n");

  const approved = structuredClone(gql);
  (approved.mine.nodes[1] as { reviewDecision: string | null }).reviewDecision = "APPROVED";
  assert.equal(cli(now, respond(approved), stateFile), "- Approved: [chore: deps](https://github.com/acme/web/pull/121)\n");
});

test("the CLI stays silent outside watch hours and when rate limited", () => {
  const stateFile = join(mkdtempSync(join(tmpdir(), "pr-watch-state-")), "state.json");
  assert.equal(cli(["--now", "2026-10-02T03:00:00Z"], "exit 1", stateFile), "");
  assert.equal(cli(["--now", "2026-10-01T21:20:00Z"], "echo 'API rate limit exceeded' >&2; exit 1", stateFile), "");
  assert.ok(!existsSync(stateFile));
});

test("the CLI does not call gh during quiet hours", () => {
  const dir = mkdtempSync(join(tmpdir(), "pr-watch-calls-"));
  const marker = join(dir, "called");
  const stateFile = join(dir, "state.json");
  assert.equal(cli(["--now", "2026-10-03T19:00:00Z"], `touch ${marker}; exit 1`, stateFile), "");
  assert.ok(!existsSync(marker));
  assert.equal(cli(["--now", "2026-10-01T19:30:00Z"], `touch ${marker}; exit 1`, stateFile), "");
  assert.ok(!existsSync(marker));
});

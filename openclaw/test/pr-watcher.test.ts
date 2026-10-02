import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runAutomation, completed } from "./harness.ts";

const WORK_HOURS = { date: "2026-10-01", dow: 4, hhmm: 1420 };

type Brief = {
  myPRs: { url: string; ci: string; reviewDecision: string | null; unresolvedThreadsAwaitingMe: number }[];
  reviewRequested: { url: string; isDraft: boolean }[];
};
type RunOptions = { now?: typeof WORK_HOURS; b?: unknown; calendar?: { inMeeting: boolean } | null };

const brief: Brief = JSON.parse(readFileSync(new URL("./fixtures/pr-brief.json", import.meta.url), "utf8"));

function run(state: unknown, { now = WORK_HOURS, b = brief, calendar = null }: RunOptions = {}) {
  return runAutomation("pr-watcher.ts", { state, execResult: completed({ now, brief: b, calendar }) });
}

function seededFrom(b: Brief) {
  const my: Record<string, string> = {};
  for (const pr of b.myPRs) my[pr.url] = [pr.ci, pr.reviewDecision || "NONE", pr.unresolvedThreadsAwaitingMe].join("|");
  return { seeded: true, my, review: b.reviewRequested.filter((p) => !p.isDraft).map((p) => p.url), authNoted: false };
}

test("first run saves a baseline and stays silent", async () => {
  const { output, calls } = await run(undefined);
  assert.equal(output.notify, undefined);
  assert.deepEqual(output.state, seededFrom(brief));
  assert.equal(calls.length, 1);
});

test("unchanged data is silent but refreshes state", async () => {
  const { output } = await run(seededFrom(brief));
  assert.equal(output.notify, undefined);
  assert.deepEqual(output.state, seededFrom(brief));
});

test("quiet periods leave state untouched so events are held", async () => {
  for (const now of [
    { date: "2026-10-03", dow: 6, hhmm: 1100 },
    { date: "2026-10-01", dow: 4, hhmm: 959 },
    { date: "2026-10-01", dow: 4, hhmm: 1600 },
    { date: "2026-10-01", dow: 4, hhmm: 1230 },
  ]) {
    const { output } = await run({ seeded: true, my: {}, review: [] }, { now });
    assert.deepEqual(output, {}, `hhmm=${now.hhmm} dow=${now.dow}`);
  }
  const { output } = await run({ seeded: true, my: {}, review: [] }, { calendar: { inMeeting: true } });
  assert.deepEqual(output, {});
});

test("new events are reported, failing CI and changes requested first", async () => {
  const prev = seededFrom(brief);
  const fix = "https://github.com/acme/web/pull/120";
  prev.my[fix] = "SUCCESS|REVIEW_REQUIRED|0";
  prev.review = prev.review.filter((u) => !u.endsWith("/101"));
  const { output } = await run(prev);
  assert.equal(
    output.notify,
    [
      "- CI failing: [fix: login redirect](https://github.com/acme/web/pull/120)",
      "- Changes requested: [fix: login redirect](https://github.com/acme/web/pull/120)",
      "- New unresolved threads (2): [fix: login redirect](https://github.com/acme/web/pull/120)",
      "- Review requested by alice: [Add search](https://github.com/acme/web/pull/101)",
    ].join("\n"),
  );
  assert.deepEqual(output.state, seededFrom(brief));
});

test("still-red CI and draft review requests are not news", async () => {
  const prev = seededFrom(brief);
  const { output } = await run(prev);
  assert.equal(output.notify, undefined);
});

test("a draft that becomes ready for review is reported", async () => {
  const prev = seededFrom(brief);
  const b = structuredClone(brief);
  b.reviewRequested[2].isDraft = false;
  const { output } = await run(prev, { b });
  assert.equal(output.notify, "- Review requested by carol: [WIP: auth](https://github.com/acme/api/pull/7)");
});

test("approval is reported once", async () => {
  const prev = seededFrom(brief);
  const b = structuredClone(brief);
  b.myPRs[0].reviewDecision = "APPROVED";
  const first = await run(prev, { b });
  assert.equal(first.output.notify, "- Approved: [feat: tabs](https://github.com/lanesawyer/astro-bulma/pull/30)");
  const second = await run(first.output.state, { b });
  assert.equal(second.output.notify, undefined);
});

test("more than four events are truncated", async () => {
  const b = structuredClone(brief);
  b.reviewRequested = Array.from({ length: 6 }, (_, i) => ({
    repo: "acme/web", number: i, title: `PR ${i}`, url: `https://github.com/acme/web/pull/${i}`,
    updatedAt: "2026-09-30T18:00:00Z", isDraft: false, author: "dave",
  }));
  const { output } = await run(seededFrom(brief), { b });
  const lines = output.notify.split("\n");
  assert.equal(lines.length, 5);
  assert.equal(lines[4], "- …and 2 more");
});

test("rate limits are silent and keep state", async () => {
  const { output } = await run(seededFrom(brief), { b: { status: "STATUS: RATE_LIMITED (x)" } });
  assert.deepEqual(output, {});
});

test("an invalid token is reported once", async () => {
  const b = { status: "STATUS: AUTH_INVALID (run: gh auth refresh -h github.com)" };
  const first = await run(seededFrom(brief), { b });
  assert.match(first.output.notify, /token looks invalid/);
  assert.equal(first.output.state.authNoted, true);
  const second = await run(first.output.state, { b });
  assert.deepEqual(second.output, {});
});

test("other pr-brief errors fail the run without touching state", async () => {
  await assert.rejects(run(seededFrom(brief), { b: { status: "STATUS: ERROR (boom)" } }), /pr-brief failed/);
});

test("a failed collect command fails the run", async () => {
  await assert.rejects(
    runAutomation("pr-watcher.ts", { state: {}, execResult: { status: "failed", exitCode: 1, aggregated: "" } }),
    /pr-watch-collect failed/,
  );
});

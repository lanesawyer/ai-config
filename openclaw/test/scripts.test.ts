import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, mkdtempSync, writeFileSync, chmodSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const scripts = new URL("../scripts/", import.meta.url).pathname;
const fixture = readFileSync(new URL("./fixtures/pr-brief.json", import.meta.url), "utf8");

function sh(name: string, args: string[] = [], { env = {}, input }: { env?: Record<string, string>; input?: string } = {}) {
  return execFileSync(join(scripts, name), args, { env: { ...process.env, ...env }, input, encoding: "utf8" });
}

function stub(body: string) {
  const dir = mkdtempSync(join(tmpdir(), "oc-test-"));
  const file = join(dir, "stub");
  writeFileSync(file, `#!/usr/bin/env bash\n${body}\n`);
  chmodSync(file, 0o755);
  return file;
}

test("day-context computes ordinals and Monday lookback", () => {
  const cases: [string, string, boolean][] = [
    ["2026-10-01 09:00", "October 1st, 2026", false],
    ["2026-10-12 09:00", "October 12th, 2026", true],
    ["2026-10-22 09:00", "October 22nd, 2026", false],
    ["2026-10-23 09:00", "October 23rd, 2026", false],
    ["2026-10-31 09:00", "October 31st, 2026", false],
  ];
  for (const [now, title, monday] of cases) {
    const out = JSON.parse(sh("day-context.sh", [], { env: { DAY_CONTEXT_NOW: now } }));
    assert.equal(out.journalTitle, title);
    assert.equal(out.isMonday, monday);
    assert.equal(out.emailQuery, monday ? "in:inbox after:3d" : "in:inbox after:1d");
    assert.equal(out.next7Days.length, 7);
  }
});

test("pr-digest buckets PRs", () => {
  const out = JSON.parse(sh("pr-digest.sh", ["-"], { input: fixture, env: { PR_DIGEST_NOW: "2026-10-01T16:00:00Z" } }));
  assert.deepEqual(out.reviewRequests.map((p: { number: number }) => p.number), [101]);
  assert.equal(out.staleReviewRequests, 1);
  assert.deepEqual(out.needsMe.map((p: { number: number }) => p.number), [120]);
  assert.deepEqual(out.waitingOnOthers.map((p: { number: number }) => p.number), [30]);
  assert.equal(out.drafts, 1);
  assert.equal(out.notifications.unread, 3);
  assert.deepEqual(out.notifications.top.map((n: { reason: string }) => n.reason), ["mention"]);
});

test("pr-digest passes STATUS lines through", () => {
  const out = sh("pr-digest.sh", ["-"], { input: "STATUS: RATE_LIMITED (x)\n" });
  assert.equal(out.trim(), "STATUS: RATE_LIMITED (x)");
});

test("pr-watch-collect wraps brief, time, and calendar", () => {
  const brief = stub(`cat <<'EOF'\n${fixture}\nEOF`);
  const cal = stub(`echo '{"inMeeting":true}'`);
  const out = JSON.parse(sh("pr-watch-collect.sh", [], { env: { PR_BRIEF: brief, CAL_NOW: cal } }));
  assert.equal(out.brief.myPRs.length, 3);
  assert.deepEqual(out.calendar, { inMeeting: true });
  assert.equal(typeof out.now.hhmm, "number");
  assert.match(out.now.date, /^\d{4}-\d{2}-\d{2}$/);
});

test("pr-watch-collect turns a STATUS line into {status} and tolerates no calendar", () => {
  const brief = stub(`echo 'STATUS: RATE_LIMITED (x)'; echo noise >&2`);
  const out = JSON.parse(sh("pr-watch-collect.sh", [], { env: { PR_BRIEF: brief, CAL_NOW: "/nonexistent" } }));
  assert.deepEqual(out.brief, { status: "STATUS: RATE_LIMITED (x)" });
  assert.equal(out.calendar, null);
});

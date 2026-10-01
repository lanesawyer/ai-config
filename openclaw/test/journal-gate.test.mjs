import { test } from "node:test";
import assert from "node:assert/strict";
import { runAutomation, completed } from "./harness.mjs";

function gate(state, probe) {
  return runAutomation("journal-gate.js", { state, execResult: completed(probe) });
}

const probe = (over) => ({ date: "2026-10-01", dow: 4, hhmm: "0915", anytypeUp: true, ...over });

test("fires once when Anytype is up", async () => {
  const { output } = await gate(undefined, probe());
  assert.equal(output.fire, true);
  assert.deepEqual(output.state, { firedOn: "2026-10-01" });
  const again = await gate(output.state, probe({ hhmm: "0930" }));
  assert.deepEqual(again.output, { fire: false });
});

test("waits while Anytype is down", async () => {
  const { output } = await gate({ firedOn: "2026-09-30" }, probe({ anytypeUp: false }));
  assert.deepEqual(output, { fire: false });
});

test("reports Anytype down on the last slot", async () => {
  const { output } = await gate({ firedOn: "2026-09-30" }, probe({ anytypeUp: false, hhmm: "1145" }));
  assert.equal(output.fire, true);
  assert.match(output.message, /^ANYTYPE_DOWN/);
});

test("never fires on weekends or before 09:15", async () => {
  assert.deepEqual((await gate(undefined, probe({ dow: 6 }))).output, { fire: false });
  assert.deepEqual((await gate(undefined, probe({ hhmm: "0900" }))).output, { fire: false });
});

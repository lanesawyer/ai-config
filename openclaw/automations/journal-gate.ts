// Weekday journal: OpenClaw condition trigger (gate) for the journal agent turn.
// Schedule `*/15 9-11 * * 1-5` (the gate skips 09:00). Fires once per day as soon as the Anytype app is up,
// instead of failing at 09:15 when it isn't running yet. Fires on the last slot with
// ANYTYPE_DOWN so a dead app is reported rather than silently skipped.
// State only persists when the fired payload succeeds, so a failed run is retried at the next slot.

interface Probe {
  date: string;
  dow: number;
  hhmm: string;
  anytypeUp: boolean;
}

interface GateState {
  firedOn?: string;
}

const PROBE = "/home/lane/.openclaw/scripts/anytype-up.sh";
const FIRST_SLOT = "0915";
const LAST_SLOT = "1145";

const res = await exec({ command: PROBE, yieldMs: 10000 });
if (!res || res.status !== "completed" || res.exitCode !== 0) {
  throw new Error(`anytype-up failed: ${JSON.stringify(res).slice(0, 300)}`);
}
const probe = JSON.parse(res.aggregated) as Probe;
const prev = (trigger.state ?? {}) as GateState;

if (probe.dow >= 6 || probe.hhmm < FIRST_SLOT || prev.firedOn === probe.date) {
  json({ fire: false });
} else if (probe.anytypeUp) {
  json({ fire: true, message: `Anytype is up. Today is ${probe.date}.`, state: { firedOn: probe.date } });
} else if (probe.hhmm >= LAST_SLOT) {
  json({
    fire: true,
    message: "ANYTYPE_DOWN: the Anytype app has not been reachable since 09:15. Reply with one line saying today's journal entry was not created because Anytype isn't running; do nothing else.",
    state: { firedOn: probe.date },
  });
} else {
  json({ fire: false });
}

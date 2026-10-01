import { readFileSync } from "node:fs";

const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;

// Runs an automation script the way OpenClaw's headless code mode does: top-level await,
// `exec` and `json` globals, and a frozen `trigger.state`. Returns the last json() value.
export async function runAutomation(file, { state, execResult }) {
  const source = readFileSync(new URL(`../automations/${file}`, import.meta.url), "utf8");
  const calls = [];
  let output;
  const exec = async (args) => {
    calls.push(args);
    return typeof execResult === "function" ? execResult(args) : execResult;
  };
  const json = (value) => {
    output = JSON.parse(JSON.stringify(value));
  };
  const trigger = Object.freeze({ state: state === undefined ? undefined : deepFreeze(structuredClone(state)) });
  await new AsyncFunction("exec", "json", "trigger", source)(exec, json, trigger);
  return { output, calls };
}

export function completed(stdout) {
  return { status: "completed", exitCode: 0, aggregated: typeof stdout === "string" ? stdout : JSON.stringify(stdout) };
}

function deepFreeze(value) {
  if (value && typeof value === "object") {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

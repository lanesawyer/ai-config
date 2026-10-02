import { readFileSync } from "node:fs";
import { stripTypes } from "../strip.ts";

type ExecArgs = { command: string; yieldMs?: number };
type ExecResult = { status: string; exitCode?: number | null; aggregated: string };

const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor as new (
  ...args: string[]
) => (...params: unknown[]) => Promise<void>;

// Runs an automation the way OpenClaw's headless code mode does, after the same type stripping
// the build applies: top-level await, `exec` and `json` globals, and a frozen `trigger.state`.
// Returns the last json() value.
export async function runAutomation(
  file: string,
  { state, execResult }: { state?: unknown; execResult: ExecResult | ((args: ExecArgs) => ExecResult) },
) {
  const source = stripTypes(readFileSync(new URL(`../automations/${file}`, import.meta.url), "utf8"));
  const calls: ExecArgs[] = [];
  let output: any;
  const exec = async (args: ExecArgs) => {
    calls.push(args);
    return typeof execResult === "function" ? execResult(args) : execResult;
  };
  const json = (value: unknown) => {
    output = JSON.parse(JSON.stringify(value));
  };
  const trigger = Object.freeze({ state: state === undefined ? undefined : deepFreeze(structuredClone(state)) });
  await new AsyncFunction("exec", "json", "trigger", source)(exec, json, trigger);
  return { output, calls };
}

export function completed(stdout: unknown): ExecResult {
  return { status: "completed", exitCode: 0, aggregated: typeof stdout === "string" ? stdout : JSON.stringify(stdout) };
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object") {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

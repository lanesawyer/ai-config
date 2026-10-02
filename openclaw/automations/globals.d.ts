// Globals that OpenClaw's headless code mode provides to script payloads and trigger scripts.

interface ExecResult {
  status: string;
  exitCode?: number | null;
  aggregated: string;
}

declare function exec(args: { command: string; yieldMs?: number }): Promise<ExecResult | undefined>;
declare function json(value: unknown): void;
declare const trigger: { readonly state?: unknown };

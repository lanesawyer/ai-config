import { stripTypeScriptTypes } from "node:module";

export function stripTypes(source: string): string {
  return stripTypeScriptTypes(source, { mode: "strip" });
}

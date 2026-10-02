import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { stripTypes } from "./strip.ts";

const src = new URL("./automations/", import.meta.url);
const out = new URL("./dist/", import.meta.url);
mkdirSync(out, { recursive: true });

for (const file of readdirSync(src)) {
  if (!file.endsWith(".ts") || file.endsWith(".d.ts")) continue;
  const js = stripTypes(readFileSync(new URL(file, src), "utf8"));
  const target = new URL(file.replace(/\.ts$/, ".js"), out);
  writeFileSync(target, js);
  console.log(`dist/${file.replace(/\.ts$/, ".js")}`);
}

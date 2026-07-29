import { cp, mkdir, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const release = resolve(root, "dist", "hudbacastum");
const files = ["index.js", "style.css", "manifest.json", "README.md", "LICENSE"];

const check = spawnSync(process.execPath, [resolve(root, "scripts", "check.mjs")], { cwd: root, stdio: "inherit" });
if (check.status !== 0) process.exit(check.status || 1);

await rm(release, { recursive: true, force: true });
await mkdir(release, { recursive: true });
for (const file of files) await cp(resolve(root, file), resolve(release, file));

console.log(`✓ Release folder written to ${release}`);

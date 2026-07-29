import { cp, mkdir, rm } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const appFolder = "hudbacastum";
const configRoot = process.env.SPICETIFY_CONFIG || (process.platform === "win32"
  ? join(process.env.APPDATA || join(homedir(), "AppData", "Roaming"), "spicetify")
  : join(process.env.XDG_CONFIG_HOME || join(homedir(), ".config"), "spicetify"));
const destination = join(configRoot, "CustomApps", appFolder);
const appFiles = ["index.js", "style.css", "manifest.json"];

await rm(destination, { recursive: true, force: true });
await mkdir(destination, { recursive: true });
for (const file of appFiles) await cp(join(root, file), join(destination, file));

const command = process.platform === "win32" ? "spicetify.exe" : "spicetify";
for (const args of [["config", "custom_apps", appFolder], ["apply"]]) {
  const result = spawnSync(command, args, { stdio: "inherit", shell: process.platform === "win32" });
  if (result.error || result.status !== 0) {
    console.error(`Auraloom was copied to ${destination}, but Spicetify could not run automatically.`);
    console.error(`Run: spicetify ${args.join(" ")}`);
    process.exit(result.status || 1);
  }
}

console.log(`✓ Auraloom installed at ${destination}. Restart Spotify, then open Auraloom from the sidebar.`);

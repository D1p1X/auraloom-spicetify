import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = resolve(root, "manifest.json");
const sourcePath = resolve(root, "index.js");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const source = await readFile(sourcePath, "utf8");

const requiredManifestFields = ["name", "description", "preview", "readme", "icon", "active-icon"];
const missing = requiredManifestFields.filter((field) => !manifest[field]);
if (missing.length) throw new Error(`manifest.json is missing: ${missing.join(", ")}`);
if (!Array.isArray(manifest.tags) || !manifest.tags.length) throw new Error("manifest.json needs at least one Marketplace tag");
if (!source.includes("const render = () => h(Auraloom);")) throw new Error("index.js does not expose the Auraloom custom-app render entrypoint");

console.log(`✓ ${manifest.name} manifest, Marketplace metadata and custom-app entrypoint are valid.`);

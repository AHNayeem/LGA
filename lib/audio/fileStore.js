import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";

// File-based sink and manifest for the offline generator (scripts only; never imported by
// the app). Generated files go to public/media/<key> and ship with the deployment as
// static assets; the manifest records what exists so later runs only fill gaps.

export const DEFAULT_MANIFEST_PATH = "content/audio/manifest.json";
export const DEFAULT_PUBLIC_MEDIA_DIR = "public/media";

export function publicDirSink(dir = DEFAULT_PUBLIC_MEDIA_DIR) {
  const root = resolve(dir);
  return {
    async write({ key, bytes }) {
      const path = resolve(join(root, key));
      if (!path.startsWith(root + sep)) throw new Error(`Refusing to write outside ${root}: ${key}`);
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, bytes);
      return { driver: "static", key };
    },
  };
}

export function readManifest(path = DEFAULT_MANIFEST_PATH) {
  if (!existsSync(path)) return [];
  const json = JSON.parse(readFileSync(path, "utf8"));
  return Array.isArray(json.entries) ? json.entries : [];
}

export function writeManifest(entries, path = DEFAULT_MANIFEST_PATH) {
  mkdirSync(dirname(path), { recursive: true });
  const sorted = [...entries].sort((a, b) => a.hash.localeCompare(b.hash));
  writeFileSync(path, `${JSON.stringify({ version: 1, entries: sorted }, null, 2)}\n`);
}

// An entry only counts as present if its file is still on disk.
export function fileManifestRegistry({ manifestPath = DEFAULT_MANIFEST_PATH, mediaDir = DEFAULT_PUBLIC_MEDIA_DIR } = {}) {
  const entries = new Map(readManifest(manifestPath).map((e) => [e.hash, e]));
  const fileExists = (e) => e.driver === "static" && existsSync(join(mediaDir, e.key));
  return {
    entries,
    async has(hash) {
      const e = entries.get(hash);
      return Boolean(e && fileExists(e));
    },
    async record(entry) {
      entries.set(entry.hash, entry);
    },
    present() {
      return [...entries.values()].filter(fileExists);
    },
    save() {
      writeManifest([...entries.values()], manifestPath);
    },
  };
}

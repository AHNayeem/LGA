import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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

function readManifestFile(path) {
  if (!existsSync(path)) return { entries: [], settings: null };
  const json = JSON.parse(readFileSync(path, "utf8"));
  return { entries: Array.isArray(json.entries) ? json.entries : [], settings: json.settings ?? null };
}

export function readManifest(path = DEFAULT_MANIFEST_PATH) {
  return readManifestFile(path).entries;
}

// `settings` records the provider configuration of the last generation run (voices,
// encoding, speaking rates) so audio can be regenerated reproducibly.
export function writeManifest(entries, path = DEFAULT_MANIFEST_PATH, settings = null) {
  mkdirSync(dirname(path), { recursive: true });
  const sorted = [...entries].sort((a, b) => a.hash.localeCompare(b.hash));
  const body = { version: 1, ...(settings ? { settings } : {}), entries: sorted };
  writeFileSync(path, `${JSON.stringify(body, null, 2)}\n`);
}

// An entry only counts as present if its file is still on disk.
export function fileManifestRegistry({ manifestPath = DEFAULT_MANIFEST_PATH, mediaDir = DEFAULT_PUBLIC_MEDIA_DIR } = {}) {
  const file = readManifestFile(manifestPath);
  const entries = new Map(file.entries.map((e) => [e.hash, e]));
  let settings = file.settings;
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
    setSettings(next) {
      settings = next;
    },
    // Removes entries (and their static files) that no content needs any more.
    prune(neededHashes) {
      const root = resolve(mediaDir);
      const removed = [];
      for (const [hash, e] of entries) {
        if (neededHashes.has(hash)) continue;
        const path = resolve(join(root, e.key));
        if (e.driver === "static" && path.startsWith(root + sep)) rmSync(path, { force: true });
        entries.delete(hash);
        removed.push(hash);
      }
      return removed;
    },
    save() {
      writeManifest([...entries.values()], manifestPath, settings);
    },
  };
}

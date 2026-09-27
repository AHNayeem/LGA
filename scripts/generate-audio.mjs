// Offline German audio generation (run by a developer, never at request time).
//
//   bun run audio:generate -- --dry-run            list cues that have no audio yet
//   TTS_PROVIDER=google GOOGLE_TTS_API_KEY=… bun run audio:generate
//   bun run audio:generate -- --force              regenerate everything
//
// Writes public/media/tts/<hash>.mp3 and content/audio/manifest.json. Commit both, then
// run `bun run seed` against each database to register the assets. Keys are read from the
// shell / .env.local and never written anywhere.
import { CURRICULUM } from "@/content/curriculum/index.js";
import { curriculumCues } from "@/lib/audio/cues";
import { generateAudio } from "@/lib/audio/generate";
import { fileManifestRegistry, publicDirSink } from "@/lib/audio/fileStore";
import { createTtsProvider } from "@/lib/audio/providers";

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const option = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};

const dryRun = flag("dry-run");
const force = flag("force");
const providerName = option("provider") ?? process.env.TTS_PROVIDER;

const cues = curriculumCues(CURRICULUM);
const registry = fileManifestRegistry();

let provider = null;
if (!dryRun) {
  if (!providerName) {
    console.error("Set TTS_PROVIDER (or --provider). Use --dry-run to only list missing audio.");
    process.exit(1);
  }
  if (providerName === "fake") {
    console.error("The fake provider only produces silence and is for tests. Refusing to write it into public/media.");
    process.exit(1);
  }
  provider = createTtsProvider(providerName);
}

const stats = await generateAudio({
  cues,
  provider,
  sink: publicDirSink(),
  registry,
  force,
  dryRun,
  log: (line) => console.log(line),
});
if (!dryRun) registry.save();

const needed = new Set(cues.keys());
const orphans = [...registry.entries.keys()].filter((h) => !needed.has(h));

console.log(
  `\nCues: ${stats.total}. Generated: ${stats.generated}. Already present: ${stats.skipped}.` +
    (dryRun ? ` Missing: ${stats.missing}.` : "") +
    (stats.failed.length ? ` Failed: ${stats.failed.length}.` : ""),
);
if (orphans.length) console.log(`${orphans.length} manifest entries are no longer used by any content (kept).`);
if (stats.failed.length) process.exitCode = 1;

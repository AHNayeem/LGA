// Offline German audio generation (run by a developer, never at request time).
//
//   bun run audio:generate -- --dry-run                      list cues that have no audio yet
//   bun run audio:smoke                                      FIRST: voice check + samples to listen to
//   TTS_PROVIDER=google bun run audio:generate -- --voices-verified
//                                                            generate the missing clips
//   … -- --voices-verified --force                           regenerate everything
//   bun run audio:generate -- --prune                        drop clips no content uses any more
//
// Writes public/media/tts/<hash>.mp3 and content/audio/manifest.json (including the voice
// settings used). Then run `bun run audio:verify`, commit both, and `bun run seed` against
// each database to register the assets. Keys are read from the shell / .env.local and are
// never written anywhere.
import { AUDIO_CONTENT } from "@/content/audioContent.js";
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
const prune = flag("prune");
const providerName = option("provider") ?? process.env.TTS_PROVIDER;

const cues = curriculumCues(AUDIO_CONTENT);
const registry = fileManifestRegistry();

if (prune) {
  const removed = registry.prune(new Set(cues.keys()));
  registry.save();
  console.log(`Pruned ${removed.length} unused clip(s).`);
  if (!providerName || dryRun) process.exit(0);
}

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
  if (!flag("voices-verified")) {
    console.error(
      "Run `bun run audio:smoke` first and listen to the samples. Once the voices are confirmed, re-run with --voices-verified.",
    );
    process.exit(1);
  }
  provider = createTtsProvider(providerName);
  if (provider.verifyVoices) {
    const check = await provider.verifyVoices("de-DE");
    if (!check.ok) {
      console.error(`Voice check failed:\n  ${check.problems.join("\n  ")}`);
      process.exit(1);
    }
    console.log(`Voices verified against the provider: ${Object.values(provider.voiceMap).join(", ")}`);
  }
  registry.setSettings({ provider: provider.name, ...(provider.settings ?? {}), language: "de-DE", recordedAt: new Date().toISOString() });
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
if (orphans.length) console.log(`${orphans.length} manifest entries are no longer used by any content (remove with --prune).`);
if (!dryRun) console.log("Next: bun run audio:verify");
if (stats.failed.length) process.exitCode = 1;

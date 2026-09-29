// Usage: bun run audio:verify [-- --allow-orphans] [--json]
//
// Verifies content/audio/manifest.json and public/media/tts/ against the curriculum:
// every needed clip exists, nothing unexpected is present, file names match their cue
// hashes, files are non-empty, parseable MP3s with a plausible duration, and every
// listening exercise (including the module test) has its audio. Exits 1 on any error.
import { CURRICULUM } from "@/content/curriculum/index.js";
import { DEFAULT_MANIFEST_PATH, DEFAULT_PUBLIC_MEDIA_DIR } from "@/lib/audio/fileStore";
import { verifyAudio } from "@/lib/audio/verify";

const args = process.argv.slice(2);
const report = verifyAudio({
  moduleDefs: CURRICULUM,
  manifestPath: DEFAULT_MANIFEST_PATH,
  mediaDir: DEFAULT_PUBLIC_MEDIA_DIR,
  allowOrphans: args.includes("--allow-orphans"),
});

if (args.includes("--json")) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(JSON.stringify(report.summary, null, 2));
  for (const w of report.warnings) console.log(`WARN  ${w}`);
  for (const e of report.errors.slice(0, 200)) console.log(`ERROR ${e}`);
  if (report.errors.length > 200) console.log(`… and ${report.errors.length - 200} more errors.`);
  console.log(report.ok ? "\nAudio OK." : `\nAudio verification FAILED with ${report.errors.length} error(s).`);
}
if (!report.ok) process.exitCode = 1;

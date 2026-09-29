// Usage: TTS_PROVIDER=google bun run audio:smoke [-- --out .audio-smoke/run1]
//
// Real-API smoke test before any full generation: checks the configured voices against
// the provider's current catalogue, synthesises 20 sample clips (every voice; slow and
// normal; umlauts, spelling, phone numbers, an e-mail address) through the production
// pipeline, validates them, and writes friendly-named copies plus LISTEN.txt for a person
// to listen to. Output stays in .audio-smoke/ (gitignored), never in public/.
// The API key is read from the environment / .env.local and is never printed or stored.
import { createTtsProvider } from "@/lib/audio/providers";
import { runSmokeTest } from "@/lib/audio/smoke";

const args = process.argv.slice(2);
const i = args.indexOf("--out");
const outDir = i >= 0 ? args[i + 1] : `.audio-smoke/${new Date().toISOString().replace(/[:.]/g, "-")}`;
const providerName = process.env.TTS_PROVIDER ?? "google";

if (providerName === "fake") {
  console.error("The smoke test is for a real provider. (The fake provider is covered by the unit tests.)");
  process.exit(1);
}

try {
  const provider = createTtsProvider(providerName);
  const res = await runSmokeTest({ provider, outDir, log: (l) => console.log(l) });
  if (res.stage === "voices") {
    console.error(`Voice check failed:\n  ${res.problems.join("\n  ")}`);
    process.exit(1);
  }
  for (const s of res.samples) console.log(`${s.ok ? "ok " : "BAD"} ${s.file ?? "-"} ${s.durationSec ?? "?"}s ${s.sampleRate ?? "?"}Hz ${s.bitrateKbps ?? "?"}kbps`);
  for (const p of res.problems) console.error(`PROBLEM ${p}`);
  console.log(`\n${res.samples.filter((s) => s.ok).length}/${res.samples.length} samples valid. Listen to them in ${res.outDir}/listen (see LISTEN.txt).`);
  console.log(res.ok ? "If they sound right: TTS_PROVIDER=google bun run audio:generate -- --voices-verified" : "Smoke test FAILED.");
  if (!res.ok) process.exitCode = 1;
} catch (err) {
  console.error("audio:smoke failed:", err.message);
  process.exitCode = 1;
}

import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { cueHash, normalizeCue, SPEECH_RATES, VOICE_ROLES } from "@/lib/audio/cues";
import { generateAudio, memoryRegistry } from "@/lib/audio/generate";
import { publicDirSink } from "@/lib/audio/fileStore";
import { expectedStaticKey } from "@/lib/audio/manifest";
import { parseMp3 } from "@/lib/audio/mp3";
import { detectAudioType } from "@/lib/media/fileTypes";

// TTS smoke test: a small, real-API run BEFORE generating the full curriculum.
// 1. every configured voice is checked against the provider's live catalogue
// 2. a sample set is synthesised through the SAME pipeline as production generation
//    (generateAudio + static file sink, hash-named files) into a scratch directory
// 3. each file is validated (MP3 frames, duration, signature, hash-named key) and the
//    run is repeated to prove it is idempotent (hash matching finds every clip)
// 4. friendly-named copies + an index are written for a person to listen to
// Nothing is written to public/ or the manifest.

export const SMOKE_TEXTS = Object.freeze({
  umlauts: "Grüß Gott! Schöne Grüße aus München, Frau Müller. Tschüs!",
  spelling: "Mein Name ist Brandt: B, R, A, N, D, T. Und Yilmaz: Y, I, L, M, A, Z.",
  numbers: "Meine Telefonnummer ist 0176 45 12 38. Ich bin 19 Jahre alt.",
  email: "Meine E-Mail-Adresse ist lena.brandt@beispiel.de.",
  mixed: "Guten Tag! Woher kommen Sie? – Ich komme aus Österreich und wohne in Köln.",
});

// All voices × the four focus texts at "slow" (what most curriculum cues use), plus one
// mixed sentence per voice at "normal". 20 clips.
export function smokeSamples() {
  const samples = [];
  for (const voice of VOICE_ROLES) {
    for (const topic of ["umlauts", "spelling", "numbers", "email"]) samples.push({ topic, cue: normalizeCue({ text: SMOKE_TEXTS[topic], voice, rate: "slow" }) });
    samples.push({ topic: "mixed", cue: normalizeCue({ text: SMOKE_TEXTS.mixed, voice, rate: "normal" }) });
  }
  return samples.map((s, i) => ({ ...s, n: i + 1, hash: cueHash(s.cue) }));
}

const slugify = (s) => s.replace(/[^a-zA-Z0-9-]+/g, "-").replace(/^-|-$/g, "");

export async function runSmokeTest({ provider, outDir, log = () => {} }) {
  const root = resolve(outDir);
  const problems = [];

  // 1. Voices.
  let voiceCheck = null;
  if (provider.verifyVoices) {
    voiceCheck = await provider.verifyVoices("de-DE");
    if (!voiceCheck.ok) return { ok: false, stage: "voices", problems: voiceCheck.problems, voiceCheck, samples: [] };
    log(`Voices OK: ${Object.values(provider.voiceMap).join(", ")}`);
  }

  // 2. Generate through the production pipeline into the scratch dir.
  const samples = smokeSamples();
  const cues = new Map(samples.map((s) => [s.hash, s.cue]));
  const registry = memoryRegistry();
  const sink = publicDirSink(join(root, "media"));
  const first = await generateAudio({ cues, provider, sink, registry, log });
  for (const f of first.failed) problems.push(`synthesis failed for ${f.hash} ("${f.text}"): ${f.error}`);

  // 3. Validate each file, then re-run to prove hash matching skips everything.
  const results = [];
  for (const s of samples) {
    const entry = registry.entries.get(s.hash);
    const row = { n: s.n, topic: s.topic, voiceRole: s.cue.voice, rate: s.cue.rate, text: s.cue.text, hash: s.hash, providerVoice: entry?.providerVoice ?? null };
    if (!entry) {
      results.push({ ...row, ok: false, error: "not generated" });
      continue;
    }
    if (entry.key !== expectedStaticKey(s.hash)) problems.push(`${s.hash}: stored as ${entry.key}, expected ${expectedStaticKey(s.hash)}`);
    const bytes = readFileSync(join(root, "media", entry.key));
    const mp3 = parseMp3(bytes);
    const sig = detectAudioType(bytes);
    const ok = mp3.ok && mp3.durationSec >= 0.5 && sig?.mime === "audio/mpeg";
    if (!ok) problems.push(`${s.hash}: invalid audio (${mp3.error ?? `duration ${mp3.durationSec}s, signature ${sig?.mime ?? "none"}`})`);
    const file = `${String(s.n).padStart(2, "0")}-${s.cue.voice}-${s.cue.rate}-${slugify(entry.providerVoice ?? "")}-${s.topic}.mp3`;
    mkdirSync(join(root, "listen"), { recursive: true });
    copyFileSync(join(root, "media", entry.key), join(root, "listen", file));
    results.push({ ...row, ok, file: `listen/${file}`, bytes: bytes.byteLength, durationSec: Math.round(mp3.durationSec * 100) / 100, sampleRate: mp3.sampleRate, bitrateKbps: mp3.bitrateKbps, error: mp3.error });
  }
  const second = await generateAudio({ cues, provider, sink, registry });
  if (second.generated !== 0 || second.skipped !== cues.size) problems.push(`re-run was not idempotent (generated ${second.generated}, skipped ${second.skipped})`);

  // 4. Index for manual listening.
  const summary = {
    ok: problems.length === 0,
    provider: provider.name,
    settings: provider.settings ?? null,
    rates: Object.fromEntries(SPEECH_RATES.map((r) => [r, provider.settings?.speakingRates?.[r] ?? null])),
    generatedAt: new Date().toISOString(),
    problems,
    samples: results,
  };
  writeFileSync(join(root, "samples.json"), `${JSON.stringify(summary, null, 2)}\n`);
  const lines = [
    "TTS smoke test – listen to every file before generating the full curriculum.",
    "Check: natural German pronunciation, umlauts (ü, ö, ä, ß), spelled letters, phone numbers,",
    "the e-mail address, and that 'slow' is slower but still natural.",
    "",
    ...results.map((r) => `${r.file ?? "(missing)"}\t${r.providerVoice ?? "?"}\t${r.rate}\t${r.ok ? "valid" : `INVALID: ${r.error}`}\t${r.text}`),
  ];
  writeFileSync(join(root, "LISTEN.txt"), `${lines.join("\n")}\n`);
  return { ...summary, stage: "done", voiceCheck, outDir: root };
}

import { parseMp3 } from "@/lib/audio/mp3";

// Offline audio generation. Given the cues content needs, synthesises only the ones that
// don't exist yet, writes them through a sink and records them in a registry.
// Idempotent: a second run with the same content generates nothing.
//
//   sink:     write({ key, bytes, contentType }) -> { driver, key }
//   registry: has(hash) -> boolean, record(entry)

export async function generateAudio({ cues, provider, sink, registry, force = false, dryRun = false, log = () => {} }) {
  const stats = { total: cues.size, generated: 0, skipped: 0, missing: 0, failed: [] };
  for (const [hash, cue] of cues) {
    if (!force && (await registry.has(hash))) {
      stats.skipped++;
      continue;
    }
    if (dryRun) {
      stats.missing++;
      log(`missing ${hash} ${cue.voice}/${cue.rate}: ${cue.text}`);
      continue;
    }
    try {
      const out = await provider.synthesize(cue);
      // Never store an MP3 that doesn't parse (truncated/empty responses).
      let durationSec;
      if (out.mime === "audio/mpeg") {
        const mp3 = parseMp3(out.bytes);
        if (!mp3.ok) throw new Error(`provider returned an invalid MP3 (${mp3.error})`);
        durationSec = Math.round(mp3.durationSec * 1000) / 1000;
      }
      const stored = await sink.write({ key: `tts/${hash}.${out.ext}`, bytes: out.bytes, contentType: out.mime });
      await registry.record({
        hash,
        driver: stored.driver,
        key: stored.key,
        mime: out.mime,
        size: out.bytes.byteLength,
        text: cue.text,
        voiceRole: cue.voice,
        rate: cue.rate,
        lang: cue.lang,
        provider: provider.name,
        providerVoice: out.voice ?? null,
        ...(out.speakingRate ? { speakingRate: out.speakingRate } : {}),
        ...(durationSec != null ? { durationSec } : {}),
        generatedAt: new Date().toISOString(),
      });
      stats.generated++;
      log(`generated ${hash}: ${cue.text}`);
    } catch (err) {
      stats.failed.push({ hash, text: cue.text, error: err.message });
      log(`FAILED ${hash}: ${err.message}`);
    }
  }
  return stats;
}

// Sink backed by a storage driver (gridfs/memory). Used by E2E and tests.
export function storageSink(storage) {
  return {
    async write({ key, bytes, contentType }) {
      const res = await storage.put({ key, body: bytes, contentType });
      return { driver: res.driver ?? storage.name, key: res.key ?? key };
    },
  };
}

// In-memory registry (tests).
export function memoryRegistry(initial = []) {
  const entries = new Map(initial.map((e) => [e.hash, e]));
  return {
    entries,
    async has(hash) {
      return entries.has(hash);
    },
    async record(entry) {
      entries.set(entry.hash, entry);
    },
  };
}

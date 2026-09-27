// Deterministic offline provider for tests and E2E: produces a short, valid silent WAV
// whose length scales with the text. Never use its output as curriculum audio.

function silentWav(seconds, sampleRate = 8000) {
  const samples = Math.round(seconds * sampleRate);
  const buf = Buffer.alloc(44 + samples);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + samples, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16); // PCM chunk size
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // mono
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate, 28); // byte rate (8-bit mono)
  buf.writeUInt16LE(1, 32); // block align
  buf.writeUInt16LE(8, 34); // bits per sample
  buf.write("data", 36);
  buf.writeUInt32LE(samples, 40);
  buf.fill(128, 44); // unsigned 8-bit silence
  return new Uint8Array(buf);
}

export function createFakeTtsProvider() {
  const calls = [];
  return {
    name: "fake",
    calls,
    async synthesize(cue) {
      calls.push(cue);
      const seconds = Math.min(4, 0.3 + cue.text.length * 0.02);
      return { bytes: silentWav(seconds), mime: "audio/wav", ext: "wav", voice: `fake-${cue.voice}` };
    },
  };
}

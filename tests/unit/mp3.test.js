import { describe, expect, it } from "vitest";
import { parseMp3 } from "@/lib/audio/mp3";
import { makeMp3 } from "@/tests/helpers/mp3";

describe("MP3 parser", () => {
  it("reads duration and format from frame headers", () => {
    const r = parseMp3(makeMp3({ seconds: 1.2 }));
    expect(r).toMatchObject({ ok: true, frames: 50, sampleRate: 24000, bitrateKbps: 32 });
    expect(r.durationSec).toBeCloseTo(1.2, 5);
  });

  it("skips an ID3v2 tag", () => {
    expect(parseMp3(makeMp3({ seconds: 0.48, id3: true }))).toMatchObject({ ok: true, frames: 20 });
  });

  it("rejects empty, non-MP3 and corrupt data", () => {
    expect(parseMp3(new Uint8Array(0))).toMatchObject({ ok: false, error: "empty file" });
    expect(parseMp3(new TextEncoder().encode("<html>not audio</html>".repeat(20))).ok).toBe(false);
    expect(parseMp3(new Uint8Array([0xff, 0xf3, 0x44, 0xc4, 0, 0])).ok).toBe(false); // one partial frame
    const good = makeMp3({ seconds: 2.4 });
    const corrupt = new Uint8Array(good.length + 4000);
    corrupt.set(good.slice(0, 960));
    corrupt.fill(0x41, 960); // garbage after 10 frames
    expect(parseMp3(corrupt)).toMatchObject({ ok: false });
    expect(parseMp3(corrupt).error).toMatch(/trailing data/);
  });
});

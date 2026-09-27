// Deterministic shuffling so the server can present items in a shuffled order and later
// map the learner's answer back without storing per-learner state. This hides the answer
// order from casual inspection; it is not a secret (practice mode, not an exam).

function hashString(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Returns a permutation of indices [0..n). Never the identity for n > 1, so the shuffled
// order never simply reveals the answer.
export function seededPermutation(n, seed) {
  const idx = Array.from({ length: n }, (_, i) => i);
  if (n < 2) return idx;
  const rand = mulberry32(hashString(String(seed)));
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  if (idx.every((v, i) => v === i)) idx.push(idx.shift());
  return idx;
}

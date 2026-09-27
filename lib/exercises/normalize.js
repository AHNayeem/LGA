// Answer normalisation for typed German answers. Pure, shared by grading and tests.

const TRAILING_PUNCTUATION = /[.!?,;:…]+$/u;

export function normalizeAnswer(value, { caseSensitive = false } = {}) {
  let v = String(value ?? "")
    .normalize("NFC")
    .replace(/[’‘`´]/g, "'")
    .replace(/[“”„]/g, '"')
    .replace(/\s+/g, " ")
    .trim()
    .replace(TRAILING_PUNCTUATION, "")
    .trim();
  if (!caseSensitive) v = v.toLocaleLowerCase("de-DE");
  return v;
}

// Learners without a German keyboard often type ae/oe/ue/ss. We accept these as correct
// but tell them the proper spelling.
export function foldUmlauts(v) {
  return v
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/Ä/g, "Ae")
    .replace(/Ö/g, "Oe")
    .replace(/Ü/g, "Ue")
    .replace(/ß/g, "ss");
}

// Returns "exact" | "umlaut" | null.
export function matchTypedAnswer(input, accepted, { caseSensitive = false, umlautTolerant = true, ignoreSpaces = false } = {}) {
  const squash = (v) => (ignoreSpaces ? v.replace(/[\s\-/]/g, "") : v);
  const given = squash(normalizeAnswer(input, { caseSensitive }));
  if (!given) return null;
  const targets = accepted.map((a) => squash(normalizeAnswer(a, { caseSensitive })));
  if (targets.includes(given)) return "exact";
  if (umlautTolerant) {
    const folded = foldUmlauts(given);
    if (targets.some((t) => foldUmlauts(t) === folded)) return "umlaut";
  }
  return null;
}

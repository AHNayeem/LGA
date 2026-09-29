// Module 5 vocabulary. Original entries (lemma, gender, plural, English meaning, our own
// example sentences). Topic scope follows the Module 5 mapping in docs/REFERENCE-ANALYSIS.md
// (clock time, daily routine, family, appointments); no word lists, translations or
// examples were copied from the reference books.
// Bangla meanings are intentionally absent until a reviewer adds them.
// Pure data: no imports, so tests and tooling can load it directly.

const n = (slug, article, lemma, plural, en, example, extra = {}) => ({
  slug,
  lemma,
  article,
  plural,
  pos: "noun",
  meanings: { en },
  ...(example ? { example } : {}),
  topics: extra.topics ?? [],
  ...(extra.notes ? { notes: extra.notes } : {}),
});

const w = (slug, lemma, pos, en, example, extra = {}) => ({
  slug,
  lemma,
  article: extra.article ?? null,
  plural: null,
  pos,
  meanings: { en },
  ...(example ? { example } : {}),
  topics: extra.topics ?? [],
  ...(extra.notes ? { notes: extra.notes } : {}),
});

// --- Lesson 1: telling the time ------------------------------------------------------
export const TIME = [
  n("uhr", "die", "Uhr", "die Uhren", "clock, watch; o'clock", { de: "Es ist acht Uhr.", en: "It's eight o'clock." }, {
    topics: ["uhrzeit"],
    notes: { en: "In times, Uhr never takes a plural: zwei Uhr, zehn Uhr." },
  }),
  n("uhrzeit", "die", "Uhrzeit", "die Uhrzeiten", "time (on the clock)", { de: "Schreiben Sie bitte die Uhrzeit.", en: "Please write the time." }, {
    topics: ["uhrzeit"],
  }),
  n("stunde", "die", "Stunde", "die Stunden", "hour", { de: "Der Kurs dauert zwei Stunden.", en: "The course lasts two hours." }, {
    topics: ["uhrzeit"],
  }),
  n("minute", "die", "Minute", "die Minuten", "minute", { de: "Eine Stunde hat sechzig Minuten.", en: "An hour has sixty minutes." }, {
    topics: ["uhrzeit"],
  }),
  w("wie-spaet-ist-es", "Wie spät ist es?", "phrase", "What time is it?", {
    de: "Entschuldigung, wie spät ist es? – Es ist neun Uhr.",
    en: "Excuse me, what time is it? – It's nine o'clock.",
  }, { topics: ["uhrzeit"], notes: { en: "Also: Wie viel Uhr ist es?" } }),
  w("halb", "halb", "adjective", "half; half past (+ the NEXT hour)", { de: "Es ist halb acht.", en: "It's half past seven (7:30)." }, {
    topics: ["uhrzeit"],
    notes: { en: "halb acht = 7:30 – half way to eight, not 8:30!" },
  }),
  w("viertel-nach", "Viertel nach", "phrase", "quarter past", { de: "Es ist Viertel nach drei.", en: "It's a quarter past three (3:15)." }, {
    topics: ["uhrzeit"],
    notes: { en: "Also with minutes: fünf nach drei (3:05), zehn nach drei (3:10)." },
  }),
  w("viertel-vor", "Viertel vor", "phrase", "quarter to", { de: "Es ist Viertel vor vier.", en: "It's a quarter to four (3:45)." }, {
    topics: ["uhrzeit"],
    notes: { en: "Also with minutes: zehn vor vier (3:50), fünf vor vier (3:55)." },
  }),
  w("frueh", "früh", "adjective", "early", { de: "Es ist sechs Uhr. Das ist früh!", en: "It's six o'clock. That's early!" }, {
    topics: ["uhrzeit"],
  }),
  w("spaet", "spät", "adjective", "late", { de: "Es ist schon elf Uhr. Es ist spät.", en: "It's already eleven o'clock. It's late." }, {
    topics: ["uhrzeit"],
  }),
];

// --- Lesson 2: daily routine -----------------------------------------------------------
export const ROUTINE = [
  n("alltag", "der", "Alltag", null, "everyday life, daily routine", { de: "Mein Alltag ist oft stressig.", en: "My everyday life is often stressful." }, {
    topics: ["alltag"],
  }),
  n("der-morgen", "der", "Morgen", "die Morgen", "morning", { de: "Am Morgen dusche ich.", en: "In the morning I take a shower." }, {
    topics: ["tageszeiten"],
    notes: { en: "Careful: morgen (small m) means “tomorrow”." },
  }),
  n("vormittag", "der", "Vormittag", "die Vormittage", "morning (until about noon)", {
    de: "Am Vormittag ist Frau Kaya im Büro.",
    en: "In the morning Ms Kaya is at the office.",
  }, { topics: ["tageszeiten"] }),
  n("nachmittag", "der", "Nachmittag", "die Nachmittage", "afternoon", { de: "Am Nachmittag lerne ich Deutsch.", en: "In the afternoon I study German." }, {
    topics: ["tageszeiten"],
  }),
  n("abend", "der", "Abend", "die Abende", "evening", { de: "Am Abend koche ich.", en: "In the evening I cook." }, { topics: ["tageszeiten"] }),
  n("nacht", "die", "Nacht", "die Nächte", "night", { de: "In der Nacht schlafe ich acht Stunden.", en: "At night I sleep eight hours." }, {
    topics: ["tageszeiten"],
    notes: { en: "am Morgen, am Abend – but: in der Nacht." },
  }),
  w("morgens", "morgens", "adverb", "in the morning(s)", { de: "Morgens trinke ich Tee.", en: "In the mornings I drink tea." }, {
    topics: ["tageszeiten"],
  }),
  w("abends", "abends", "adverb", "in the evening(s)", { de: "Abends bin ich müde.", en: "In the evenings I'm tired." }, {
    topics: ["tageszeiten"],
  }),
  w("fruehstuecken", "frühstücken", "verb", "to have breakfast", { de: "Wir frühstücken um sieben Uhr.", en: "We have breakfast at seven." }, {
    topics: ["alltag"],
  }),
  w("duschen", "duschen", "verb", "to take a shower", { de: "Ich dusche am Morgen.", en: "I take a shower in the morning." }, {
    topics: ["alltag"],
  }),
  w("schlafen", "schlafen", "verb", "to sleep", { de: "Am Sonntag schlafe ich lange.", en: "On Sunday I sleep late." }, {
    topics: ["alltag"],
    notes: { en: "Vowel change: du schläfst, er/sie schläft" },
  }),
  w("um-uhrzeit", "um", "preposition", "at (+ clock time)", { de: "Der Kurs beginnt um neun Uhr.", en: "The course starts at nine o'clock." }, {
    topics: ["uhrzeit"],
    notes: { en: "Question: Um wie viel Uhr …? (At what time …?)" },
  }),
  w("von-bis", "von … bis", "phrase", "from … to / until", { de: "Ich arbeite von acht bis vier Uhr.", en: "I work from eight to four." }, {
    topics: ["uhrzeit"],
  }),
  w("wann", "wann", "question_word", "when", { de: "Wann frühstückst du? – Um sieben.", en: "When do you have breakfast? – At seven." }, {
    topics: ["fragen"],
  }),
];

// --- Lesson 3: family ---------------------------------------------------------------------
export const FAMILY = [
  n("familie", "die", "Familie", "die Familien", "family", { de: "Meine Familie wohnt in Rostock.", en: "My family lives in Rostock." }, {
    topics: ["familie"],
  }),
  n("eltern", "die", "Eltern", null, "parents", { de: "Meine Eltern heißen Anke und Jörg.", en: "My parents are called Anke and Jörg." }, {
    topics: ["familie"],
    notes: { en: "Only used in the plural." },
  }),
  n("mutter", "die", "Mutter", "die Mütter", "mother", { de: "Das ist meine Mutter.", en: "This is my mother." }, {
    topics: ["familie"],
    notes: { en: "Informal: Mama." },
  }),
  n("vater", "der", "Vater", "die Väter", "father", { de: "Mein Vater ist 58 Jahre alt.", en: "My father is 58 years old." }, {
    topics: ["familie"],
    notes: { en: "Informal: Papa." },
  }),
  n("kind", "das", "Kind", "die Kinder", "child", { de: "Herr und Frau Berger haben zwei Kinder.", en: "Mr and Mrs Berger have two children." }, {
    topics: ["familie"],
  }),
  n("sohn", "der", "Sohn", "die Söhne", "son", { de: "Ihr Sohn heißt Leo.", en: "Their son is called Leo." }, { topics: ["familie"] }),
  n("tochter", "die", "Tochter", "die Töchter", "daughter", { de: "Unsere Tochter ist zehn.", en: "Our daughter is ten." }, {
    topics: ["familie"],
  }),
  n("geschwister", "die", "Geschwister", null, "siblings, brothers and sisters", { de: "Hast du Geschwister?", en: "Do you have any brothers or sisters?" }, {
    topics: ["familie"],
    notes: { en: "Only used in the plural." },
  }),
  n("bruder", "der", "Bruder", "die Brüder", "brother", { de: "Mein Bruder heißt Felix.", en: "My brother is called Felix." }, {
    topics: ["familie"],
  }),
  n("schwester", "die", "Schwester", "die Schwestern", "sister", { de: "Ich habe eine Schwester.", en: "I have a sister." }, {
    topics: ["familie"],
  }),
  n("oma", "die", "Oma", "die Omas", "grandma", { de: "Meine Oma ist 80 Jahre alt.", en: "My grandma is 80 years old." }, {
    topics: ["familie"],
    notes: { en: "Formal word: die Großmutter." },
  }),
  n("opa", "der", "Opa", "die Opas", "grandpa", { de: "Mein Opa wohnt in Bremen.", en: "My grandpa lives in Bremen." }, {
    topics: ["familie"],
    notes: { en: "Formal word: der Großvater." },
  }),
  n("mann", "der", "Mann", "die Männer", "man; husband", { de: "Das ist mein Mann, Tobias.", en: "This is my husband, Tobias." }, {
    topics: ["familie"],
    notes: { en: "die Frau means both “woman” and “wife”: meine Frau = my wife." },
  }),
  w("verheiratet", "verheiratet", "adjective", "married", { de: "Felix ist verheiratet.", en: "Felix is married." }, { topics: ["familie"] }),
];

// --- Lesson 4: appointments and being late ----------------------------------------------
export const APPOINTMENTS = [
  n("termin", "der", "Termin", "die Termine", "appointment", { de: "Ich habe um zehn Uhr einen Termin.", en: "I have an appointment at ten." }, {
    topics: ["termine"],
  }),
  w("telefonieren", "telefonieren", "verb", "to talk on the phone, to phone", { de: "Anna telefoniert mit Tom.", en: "Anna is on the phone with Tom." }, {
    topics: ["termine"],
  }),
  n("anrufbeantworter", "der", "Anrufbeantworter", "die Anrufbeantworter", "answering machine, voicemail", {
    de: "Das ist der Anrufbeantworter von Lisa Roth.",
    en: "This is Lisa Roth's voicemail.",
  }, { topics: ["termine"], notes: { en: "Also common: die Mailbox (on mobile phones)." } }),
  w("muessen", "müssen", "verb", "must, to have to", { de: "Ich muss heute arbeiten.", en: "I have to work today." }, {
    topics: ["modalverben"],
    notes: { en: "ich muss, du musst, er/sie muss, wir müssen, ihr müsst, sie/Sie müssen" },
  }),
  w("koennen", "können", "verb", "can, to be able to", { de: "Kannst du um acht Uhr kommen?", en: "Can you come at eight?" }, {
    topics: ["modalverben"],
    notes: { en: "ich kann, du kannst, er/sie kann, wir können, ihr könnt, sie/Sie können" },
  }),
  w("wollen", "wollen", "verb", "to want (to)", { de: "Wir wollen am Sonntag zusammen frühstücken.", en: "We want to have breakfast together on Sunday." }, {
    topics: ["modalverben"],
    notes: { en: "ich will, du willst, er/sie will, wir wollen, ihr wollt, sie/Sie wollen. Careful: ich will = I want (not “I will”)." },
  }),
  w("zeit-haben", "Zeit haben", "phrase", "to have time, to be free", { de: "Hast du am Freitag Zeit?", en: "Are you free on Friday?" }, {
    topics: ["termine"],
  }),
  w("tut-mir-leid", "Tut mir leid!", "phrase", "I'm sorry!", { de: "Tut mir leid, ich komme zu spät.", en: "I'm sorry, I'm late." }, {
    topics: ["termine"],
    notes: { en: "Full form: Es tut mir leid." },
  }),
  w("zu-spaet", "zu spät", "phrase", "(too) late", { de: "Der Bus kommt zu spät.", en: "The bus is late." }, {
    topics: ["termine"],
    notes: { en: "zu spät kommen = to be late" },
  }),
  w("puenktlich", "pünktlich", "adjective", "on time, punctual", { de: "Der Kurs beginnt pünktlich um neun.", en: "The course starts on time at nine." }, {
    topics: ["termine"],
  }),
  w("kein-problem", "Kein Problem!", "phrase", "No problem!", { de: "Du kommst um halb acht? Kein Problem!", en: "You're coming at half past seven? No problem!" }, {
    topics: ["termine"],
  }),
];

export const VOCABULARY = [...TIME, ...ROUTINE, ...FAMILY, ...APPOINTMENTS];

export const slugs = (list) => list.map((v) => v.slug);

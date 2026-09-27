// Module 1 vocabulary. Original entries (lemma, gender, plural, English meaning, our own
// example sentences). Topic scope follows the Module 1 mapping in docs/REFERENCE-ANALYSIS.md;
// no word lists, translations or examples were copied from the reference books.
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

const num = (value, lemma, notes) =>
  w(`zahl-${value}`, lemma, "numeral", String(value), null, { topics: ["zahlen"], ...(notes ? { notes: { en: notes } } : {}) });

// --- Lesson 1: greetings -----------------------------------------------------------
export const GREETINGS = [
  w("hallo", "hallo", "interjection", "hello, hi", { de: "Hallo, Tim!", en: "Hi, Tim!" }, { topics: ["begruessung"] }),
  w("guten-morgen", "Guten Morgen!", "phrase", "Good morning!", { de: "Guten Morgen, Frau Weber!", en: "Good morning, Ms Weber!" }, {
    topics: ["begruessung"],
    notes: { en: "Used until about 10 or 11 a.m." },
  }),
  w("guten-tag", "Guten Tag!", "phrase", "Hello! Good day! (formal)", { de: "Guten Tag, Herr Brandt!", en: "Hello, Mr Brandt!" }, {
    topics: ["begruessung"],
  }),
  w("guten-abend", "Guten Abend!", "phrase", "Good evening!", { de: "Guten Abend! Wie geht es Ihnen?", en: "Good evening! How are you?" }, {
    topics: ["begruessung"],
  }),
  w("gute-nacht", "Gute Nacht!", "phrase", "Good night!", { de: "Gute Nacht, Mia!", en: "Good night, Mia!" }, {
    topics: ["begruessung"],
    notes: { en: "Only when someone goes to bed, not as a greeting." },
  }),
  w("tschuess", "tschüs", "interjection", "bye (informal)", { de: "Tschüs, bis morgen!", en: "Bye, see you tomorrow!" }, {
    topics: ["begruessung"],
    notes: { en: "Both spellings are correct: tschüs and tschüss." },
  }),
  w("auf-wiedersehen", "Auf Wiedersehen!", "phrase", "Goodbye! (formal)", { de: "Auf Wiedersehen, Frau Keller!", en: "Goodbye, Ms Keller!" }, {
    topics: ["begruessung"],
  }),
  w("bis-bald", "bis bald", "phrase", "see you soon", { de: "Tschüs, bis bald!", en: "Bye, see you soon!" }, { topics: ["begruessung"] }),
  w("wie-gehts", "Wie geht's?", "phrase", "How are you? (informal)", { de: "Hallo, Lena! Wie geht's?", en: "Hi, Lena! How are you?" }, {
    topics: ["begruessung"],
    notes: { en: "Formal: Wie geht es Ihnen?" },
  }),
  w("danke", "danke", "interjection", "thank you, thanks", { de: "Danke, gut!", en: "Fine, thanks!" }, { topics: ["begruessung"] }),
  w("gut", "gut", "adjective", "good, well, fine", { de: "Es geht mir gut.", en: "I'm fine." }, { topics: ["begruessung"] }),
  n("herr", "der", "Herr", "die Herren", "Mr; gentleman", { de: "Das ist Herr Brandt.", en: "This is Mr Brandt." }, { topics: ["personen"] }),
  n("frau", "die", "Frau", "die Frauen", "Mrs, Ms; woman", { de: "Das ist Frau Weber.", en: "This is Ms Weber." }, { topics: ["personen"] }),
];

// --- Lesson 2: introducing yourself -------------------------------------------------
export const INTRODUCTIONS = [
  w("heissen", "heißen", "verb", "to be called", { de: "Ich heiße Jonas.", en: "My name is Jonas." }, {
    topics: ["vorstellung"],
    notes: { en: "du heißt, er/sie heißt" },
  }),
  w("sein", "sein", "verb", "to be", { de: "Ich bin Emma. Und wer bist du?", en: "I'm Emma. And who are you?" }, {
    topics: ["vorstellung"],
    notes: { en: "Irregular: ich bin, du bist, er/sie ist, wir sind, ihr seid, sie/Sie sind" },
  }),
  n("name", "der", "Name", "die Namen", "name", { de: "Mein Name ist Sara Klein.", en: "My name is Sara Klein." }, { topics: ["vorstellung"] }),
  n("vorname", "der", "Vorname", "die Vornamen", "first name", { de: "Mein Vorname ist Sara.", en: "My first name is Sara." }, {
    topics: ["vorstellung"],
  }),
  n("nachname", "der", "Nachname", "die Nachnamen", "surname, last name", { de: "Mein Nachname ist Klein.", en: "My surname is Klein." }, {
    topics: ["vorstellung"],
    notes: { en: "Also: der Familienname (on forms)." },
  }),
  w("ich", "ich", "pronoun", "I", { de: "Ich bin Paul.", en: "I'm Paul." }, { topics: ["vorstellung"] }),
  w("du", "du", "pronoun", "you (informal, one person)", { de: "Wie heißt du?", en: "What's your name?" }, { topics: ["vorstellung"] }),
  w("sie-formell", "Sie", "pronoun", "you (formal)", { de: "Wie heißen Sie?", en: "What is your name?" }, {
    topics: ["vorstellung"],
    notes: { en: "Always written with a capital S when it means formal “you”." },
  }),
  w("wer", "wer", "question_word", "who", { de: "Wer ist das?", en: "Who is that?" }, { topics: ["fragen"] }),
  w("wie", "wie", "question_word", "how; what (with names)", { de: "Wie heißt du?", en: "What's your name?" }, { topics: ["fragen"] }),
  w("was", "was", "question_word", "what", { de: "Was ist das?", en: "What is that?" }, { topics: ["fragen"] }),
  w("ja", "ja", "other", "yes", { de: "Bist du Tom? – Ja.", en: "Are you Tom? – Yes." }, { topics: ["vorstellung"] }),
  w("nein", "nein", "other", "no", { de: "Nein, ich bin Max.", en: "No, I'm Max." }, { topics: ["vorstellung"] }),
  w("und", "und", "conjunction", "and", { de: "Ich heiße Lara. Und du?", en: "My name is Lara. And you?" }, { topics: ["vorstellung"] }),
  w("entschuldigung", "Entschuldigung!", "interjection", "Excuse me! Sorry!", { de: "Entschuldigung, wie heißen Sie?", en: "Excuse me, what is your name?" }, {
    topics: ["vorstellung"],
  }),
];

// --- Lesson 3: countries, cities, languages ------------------------------------------
export const ORIGIN = [
  w("kommen", "kommen", "verb", "to come", { de: "Ich komme aus Bangladesch.", en: "I come from Bangladesh." }, { topics: ["herkunft"] }),
  w("aus", "aus", "preposition", "from (a place)", { de: "Sie kommt aus Österreich.", en: "She comes from Austria." }, { topics: ["herkunft"] }),
  w("woher", "woher", "question_word", "where … from", { de: "Woher kommst du?", en: "Where are you from?" }, { topics: ["fragen"] }),
  w("wohnen", "wohnen", "verb", "to live (somewhere)", { de: "Ich wohne in Berlin.", en: "I live in Berlin." }, { topics: ["herkunft"] }),
  w("wo", "wo", "question_word", "where", { de: "Wo wohnen Sie?", en: "Where do you live?" }, { topics: ["fragen"] }),
  w("in", "in", "preposition", "in", { de: "Er wohnt in Wien.", en: "He lives in Vienna." }, { topics: ["herkunft"] }),
  w("sprechen", "sprechen", "verb", "to speak", { de: "Ich spreche Bengali und Englisch.", en: "I speak Bengali and English." }, {
    topics: ["sprachen"],
    notes: { en: "Vowel change: du sprichst, er/sie spricht" },
  }),
  n("sprache", "die", "Sprache", "die Sprachen", "language", { de: "Ich spreche drei Sprachen.", en: "I speak three languages." }, {
    topics: ["sprachen"],
  }),
  n("land", "das", "Land", "die Länder", "country", { de: "Das Land heißt Österreich.", en: "The country is called Austria." }, {
    topics: ["herkunft"],
  }),
  n("stadt", "die", "Stadt", "die Städte", "city, town", { de: "Die Stadt heißt Dhaka.", en: "The city is called Dhaka." }, {
    topics: ["herkunft"],
  }),
  w("ein-bisschen", "ein bisschen", "phrase", "a little", { de: "Ich spreche ein bisschen Deutsch.", en: "I speak a little German." }, {
    topics: ["sprachen"],
  }),
  w("auch", "auch", "adverb", "also, too", { de: "Ich wohne auch in München.", en: "I live in Munich too." }, { topics: ["herkunft"] }),
  w("deutschland", "Deutschland", "proper_noun", "Germany", null, { topics: ["laender"] }),
  w("oesterreich", "Österreich", "proper_noun", "Austria", null, { topics: ["laender"] }),
  w("schweiz", "Schweiz", "proper_noun", "Switzerland", null, {
    article: "die",
    topics: ["laender"],
    notes: { en: "Used with the article: die Schweiz." },
  }),
  w("bangladesch", "Bangladesch", "proper_noun", "Bangladesh", null, { topics: ["laender"] }),
  w("indien", "Indien", "proper_noun", "India", null, { topics: ["laender"] }),
  w("spanien", "Spanien", "proper_noun", "Spain", null, { topics: ["laender"] }),
  w("deutsch", "Deutsch", "proper_noun", "German (language)", { de: "Ich spreche Deutsch.", en: "I speak German." }, { topics: ["sprachen"] }),
  w("englisch", "Englisch", "proper_noun", "English (language)", null, { topics: ["sprachen"] }),
  w("bengali", "Bengali", "proper_noun", "Bengali, Bangla (language)", null, {
    topics: ["sprachen"],
    notes: { en: "Also called Bengalisch." },
  }),
  w("spanisch", "Spanisch", "proper_noun", "Spanish (language)", null, { topics: ["sprachen"] }),
];

// --- Lesson 4: numbers ---------------------------------------------------------------
export const NUMBERS_0_10 = [
  num(0, "null"),
  num(1, "eins"),
  num(2, "zwei", "On the phone people often say “zwo” so it isn't confused with “drei”."),
  num(3, "drei"),
  num(4, "vier"),
  num(5, "fünf"),
  num(6, "sechs"),
  num(7, "sieben"),
  num(8, "acht"),
  num(9, "neun"),
  num(10, "zehn"),
];

export const NUMBERS_11_20 = [
  num(11, "elf"),
  num(12, "zwölf"),
  num(13, "dreizehn"),
  num(14, "vierzehn"),
  num(15, "fünfzehn"),
  num(16, "sechzehn", "sechzehn, not “sechszehn”."),
  num(17, "siebzehn", "siebzehn, not “siebenzehn”."),
  num(18, "achtzehn"),
  num(19, "neunzehn"),
  num(20, "zwanzig"),
  n("zahl", "die", "Zahl", "die Zahlen", "number", { de: "Wie heißt die Zahl auf Deutsch?", en: "What is the number in German?" }, {
    topics: ["zahlen"],
  }),
  n("telefonnummer", "die", "Telefonnummer", "die Telefonnummern", "phone number", { de: "Wie ist Ihre Telefonnummer?", en: "What is your phone number?" }, {
    topics: ["zahlen"],
  }),
  n("handynummer", "die", "Handynummer", "die Handynummern", "mobile number", { de: "Meine Handynummer ist 0176 12 34 56.", en: "My mobile number is 0176 12 34 56." }, {
    topics: ["zahlen"],
  }),
  w("alt", "alt", "adjective", "old", { de: "Wie alt bist du? – Ich bin 19.", en: "How old are you? – I'm 19." }, { topics: ["zahlen"] }),
  n("jahr", "das", "Jahr", "die Jahre", "year", { de: "Ich bin 20 Jahre alt.", en: "I'm 20 years old." }, { topics: ["zahlen"] }),
];

// --- Lesson 5: spelling ---------------------------------------------------------------
export const SPELLING = [
  n("alphabet", "das", "Alphabet", "die Alphabete", "alphabet", { de: "Das Alphabet: A, B, C …", en: "The alphabet: A, B, C …" }, {
    topics: ["alphabet"],
  }),
  n("buchstabe", "der", "Buchstabe", "die Buchstaben", "letter (of the alphabet)", { de: "Mein Name hat vier Buchstaben.", en: "My name has four letters." }, {
    topics: ["alphabet"],
  }),
  w("buchstabieren", "buchstabieren", "verb", "to spell", { de: "Buchstabieren Sie bitte!", en: "Please spell it!" }, { topics: ["alphabet"] }),
  n("e-mail-adresse", "die", "E-Mail-Adresse", "die E-Mail-Adressen", "e-mail address", {
    de: "Meine E-Mail-Adresse ist lena.brandt@beispiel.de.",
    en: "My e-mail address is lena.brandt@beispiel.de.",
  }, { topics: ["alphabet"], notes: { en: "Say @ as “ät” and . as “Punkt”." } }),
  n("punkt", "der", "Punkt", "die Punkte", "dot, full stop", { de: "lena Punkt brandt", en: "lena dot brandt" }, { topics: ["alphabet"] }),
  w("bitte", "bitte", "adverb", "please", { de: "Noch einmal, bitte!", en: "Once more, please!" }, { topics: ["kurs"] }),
  w("wie-bitte", "Wie bitte?", "phrase", "Pardon? Sorry? (didn't understand)", { de: "Wie bitte? Noch einmal, bitte.", en: "Pardon? Once more, please." }, {
    topics: ["kurs"],
  }),
  w("noch-einmal", "noch einmal", "phrase", "once more, again", { de: "Buchstabieren Sie das bitte noch einmal.", en: "Please spell that again." }, {
    topics: ["kurs"],
  }),
];

export const VOCABULARY = [...GREETINGS, ...INTRODUCTIONS, ...ORIGIN, ...NUMBERS_0_10, ...NUMBERS_11_20, ...SPELLING];

export const slugs = (list) => list.map((v) => v.slug);

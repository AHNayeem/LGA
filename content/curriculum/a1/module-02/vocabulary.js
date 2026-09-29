// Module 2 vocabulary. Original entries (lemma, gender, plural, English meaning, our own
// example sentences). Topic scope follows the Module 2 mapping in docs/REFERENCE-ANALYSIS.md
// (hobbies, jobs and workplaces, weekdays, numbers from 20, forms, age); no word lists,
// translations or examples were copied from the reference books. Words Module 1 already
// teaches (sein, sprechen, alt, das Jahr, der Wohnort label etc.) are reused, not redefined.
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

// --- Lesson 1: hobbies --------------------------------------------------------------
export const HOBBIES = [
  n("hobby", "das", "Hobby", "die Hobbys", "hobby", { de: "Mein Hobby ist Tanzen.", en: "My hobby is dancing." }, { topics: ["hobbys"] }),
  w("machen", "machen", "verb", "to do, to make", { de: "Was machst du gern?", en: "What do you like doing?" }, { topics: ["hobbys"] }),
  w("gern", "gern", "adverb", "gladly; verb + gern = to like doing something", { de: "Ich schwimme gern.", en: "I like swimming." }, {
    topics: ["hobbys"],
    notes: { en: "gern comes after the verb: Ich lese gern. Also spelled gerne." },
  }),
  w("lesen", "lesen", "verb", "to read", { de: "Ich lese gern Bücher.", en: "I like reading books." }, {
    topics: ["hobbys"],
    notes: { en: "Vowel change e → ie: du liest, er/sie liest" },
  }),
  w("fahren", "fahren", "verb", "to go (by vehicle), to drive, to ride", { de: "Jonas fährt gern Fahrrad.", en: "Jonas likes cycling." }, {
    topics: ["hobbys"],
    notes: { en: "Vowel change a → ä: du fährst, er/sie fährt" },
  }),
  w("sehen", "sehen", "verb", "to see, to watch", { de: "Mia sieht gern Filme.", en: "Mia likes watching films." }, {
    topics: ["hobbys"],
    notes: { en: "Vowel change e → ie: du siehst, er/sie sieht" },
  }),
  w("schwimmen", "schwimmen", "verb", "to swim", null, { topics: ["hobbys"] }),
  w("tanzen", "tanzen", "verb", "to dance", { de: "Lena tanzt sehr gern.", en: "Lena loves dancing." }, {
    topics: ["hobbys"],
    notes: { en: "du tanzt (not „tanzst“) – the stem already ends in -z." },
  }),
  w("spielen", "spielen", "verb", "to play", { de: "Wir spielen Fußball.", en: "We play football." }, { topics: ["hobbys"] }),
  w("hoeren", "hören", "verb", "to hear, to listen (to)", { de: "Paul hört gern Musik.", en: "Paul likes listening to music." }, {
    topics: ["hobbys"],
  }),
  n("fussball", "der", "Fußball", null, "football, soccer", { de: "Fußball ist mein Hobby.", en: "Football is my hobby." }, {
    topics: ["hobbys"],
    notes: { en: "As a sport it has no plural. (der Ball = the ball)" },
  }),
  n("musik", "die", "Musik", null, "music", null, { topics: ["hobbys"] }),
  n("buch", "das", "Buch", "die Bücher", "book", { de: "Anna liest gern Bücher.", en: "Anna likes reading books." }, { topics: ["hobbys"] }),
];

// --- Lesson 2: jobs -------------------------------------------------------------------
export const JOBS = [
  n("beruf", "der", "Beruf", "die Berufe", "job, profession", null, { topics: ["beruf"] }),
  w("was-sind-sie-von-beruf", "Was sind Sie von Beruf?", "phrase", "What do you do (for a living)?", {
    de: "Was sind Sie von Beruf? – Ich bin Ingenieurin.",
    en: "What do you do? – I'm an engineer.",
  }, { topics: ["beruf"], notes: { en: "Informal: Was bist du von Beruf?" } }),
  w("arbeiten", "arbeiten", "verb", "to work", { de: "Ich arbeite in Hamburg.", en: "I work in Hamburg." }, {
    topics: ["beruf"],
    notes: { en: "The stem ends in -t, so add an e: du arbeitest, er/sie arbeitet, ihr arbeitet" },
  }),
  w("als", "als", "other", "as (with jobs)", { de: "Er arbeitet als Koch.", en: "He works as a cook." }, { topics: ["beruf"] }),
  w("haben", "haben", "verb", "to have", { de: "Ich habe zwei Hobbys.", en: "I have two hobbies." }, {
    topics: ["beruf"],
    notes: { en: "Irregular: ich habe, du hast, er/sie hat, wir haben, ihr habt, sie/Sie haben" },
  }),
  n("lehrer", "der", "Lehrer", "die Lehrer", "teacher (male)", { de: "Herr Brandt ist Lehrer.", en: "Mr Brandt is a teacher." }, {
    topics: ["beruf"],
    notes: { en: "Female: die Lehrerin, die Lehrerinnen" },
  }),
  n("ingenieur", "der", "Ingenieur", "die Ingenieure", "engineer (male)", { de: "Tom ist Ingenieur.", en: "Tom is an engineer." }, {
    topics: ["beruf"],
    notes: { en: "Female: die Ingenieurin, die Ingenieurinnen" },
  }),
  n("krankenpfleger", "der", "Krankenpfleger", "die Krankenpfleger", "nurse (male)", { de: "Karim ist Krankenpfleger.", en: "Karim is a nurse." }, {
    topics: ["beruf"],
    notes: { en: "Female: die Krankenpflegerin, die Krankenpflegerinnen" },
  }),
  n("koch", "der", "Koch", "die Köche", "cook, chef (male)", { de: "Luca ist Koch.", en: "Luca is a cook." }, {
    topics: ["beruf"],
    notes: { en: "Female: die Köchin, die Köchinnen" },
  }),
  n("informatiker", "der", "Informatiker", "die Informatiker", "IT specialist, computer scientist (male)", {
    de: "Sara ist Informatikerin.",
    en: "Sara is an IT specialist.",
  }, { topics: ["beruf"], notes: { en: "Female: die Informatikerin, die Informatikerinnen" } }),
  n("student", "der", "Student", "die Studenten", "student (male, at university)", { de: "Arif ist Student in Leipzig.", en: "Arif is a student in Leipzig." }, {
    topics: ["beruf"],
    notes: { en: "Female: die Studentin, die Studentinnen" },
  }),
];

// --- Lesson 3: workplaces and weekdays -----------------------------------------------------
export const WORK_WEEK = [
  n("schule", "die", "Schule", "die Schulen", "school", { de: "Die Schule ist in Bonn.", en: "The school is in Bonn." }, {
    topics: ["arbeitsort"],
    notes: { en: "Learn as a phrase: in der Schule = at school" },
  }),
  n("firma", "die", "Firma", "die Firmen", "company, firm", { de: "Die Firma heißt Solartec.", en: "The company is called Solartec." }, {
    topics: ["arbeitsort"],
    notes: { en: "Learn as a phrase: Ich arbeite bei Solartec. = I work at/for Solartec." },
  }),
  n("krankenhaus", "das", "Krankenhaus", "die Krankenhäuser", "hospital", { de: "Das Krankenhaus ist in Kiel.", en: "The hospital is in Kiel." }, {
    topics: ["arbeitsort"],
    notes: { en: "Learn as a phrase: im Krankenhaus = in/at the hospital" },
  }),
  n("montag", "der", "Montag", "die Montage", "Monday", { de: "Am Montag arbeite ich.", en: "On Monday I work." }, {
    topics: ["wochentage"],
    notes: { en: "am Montag = on Monday. All the days of the week are masculine (der)." },
  }),
  n("dienstag", "der", "Dienstag", "die Dienstage", "Tuesday", null, { topics: ["wochentage"] }),
  n("mittwoch", "der", "Mittwoch", "die Mittwoche", "Wednesday", null, { topics: ["wochentage"] }),
  n("donnerstag", "der", "Donnerstag", "die Donnerstage", "Thursday", null, { topics: ["wochentage"] }),
  n("freitag", "der", "Freitag", "die Freitage", "Friday", null, { topics: ["wochentage"] }),
  n("samstag", "der", "Samstag", "die Samstage", "Saturday", { de: "Am Samstag spiele ich Fußball.", en: "On Saturday I play football." }, {
    topics: ["wochentage"],
    notes: { en: "In northern Germany also: der Sonnabend." },
  }),
  n("sonntag", "der", "Sonntag", "die Sonntage", "Sunday", null, { topics: ["wochentage"] }),
  n("wochenende", "das", "Wochenende", "die Wochenenden", "weekend", { de: "Am Wochenende lese ich gern.", en: "At the weekend I like reading." }, {
    topics: ["wochentage"],
  }),
  w("frei", "frei", "adjective", "free; off (not working)", { de: "Am Sonntag habe ich frei.", en: "I'm off on Sunday." }, {
    topics: ["wochentage"],
    notes: { en: "frei haben = to have time off" },
  }),
  w("doch", "doch", "other", "yes (answer to a negative question)", {
    de: "Hast du am Sonntag nicht frei? – Doch!",
    en: "Don't you have Sunday off? – Yes, I do!",
  }, { topics: ["fragen"] }),
];

// --- Lesson 4: numbers from 20 and forms -----------------------------------------------------
export const NUMBERS_FORMS = [
  num(30, "dreißig", "With ß and -ßig, not -zig: dreißig."),
  num(40, "vierzig"),
  num(50, "fünfzig"),
  num(60, "sechzig", "sechzig, not „sechszig“."),
  num(70, "siebzig", "siebzig, not „siebenzig“."),
  num(80, "achtzig"),
  num(90, "neunzig"),
  num(100, "hundert", "Also: einhundert. 1000 = tausend."),
  n("formular", "das", "Formular", "die Formulare", "form (to fill in)", { de: "Das Formular ist auf Deutsch.", en: "The form is in German." }, {
    topics: ["formular"],
  }),
  n("alter", "das", "Alter", null, "age", { de: "Alter: 32 Jahre", en: "Age: 32 years" }, {
    topics: ["formular"],
    notes: { en: "Used on forms. In conversation you ask: Wie alt sind Sie?" },
  }),
  n("adresse", "die", "Adresse", "die Adressen", "address", { de: "Meine Adresse ist Lindenweg 5 in Bremen.", en: "My address is Lindenweg 5 in Bremen." }, {
    topics: ["formular"],
    notes: { en: "In German addresses the house number comes after the street name." },
  }),
  n("postleitzahl", "die", "Postleitzahl", "die Postleitzahlen", "postcode, ZIP code", { de: "Die Postleitzahl ist 50667.", en: "The postcode is 50667." }, {
    topics: ["formular"],
    notes: { en: "Short form on forms: PLZ. German postcodes have five digits." },
  }),
  n("wohnort", "der", "Wohnort", "die Wohnorte", "place of residence, home town", { de: "Wohnort: Leipzig", en: "Place of residence: Leipzig" }, {
    topics: ["formular"],
  }),
];

export const VOCABULARY = [...HOBBIES, ...JOBS, ...WORK_WEEK, ...NUMBERS_FORMS];

export const slugs = (list) => list.map((v) => v.slug);

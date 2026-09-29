// Module 10 vocabulary. Original entries (lemma, gender, plural, English meaning, our own
// example sentences). Topic scope follows the Module 10 mapping in docs/REFERENCE-ANALYSIS.md
// (Netzwerk neu A1 Kap. 10, metadata only); no word lists, translations or examples were
// copied from the reference books. Bangla meanings are intentionally absent until a
// reviewer adds them.
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

// A Partizip II learned as a word card, with its infinitive and auxiliary in the notes.
const p2 = (lemma, en, example, notes) =>
  w(lemma, lemma, "verb", en, example, { topics: ["perfekt"], notes: { en: notes } });

// --- Lesson 1: talking about the past ---------------------------------------------------
export const PAST_TIME = [
  w("gestern", "gestern", "adverb", "yesterday", { de: "Gestern war ich zu Hause.", en: "Yesterday I was at home." }, { topics: ["vergangenheit"] }),
  w("vorgestern", "vorgestern", "adverb", "the day before yesterday", { de: "Vorgestern hatte ich keine Zeit.", en: "The day before yesterday I had no time." }, {
    topics: ["vergangenheit"],
  }),
  w("gestern-abend", "gestern Abend", "phrase", "yesterday evening, last night", { de: "Was hast du gestern Abend gemacht?", en: "What did you do last night?" }, {
    topics: ["vergangenheit"],
    notes: { en: "Also: gestern Morgen, gestern Nachmittag." },
  }),
  w("letzte-woche", "letzte Woche", "phrase", "last week", { de: "Letzte Woche war ich krank.", en: "Last week I was ill." }, { topics: ["vergangenheit"] }),
  w("letztes-jahr", "letztes Jahr", "phrase", "last year", { de: "Letztes Jahr war ich in Wien.", en: "Last year I was in Vienna." }, { topics: ["vergangenheit"] }),
  w("am-wochenende", "am Wochenende", "phrase", "at the weekend", { de: "Am Wochenende habe ich viel gelesen.", en: "I read a lot at the weekend." }, {
    topics: ["vergangenheit"],
  }),
  w("vor-einem-jahr", "vor einem Jahr", "phrase", "a year ago", { de: "Vor einem Jahr hatte ich noch keine Arbeit.", en: "A year ago I didn't have a job yet." }, {
    topics: ["vergangenheit"],
    notes: { en: "vor + dative means “ago”: vor zwei Tagen, vor drei Jahren." },
  }),
  w("wie-war-dein-wochenende", "Wie war dein Wochenende?", "phrase", "How was your weekend?", {
    de: "Wie war dein Wochenende? – Super, danke!",
    en: "How was your weekend? – Great, thanks!",
  }, { topics: ["vergangenheit"], notes: { en: "Formal: Wie war Ihr Wochenende?" } }),
];

export const PARTICIPLES_1 = [
  p2("gemacht", "done, made (Partizip II of machen)", { de: "Was hast du am Sonntag gemacht?", en: "What did you do on Sunday?" }, "machen → hat gemacht"),
  p2("gekauft", "bought (Partizip II of kaufen)", { de: "Ich habe ein Buch gekauft.", en: "I bought a book." }, "kaufen → hat gekauft"),
  p2("gegessen", "eaten (Partizip II of essen)", { de: "Wir haben Pizza gegessen.", en: "We ate pizza." }, "essen → hat gegessen (irregular)"),
  p2("getrunken", "drunk (Partizip II of trinken)", { de: "Er hat einen Kaffee getrunken.", en: "He drank a coffee." }, "trinken → hat getrunken (irregular)"),
  p2("gesehen", "seen (Partizip II of sehen)", { de: "Hast du den Film gesehen?", en: "Have you seen the film?" }, "sehen → hat gesehen (irregular)"),
];

// --- Lesson 2: school and studies ----------------------------------------------------------
export const SCHOOL = [
  n("schulzeit", "die", "Schulzeit", null, "school days, time at school", { de: "In meiner Schulzeit hatte ich viele Freunde.", en: "In my school days I had lots of friends." }, {
    topics: ["schule"],
  }),
  n("universitaet", "die", "Universität", "die Universitäten", "university", { de: "Paul studiert an der Universität Leipzig.", en: "Paul studies at Leipzig University." }, {
    topics: ["studium"],
    notes: { en: "Short form: die Uni." },
  }),
  n("studium", "das", "Studium", "die Studien", "(university) studies, degree course", { de: "Mein Studium war sehr interessant.", en: "My studies were very interesting." }, {
    topics: ["studium"],
  }),
  w("studieren", "studieren", "verb", "to study (at university)", { de: "Ich habe in Dhaka Informatik studiert.", en: "I studied computer science in Dhaka." }, {
    topics: ["studium"],
    notes: { en: "studieren → hat studiert. For learning in general (e.g. words for a test) use lernen." },
  }),
  n("pruefung", "die", "Prüfung", "die Prüfungen", "exam, test", { de: "Morgen habe ich eine Prüfung.", en: "I have an exam tomorrow." }, { topics: ["schule"] }),
  n("abitur", "das", "Abitur", null, "German school-leaving exam (qualifies for university)", { de: "Ich habe 2019 Abitur gemacht.", en: "I did my Abitur in 2019." }, {
    topics: ["schule"],
    notes: { en: "Often shortened to das Abi." },
  }),
  n("fach", "das", "Fach", "die Fächer", "subject (at school or university)", { de: "Welches Fach magst du?", en: "Which subject do you like?" }, { topics: ["schule"] }),
  n("ausbildung", "die", "Ausbildung", "die Ausbildungen", "vocational training, apprenticeship", { de: "Er macht eine Ausbildung als Koch.", en: "He is training to be a cook." }, {
    topics: ["schule"],
  }),
  n("sprachkurs", "der", "Sprachkurs", "die Sprachkurse", "language course", { de: "Ich habe einen Sprachkurs in Berlin gemacht.", en: "I did a language course in Berlin." }, {
    topics: ["schule"],
  }),
  n("zeugnis", "das", "Zeugnis", "die Zeugnisse", "school report; certificate", { de: "Das Zeugnis ist sehr gut.", en: "The report is very good." }, { topics: ["schule"] }),
  n("praktikum", "das", "Praktikum", "die Praktika", "internship, work placement", { de: "Ich habe ein Praktikum in einem Hotel gemacht.", en: "I did an internship in a hotel." }, {
    topics: ["studium"],
  }),
];

export const PARTICIPLES_2 = [
  p2("gelernt", "learned, studied (Partizip II of lernen)", { de: "Ich habe gestern Abend Deutsch gelernt.", en: "I studied German last night." }, "lernen → hat gelernt"),
  p2("gelesen", "read (Partizip II of lesen)", { de: "Hast du die E-Mail gelesen?", en: "Have you read the e-mail?" }, "lesen → hat gelesen (irregular)"),
  p2("geschrieben", "written (Partizip II of schreiben)", { de: "Wir haben im Kurs viel geschrieben.", en: "We wrote a lot in the course." }, "schreiben → hat geschrieben (irregular)"),
  p2("gearbeitet", "worked (Partizip II of arbeiten)", { de: "Sie hat drei Jahre in Köln gearbeitet.", en: "She worked in Cologne for three years." }, "arbeiten → hat gearbeitet (stem ends in -t, so -et)"),
  p2("telefoniert", "phoned (Partizip II of telefonieren)", { de: "Ich habe lange mit Mama telefoniert.", en: "I talked to Mum on the phone for a long time." }, "telefonieren → hat telefoniert (verbs in -ieren have no ge-)"),
];

// --- Lesson 3: looking for a job ------------------------------------------------------------
export const JOB_SEARCH = [
  n("stellenanzeige", "die", "Stellenanzeige", "die Stellenanzeigen", "job ad", { de: "Ich habe eine Stellenanzeige im Internet gelesen.", en: "I read a job ad on the internet." }, {
    topics: ["jobsuche"],
    notes: { en: "die Stelle + die Anzeige. In compound nouns the last word gives the article." },
  }),
  n("stelle", "die", "Stelle", "die Stellen", "job, position", { de: "Ich suche eine Stelle als Verkäuferin.", en: "I'm looking for a job as a shop assistant." }, {
    topics: ["jobsuche"],
  }),
  n("bewerbung", "die", "Bewerbung", "die Bewerbungen", "(job) application", { de: "Ich schreibe eine Bewerbung.", en: "I'm writing an application." }, { topics: ["jobsuche"] }),
  n("erfahrung", "die", "Erfahrung", "die Erfahrungen", "experience", { de: "Haben Sie Erfahrung als Kellner?", en: "Do you have experience as a waiter?" }, { topics: ["jobsuche"] }),
  n("lebenslauf", "der", "Lebenslauf", "die Lebensläufe", "CV, résumé", { de: "Bitte schicken Sie uns Ihren Lebenslauf.", en: "Please send us your CV." }, { topics: ["jobsuche"] }),
  n("teilzeit", "die", "Teilzeit", null, "part-time (work)", { de: "Ich möchte in Teilzeit arbeiten.", en: "I'd like to work part-time." }, { topics: ["jobsuche"] }),
  n("vollzeit", "die", "Vollzeit", null, "full-time (work)", { de: "Die Stelle ist in Vollzeit.", en: "The job is full-time." }, { topics: ["jobsuche"] }),
  w("flexibel", "flexibel", "adjective", "flexible", { de: "Die Arbeitszeiten sind flexibel.", en: "The working hours are flexible." }, { topics: ["jobsuche"] }),
  w("gesucht", "gesucht", "verb", "wanted (in ads); Partizip II of suchen", { de: "Verkäufer gesucht!", en: "Shop assistant wanted!" }, {
    topics: ["jobsuche"],
    notes: { en: "suchen → hat gesucht. In ads it is used alone: Kellner gesucht!" },
  }),
];

export const PARTICIPLES_SEIN = [
  p2("gefahren", "gone, travelled (Partizip II of fahren)", { de: "Ich bin mit dem Bus gefahren.", en: "I went by bus." }, "fahren → ist gefahren. Learn it as a chunk: ich bin gefahren."),
  p2("gegangen", "gone, walked (Partizip II of gehen)", { de: "Wir sind ins Kino gegangen.", en: "We went to the cinema." }, "gehen → ist gegangen. Learn it as a chunk: ich bin gegangen."),
  p2("gekommen", "come (Partizip II of kommen)", { de: "Wann bist du nach Hause gekommen?", en: "When did you come home?" }, "kommen → ist gekommen. Learn it as a chunk: ich bin gekommen."),
];

// --- Lesson 4: on the phone -------------------------------------------------------------------
export const PHONE = [
  w("hier-spricht", "Hier spricht …", "phrase", "This is … speaking (on the phone)", { de: "Guten Tag, hier spricht Lukas Brenner.", en: "Hello, this is Lukas Brenner speaking." }, {
    topics: ["telefon"],
  }),
  w("kann-ich-bitte-sprechen", "Kann ich bitte … sprechen?", "phrase", "Can I speak to …, please?", { de: "Kann ich bitte Frau Albers sprechen?", en: "Can I speak to Ms Albers, please?" }, {
    topics: ["telefon"],
  }),
  w("ich-verbinde-sie", "Ich verbinde Sie.", "phrase", "I'll put you through.", { de: "Einen Moment, ich verbinde Sie.", en: "One moment, I'll put you through." }, {
    topics: ["telefon"],
  }),
  w("nicht-da", "nicht da", "phrase", "not here, not in", { de: "Herr Kaya ist heute nicht da.", en: "Mr Kaya isn't in today." }, { topics: ["telefon"] }),
  w("kann-ich-etwas-ausrichten", "Kann ich etwas ausrichten?", "phrase", "Can I take a message?", {
    de: "Sie ist nicht im Büro. Kann ich etwas ausrichten?",
    en: "She isn't in the office. Can I take a message?",
  }, { topics: ["telefon"] }),
  w("zurueckrufen", "zurückrufen", "verb", "to call back", { de: "Können Sie mich bitte zurückrufen?", en: "Could you call me back, please?" }, {
    topics: ["telefon"],
    notes: { en: "Separable: ich rufe zurück." },
  }),
  n("mailbox", "die", "Mailbox", "die Mailboxen", "voicemail", { de: "Ich habe eine Nachricht auf der Mailbox.", en: "I have a message on my voicemail." }, {
    topics: ["telefon"],
  }),
  w("besetzt", "besetzt", "adjective", "busy, engaged (phone line); taken (seat)", { de: "Die Nummer ist besetzt.", en: "The line is busy." }, { topics: ["telefon"] }),
  w("auf-wiederhoeren", "Auf Wiederhören!", "phrase", "Goodbye! (on the phone)", { de: "Danke, auf Wiederhören!", en: "Thanks, goodbye!" }, {
    topics: ["telefon"],
    notes: { en: "On the phone you don't see each other, so you say Wiederhören (hear) instead of Wiedersehen (see)." },
  }),
];

export const VOCABULARY = [...PAST_TIME, ...PARTICIPLES_1, ...SCHOOL, ...PARTICIPLES_2, ...JOB_SEARCH, ...PARTICIPLES_SEIN, ...PHONE];

export const slugs = (list) => list.map((v) => v.slug);

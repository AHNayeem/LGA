// Module 7 vocabulary. Original entries (lemma, gender, plural, English meaning, our own
// example sentences). Topic scope follows the Module 7 mapping in docs/REFERENCE-ANALYSIS.md
// (Netzwerk neu A1 Kap. 7, metadata only); no word lists, translations or examples were
// copied from the reference books. Words already defined in other modules (e.g. die Firma,
// der Termin, der Aufzug, das Erdgeschoss) are not redefined here.
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

// --- Lesson 1: in the office -----------------------------------------------------------
export const OFFICE = [
  n("buero", "das", "Büro", "die Büros", "office", { de: "Mein Büro ist sehr klein.", en: "My office is very small." }, { topics: ["buero"] }),
  n("kollege", "der", "Kollege", "die Kollegen", "colleague (male)", { de: "Das ist mein Kollege Jan.", en: "This is my colleague Jan." }, {
    topics: ["buero"],
    notes: { en: "With mit and other dative prepositions: mit dem Kollegen (the noun adds -n)." },
  }),
  n("kollegin", "die", "Kollegin", "die Kolleginnen", "colleague (female)", { de: "Meine Kollegin heißt Nina Berger.", en: "My colleague is called Nina Berger." }, {
    topics: ["buero"],
  }),
  n("chef", "der", "Chef", "die Chefs", "boss", { de: "Der Chef ist heute nicht da.", en: "The boss isn't here today." }, {
    topics: ["buero"],
    notes: { en: "Female: die Chefin, die Chefinnen." },
  }),
  n("schreibtisch", "der", "Schreibtisch", "die Schreibtische", "desk", { de: "Der Schreibtisch ist neu.", en: "The desk is new." }, { topics: ["buero"] }),
  n("besprechung", "die", "Besprechung", "die Besprechungen", "meeting (at work)", {
    de: "Die Besprechung beginnt um zehn Uhr.",
    en: "The meeting starts at ten o'clock.",
  }, { topics: ["buero"] }),
];

export const EQUIPMENT = [
  n("computer", "der", "Computer", "die Computer", "computer", { de: "Der Computer ist sehr langsam.", en: "The computer is very slow." }, {
    topics: ["technik"],
  }),
  n("laptop", "der", "Laptop", "die Laptops", "laptop", { de: "Ich arbeite heute mit dem Laptop.", en: "I'm working on the laptop today." }, {
    topics: ["technik"],
    notes: { en: "Also possible: das Laptop." },
  }),
  n("drucker", "der", "Drucker", "die Drucker", "printer", { de: "Wo ist der Drucker?", en: "Where is the printer?" }, { topics: ["technik"] }),
  n("telefon", "das", "Telefon", "die Telefone", "telephone", { de: "Frau Klein, Telefon für Sie!", en: "Ms Klein, there's a call for you!" }, {
    topics: ["technik"],
  }),
  n("internet", "das", "Internet", null, "internet", { de: "Das Internet funktioniert nicht.", en: "The internet isn't working." }, {
    topics: ["technik"],
  }),
  w("drucken", "drucken", "verb", "to print", { de: "Kannst du das bitte drucken?", en: "Can you print that, please?" }, { topics: ["technik"] }),
  w("funktionieren", "funktionieren", "verb", "to work, to function (machines)", { de: "Der Computer funktioniert wieder.", en: "The computer is working again." }, {
    topics: ["technik"],
  }),
  w("kaputt", "kaputt", "adjective", "broken", { de: "Der Drucker ist schon wieder kaputt.", en: "The printer is broken again." }, { topics: ["technik"] }),
  w("oder", "oder", "conjunction", "or", { de: "Möchten Sie Tee oder Kaffee?", en: "Would you like tea or coffee?" }, { topics: ["konjunktionen"] }),
  w("aber", "aber", "conjunction", "but", { de: "Der Computer ist alt, aber er funktioniert.", en: "The computer is old, but it works." }, {
    topics: ["konjunktionen"],
    notes: { en: "Put a comma before aber." },
  }),
];

// --- Lesson 2: e-mails ------------------------------------------------------------------
export const EMAILS = [
  n("e-mail", "die", "E-Mail", "die E-Mails", "e-mail", { de: "Ich schreibe jeden Tag viele E-Mails.", en: "I write lots of e-mails every day." }, {
    topics: ["e-mail"],
    notes: { en: "In Austria and Switzerland also: das E-Mail." },
  }),
  n("anhang", "der", "Anhang", "die Anhänge", "attachment", { de: "Die Datei ist im Anhang.", en: "The file is attached." }, { topics: ["e-mail"] }),
  n("datei", "die", "Datei", "die Dateien", "file (on a computer)", { de: "Die Datei ist sehr groß.", en: "The file is very big." }, { topics: ["e-mail"] }),
  w("schicken", "schicken", "verb", "to send", { de: "Schicken Sie die Datei bitte heute.", en: "Please send the file today." }, { topics: ["e-mail"] }),
  w("antworten", "antworten", "verb", "to answer, to reply", { de: "Bitte antworten Sie bis Freitag.", en: "Please reply by Friday." }, {
    topics: ["e-mail"],
    notes: { en: "du antwortest, er/sie antwortet" },
  }),
  w("sehr-geehrte", "Sehr geehrte Frau … / Sehr geehrter Herr …", "phrase", "Dear Ms … / Dear Mr … (formal)", {
    de: "Sehr geehrter Herr Wagner,",
    en: "Dear Mr Wagner,",
  }, { topics: ["e-mail"], notes: { en: "Formal. Frau → geehrte, Herr → geehrter. Informal: Liebe … / Lieber …" } }),
  w("mit-freundlichen-gruessen", "Mit freundlichen Grüßen", "phrase", "Kind regards, Yours sincerely (formal)", null, {
    topics: ["e-mail"],
    notes: { en: "No comma after it; your name goes on the next line." },
  }),
  n("problem", "das", "Problem", "die Probleme", "problem", { de: "Wir haben ein Problem mit dem Drucker.", en: "We have a problem with the printer." }, {
    topics: ["e-mail"],
  }),
  n("kunde", "der", "Kunde", "die Kunden", "customer, client (male)", { de: "Der Kunde hat eine Frage.", en: "The customer has a question." }, {
    topics: ["e-mail"],
    notes: { en: "Dative: dem Kunden (the noun adds -n)." },
  }),
  n("kundin", "die", "Kundin", "die Kundinnen", "customer, client (female)", { de: "Die Kundin ruft heute an.", en: "The customer is calling today." }, {
    topics: ["e-mail"],
  }),
  w("dringend", "dringend", "adjective", "urgent", { de: "Die E-Mail ist dringend!", en: "The e-mail is urgent!" }, { topics: ["e-mail"] }),
];

// --- Lesson 3: colleagues and lunch break -------------------------------------------------
export const COLLEAGUES = [
  w("mit", "mit", "preposition", "with; by (transport)", { de: "Ich esse mit meiner Kollegin.", en: "I eat with my colleague." }, {
    topics: ["praepositionen"],
    notes: { en: "Always with the dative: mit dem, mit der, mit den …" },
  }),
  n("kantine", "die", "Kantine", "die Kantinen", "canteen (at work)", { de: "Wir essen in der Kantine.", en: "We eat in the canteen." }, {
    topics: ["kollegen"],
  }),
  w("mahlzeit", "Mahlzeit!", "interjection", "Enjoy your lunch! (greeting at lunchtime at work)", {
    de: "Mahlzeit, Jan! – Mahlzeit!",
    en: "Enjoy your lunch, Jan! – You too!",
  }, { topics: ["kollegen"], notes: { en: "Common among colleagues around lunchtime; informal." } }),
  w("viel-zu-tun", "viel zu tun haben", "phrase", "to be busy, to have a lot to do", { de: "Ich habe heute viel zu tun.", en: "I'm very busy today." }, {
    topics: ["kollegen"],
  }),
  w("stressig", "stressig", "adjective", "stressful", { de: "Die Woche ist sehr stressig.", en: "The week is very stressful." }, { topics: ["kollegen"] }),
  n("feierabend", "der", "Feierabend", "die Feierabende", "end of the working day, time after work", {
    de: "Um fünf Uhr habe ich Feierabend.",
    en: "I finish work at five o'clock.",
  }, { topics: ["kollegen"], notes: { en: "To colleagues in the evening: Schönen Feierabend!" } }),
  n("team", "das", "Team", "die Teams", "team", { de: "Unser Team ist sehr nett.", en: "Our team is very nice." }, { topics: ["kollegen"] }),
];

// --- Lesson 4: in the building and at the bank ----------------------------------------------
export const BUILDING = [
  n("gebaeude", "das", "Gebäude", "die Gebäude", "building", { de: "Das Gebäude ist sehr groß.", en: "The building is very big." }, { topics: ["gebaeude"] }),
  n("raum", "der", "Raum", "die Räume", "room", { de: "Die Besprechung ist in Raum 12.", en: "The meeting is in room 12." }, {
    topics: ["gebaeude"],
    notes: { en: "With a number there is no article: in Raum 12." },
  }),
  n("flur", "der", "Flur", "die Flure", "corridor, hallway", { de: "Der Drucker steht im Flur.", en: "The printer is in the corridor." }, {
    topics: ["gebaeude"],
  }),
  n("ordner", "der", "Ordner", "die Ordner", "folder, file (for papers or on a computer)", {
    de: "Der Ordner ist auf dem Schreibtisch.",
    en: "The folder is on the desk.",
  }, { topics: ["gebaeude"] }),
  n("empfang", "der", "Empfang", "die Empfänge", "reception (desk)", { de: "Frau Klein wartet am Empfang.", en: "Ms Klein is waiting at reception." }, {
    topics: ["gebaeude"],
  }),
  w("auf", "auf", "preposition", "on (top of)", { de: "Das Handy liegt auf dem Schreibtisch.", en: "The mobile phone is on the desk." }, {
    topics: ["praepositionen"],
  }),
  w("an", "an", "preposition", "at, on (a side or edge)", { de: "Jan sitzt am Computer.", en: "Jan is sitting at the computer." }, {
    topics: ["praepositionen"],
    notes: { en: "an + dem = am" },
  }),
  w("neben", "neben", "preposition", "next to", { de: "Der Drucker steht neben dem Schreibtisch.", en: "The printer is next to the desk." }, {
    topics: ["praepositionen"],
  }),
  w("bei", "bei", "preposition", "at (a person's place or a company)", { de: "Ich arbeite bei einer Bank.", en: "I work at a bank." }, {
    topics: ["praepositionen"],
    notes: { en: "bei + dem = beim: Jan ist beim Chef." },
  }),
];

export const BANK = [
  n("bank", "die", "Bank", "die Banken", "bank", { de: "Die Bank öffnet um neun Uhr.", en: "The bank opens at nine o'clock." }, { topics: ["bank"] }),
  n("konto", "das", "Konto", "die Konten", "(bank) account", { de: "Ich möchte ein Konto eröffnen.", en: "I'd like to open an account." }, {
    topics: ["bank"],
  }),
  n("geldautomat", "der", "Geldautomat", "die Geldautomaten", "cash machine, ATM", { de: "Wo ist hier ein Geldautomat?", en: "Where is there a cash machine here?" }, {
    topics: ["bank"],
    notes: { en: "Dative: am Geldautomaten (the noun adds -en)." },
  }),
  n("schalter", "der", "Schalter", "die Schalter", "counter (in a bank or post office)", {
    de: "Die Frau am Schalter ist sehr nett.",
    en: "The woman at the counter is very nice.",
  }, { topics: ["bank"] }),
  w("unterschreiben", "unterschreiben", "verb", "to sign", { de: "Unterschreiben Sie bitte hier.", en: "Please sign here." }, {
    topics: ["bank"],
    notes: { en: "Not separable: ich unterschreibe." },
  }),
  w("geld-abheben", "Geld abheben", "phrase", "to withdraw money", { de: "Ich möchte 100 Euro abheben.", en: "I'd like to withdraw 100 euros." }, {
    topics: ["bank"],
    notes: { en: "Separable: ich hebe Geld ab." },
  }),
];

export const VOCABULARY = [...OFFICE, ...EQUIPMENT, ...EMAILS, ...COLLEAGUES, ...BUILDING, ...BANK];

export const slugs = (list) => list.map((v) => v.slug);

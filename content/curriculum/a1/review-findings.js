// Open findings from the A1 content QA pass (docs/CURRICULUM-A1.md, "Content QA findings",
// 2026-09-29), in machine-readable form so the readiness report can show them on the
// lessons and exam they affect (lib/services/readinessService.js).
//
// These are questions for a human reviewer, not decisions: nothing here changes content,
// and none of them has been confirmed or rejected yet. A reviewer who resolves a finding
// (fixes the item in /admin, or confirms it is fine) removes its entry here, in the same
// change that records the outcome in CURRICULUM-A1.md.
//
// kind      answer_key         the key may mark a correct learner wrong
//           accepted_variants  a text input may reject a correct variant
//           pedagogy           grammar/words used before they are taught; register
//           idiom              German that needs a native speaker's confirmation
// targets   [{ collection, slug, items? }]  the exercises, grammar topics or words affected
//           (exam questions are exercises too)

export const REVIEW_FINDING_KINDS = Object.freeze({
  answer_key: "Answer key to confirm",
  accepted_variants: "Accepted answers to extend",
  pedagogy: "Taught-before-used check",
  idiom: "Native-speaker confirmation",
});

const ex = (slug, items) => ({ collection: "exercises", slug, ...(items ? { items } : {}) });
const grammar = (slug) => ({ collection: "grammarTopics", slug });
const word = (slug) => ({ collection: "vocabulary", slug });

export const REVIEW_FINDINGS = Object.freeze([
  // Answer keys that may mark a correct learner wrong
  { id: "AK-1", kind: "answer_key", targets: [ex("m7-email-lesen", ["q6"])], note: "\"Frau Berger schreibt die E-Mail.\" (key: false) is ambiguous: she did write an e-mail." },
  {
    id: "AK-2",
    kind: "answer_key",
    targets: [ex("m7-email-lesen", ["q3"]), ex("m6-einladung-lesen", ["q6"])],
    note: "A request in the text (\"Bitte bringen Sie …\", \"Könnt ihr bis Mittwoch zusagen?\") is keyed as a fact (true).",
  },
  { id: "AK-3", kind: "answer_key", targets: [ex("m7-bank-hoeren", ["q3"])], note: "\"Herr Novak hat keinen Ausweis.\" (key: false), but he answers with his passport." },
  { id: "AK-4", kind: "answer_key", targets: [ex("m3-haltestelle-hoeren", ["q3", "q4"])], note: "\"Ist das weit?\": unclear whether \"das\" is the station or the stop." },
  { id: "AK-5", kind: "answer_key", targets: [ex("a1-pp1-hoeren-3-telefon", ["q1"])], note: "The transcript first names the original plan (Mittwoch); the key is the new suggestion (Donnerstag)." },
  { id: "AK-6", kind: "answer_key", targets: [ex("m4-position-1-ueben")], note: "Instruction \"Start with the word that has a capital letter\" is misleading: nouns are capitalised too." },
  { id: "AK-7", kind: "answer_key", targets: [ex("m11-umtausch-formular", ["q2"])], note: "Label \"Artikel (Was?)\": learners may type der/die/das." },

  // Accepted variants to add or check
  { id: "AV-1", kind: "accepted_variants", targets: [ex("m3-test-formular", ["q4"])], note: "Accepts \"7 Parkstraße\", against the address rule taught in module 2." },
  { id: "AV-2", kind: "accepted_variants", targets: [ex("m9-test-formular", ["q3"])], note: "Accepts \"2/zwei\" but not \"2 Zimmer / zwei Zimmer\"." },
  { id: "AV-3", kind: "accepted_variants", targets: [ex("m8-test-formular", ["q4"])], note: "Lacks \"Husten und Halsschmerzen, aber kein Fieber\"." },
  { id: "AV-4", kind: "accepted_variants", targets: [ex("m5-zu-spaet-schreiben", ["q4"])], note: "Lacks \"gegen\"." },
  { id: "AV-5", kind: "accepted_variants", targets: [ex("m5-test-hoeren", ["q4"]), ex("m5-test-formular", ["q3", "q4"])], note: "Time formats: \"8 Uhr 45\", \"von 14:00\", \"vierzehn\" without \"Uhr\"." },
  { id: "AV-6", kind: "accepted_variants", targets: [ex("m6-test-hoeren", ["q6"]), ex("m6-datum-ordinal", ["q7"])], note: "Dates without a space (\"19.Mai\", \"am 1.Januar\")." },
  { id: "AV-7", kind: "accepted_variants", targets: [ex("m4-test-hoeren", ["q4"]), ex("m4-einkaufszettel-schreiben", ["q2"])], note: "Prices and quantities (\"5.80 €\", \"5 Euro 80\", \"0,5 Kilo\")." },
  { id: "AV-8", kind: "accepted_variants", targets: [ex("m7-test-schreiben", ["q4"])], note: "The inverted sentence \"Auf dem Schreibtisch liegt mein Computer.\" is not accepted." },
  { id: "AV-9", kind: "accepted_variants", targets: [ex("m11-umtausch-formular", ["q6"])], note: "Lacks \"passt nicht\"." },
  { id: "AV-10", kind: "accepted_variants", targets: [ex("a1-pp1-schreiben-1-formular", ["q5"])], note: "Phone formats with \"/\" or \"-\"." },
  { id: "AV-11", kind: "accepted_variants", targets: [ex("m7-email-schreiben", ["q5"])], note: "Accepts \"… kaputt aber …\" without a comma, against the module's own comma rule." },

  // Pedagogically questionable
  { id: "PE-1", kind: "pedagogy", targets: [ex("m9-wdh-grammatik", ["q8"])], note: "Tests the verb form with \"man\", which is taught in module 12." },
  { id: "PE-2", kind: "pedagogy", targets: [ex("m3-adjektive-sein", ["q2", "q3", "q4"])], note: "Uses er/es for things before pronouns for things are taught." },
  { id: "PE-3", kind: "pedagogy", targets: [ex("m7-test-schreiben", ["q6"])], note: "Asks for a formal closing inside an informal (du) e-mail." },
  { id: "PE-4", kind: "pedagogy", targets: [ex("m12-postkarte-schreiben")], note: "Switches from ich to wir with no companion introduced." },

  // Needs native-speaker confirmation
  { id: "ID-1", kind: "idiom", targets: [ex("m3-durchsagen-hoeren", ["q3"]), ex("m3-test-hoeren")], note: "\"U-Bahn Linie 2 / 1\": standard spelling is \"U-Bahn-Linie\"." },
  { id: "ID-2", kind: "idiom", targets: [word("stock")], note: "der Stock: plural null with a note to \"die Stockwerke\"; in the floor sense the plural is unchanged (\"drei Stock\")." },
  { id: "ID-3", kind: "idiom", targets: [ex("m12-urlaubsorte-lesen")], note: "\"Zum Bahnhof geht man nur fünf Minuten.\"" },
  { id: "ID-4", kind: "idiom", targets: [ex("m12-test-lesen")], note: "\"ein Museum besichtigen\", and contradictory weather in the stimulus (sunny, rain in the afternoon)." },
  { id: "ID-5", kind: "idiom", targets: [ex("m10-lebenslauf-lesen")], note: "\"Ich habe schon das Zeugnis: „gut“!\" for a language-course result." },
  { id: "ID-6", kind: "idiom", targets: [ex("m7-dativ-artikel", ["q7"])], note: "\"Wir schicken ___ Büro in Hamburg die Datei.\": a place as the dative recipient." },
  { id: "ID-7", kind: "idiom", targets: [ex("m8-praxis-hoeren")], note: "\"Die Ärztin ruft Sie gleich.\" without \"auf\"." },
  { id: "ID-8", kind: "idiom", targets: [ex("m8-modalverben-formen", ["q8"])], note: "\"Frau Doktor\"." },
  { id: "ID-9", kind: "idiom", targets: [ex("m9-umzug-lesen")], note: "\"Sorry!\"" },
  { id: "ID-10", kind: "idiom", targets: [grammar("m9-in-akkusativ-richtung")], note: "\"in die Zimmer\" vs. \"in ihre Zimmer\"." },
  { id: "ID-11", kind: "idiom", targets: [grammar("m6-fuer-akkusativ")], note: "\"für es\" in the paradigm." },
  { id: "ID-12", kind: "idiom", targets: [ex("m7-mit-dativ")], note: "\"Mit der Karte\" vs. the more common \"mit Karte\"." },
]);

// Findings that no single item carries; shown once for the level.
export const LEVEL_REVIEW_NOTES = Object.freeze([
  "Phone numbers in the exam and the module forms use real area codes and mobile prefixes; consider the ranges reserved for fiction.",
  "Invented business names in real places (Hotel Möwenblick, Pension Bergwiese, Kaufhaus Brandner …): check that none is a real business.",
  "The exam's Hören Teil 1 titles use \"Beispiel 1–6\"; in the Goethe format \"Beispiel\" is the unscored example.",
  "Nouns used in module texts before their defining module (receptive use; check that they are glossed): see CURRICULUM-A1.md.",
]);

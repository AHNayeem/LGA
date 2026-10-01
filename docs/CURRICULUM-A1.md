# A1 Curriculum

Status: all 12 A1 modules are implemented (2026-09-29) and seeded as draft/unpublished, plus the practice exam *A1 Probeprüfung 1* (`EXAMS.md`). Speaking practice supports recording. Real German audio is generated with the offline tooling once a Google TTS key is available (see "Audio status"). Nothing is reviewed or published yet.

Sources: `REFERENCE-ANALYSIS.md` (structure taken from the reference PDFs) and the PDFs in `docs/`. The books and exam papers are used **only for mapping and task formats**. All learner-facing text, dialogues, questions, examples and explanations are original. Nothing is copied from Netzwerk neu, Grammatik aktiv, the glossaries or the Goethe papers.

## 1. The 12-module plan, checked against the references

The plan from `REFERENCE-ANALYSIS.md` §4 was checked against three references before any content was written:
- the Netzwerk neu A1 chapter order
- the grammar listed for each chapter
- the A1 chapters of Grammatik aktiv

| # | Module | Netzwerk neu | Order ✓ | Chapter grammar → Grammatik aktiv | Notes |
|---|---|---|---|---|---|
| 1 | Hallo! | Kap. 1 | ✓ | W-question, statement, verbs + pronouns → 1, 2, 10, 12 | Also introduces *sein* as a chunk (fully covered in M2, GA 3) |
| 2 | Menschen & Berufe | Kap. 2 | ✓ | irregular verbs, yes/no questions, definite article, plural, *haben/sein* → 3, 11, 14, 15 | |
| 3 | In der Stadt | Kap. 3 | ✓ | indefinite article, *kein*, imperative (Sie) → 15, 16, 9 | Plattform 1 review follows |
| 4 | Essen & Einkaufen | Kap. 4 | ✓ | accusative, *mögen/möchten*, word order → 17, 6, 12 | |
| 5 | Alltag & Familie | Kap. 5 | ✓ | *am/um/von…bis*, possessives, *müssen/können/wollen* → 32, 19, 5 | |
| 6 | Freizeit & Feste | Kap. 6 | ✓ | separable verbs, accusative pronouns, *für* + Akk., Präteritum *haben/sein* → 8, 21, 34, 25 | Plattform 2 review follows |
| 7 | Arbeit & Büro | Kap. 7 | ✓ | *und/oder/aber*, dative, *mit* + Dat., local prepositions → 44, 18, 33 | |
| 8 | **Gesundheit** | Kap. 8 | ✓ | imperative du/ihr/Sie, *sollen/müssen/dürfen* → 9, 7 | Health coverage kept |
| 9 | Wohnen | Kap. 9 | ✓ | *in* + Akk., two-way prepositions → 34, 35 | Plattform 3 review follows |
| 10 | Was hast du gemacht? | Kap. 10 | ✓ | Perfekt, Partizip II → 26 (25 revisited) | Perfekt taught receptively plus high-frequency verbs (see REFERENCE-ANALYSIS §3) |
| 11 | **Kleidung & Kaufhaus** | Kap. 11 | ✓ | *welcher/dieser*, dative pronouns and verbs → 20, 21 | Clothing coverage kept |
| 12 | Reisen & **Wetter** | Kap. 12 | ✓ | *man*, *denn*, *Wer/Wen/Wem*, temporal prepositions → 44, 10 | Weather coverage kept; Plattform 4 review follows |

**Result:** modules 1–12 follow the chapter order one-to-one, and the review units sit where the Plattform units do (after chapters 3, 6, 9 and 12). Health, clothing and weather are kept. Two gaps remain:
- Grammatik aktiv 47–49 (compound nouns, compound verbs, gender rules) are not tied to a single module. They will be spread across modules as short "tips" when modules 2–12 are written.
- The Kap. 10 mapping also lists GA 25 (Präteritum *haben/sein*), which Kap. 6 first introduces. M10 only revisits it.

## 2. Module 1 "Hallo!" (implemented)

- **Goal (can-do):** greet and say goodbye (formal and informal); introduce yourself (name, country, city, languages); ask *Wie? Wer? Was? Woher? Wo?*; use numbers 0–20 and phone numbers; spell names and e-mail addresses.
- **Goethe preparation:** Sprechen Teil 1 (self-introduction, spelling, a number); Hören Teil 1 style (short recordings played twice, numbers).
- **Source files:** `content/curriculum/a1/module-01/` (`vocabulary.js`, `grammar.js`, `exercises.js`, `index.js`).

### Lessons
| # | Lesson | Blocks | Exercises (skill) |
|---|---|---|---|
| 1 | Hallo und Tschüs! | intro · 13 words · grammar *du oder Sie?* · 3 exercises | greeting situations (vocabulary), formal/informal (grammar), dialogue with 2 plays (listening) |
| 2 | Ich heiße … | intro · 15 words · grammar *verbs in the present* · 4 exercises | *heißen/sein* gaps (grammar), word order (grammar), message (reading), introduce yourself (speaking) |
| 3 | Woher kommst du? | intro · 22 words · grammar *verb in position 2* · 6 exercises | W-words, *kommen/wohnen/sprechen*, verb position (grammar); country–capital and verb matching (vocabulary); profile (reading); course dialogue (listening) |
| 4 | Zahlen von 0 bis 20 | intro · 11 + 15 words · 4 exercises | number matching (vocabulary), number dictation (listening), phone message (listening), questions and answers (reading) |
| 5 | Das Alphabet | intro · 8 words · grammar *alphabet* · 3 exercises | spelled surnames (listening), e-mail addresses (listening), spelling aloud (speaking) |
| 6 | Modultest | intro · 6 test blocks | listening, reading (e-mail), writing (form, Schreiben Teil 1 style), grammar, vocabulary (all at a 70% pass mark), speaking card (not scored) |

In total: 84 vocabulary items, 4 grammar topics, 26 exercises (112 items), and 169 audio cues. Every assessable A1 skill has exercises (vocabulary, grammar, reading, listening, writing).

**Speaking** (3 exercises, 8 items): learners can record each answer, listen back, re-record, submit, and later play or delete their own recording. They then compare it with the model answer and rate themselves. Speaking is **practice only**:
- not scored, and never counted for mastery ("not assessed")
- no automated pronunciation assessment or feedback
- no human grading yet

If no microphone is available, the self-rating still works.

### Audio status
- All 169 cues are described in the content and are generated **offline**. The app never calls a TTS API.
- Until `bun run audio:generate` has run with a real key, `bun run audio:verify` fails and the listening exercises can't be published (publishing is blocked when required audio is missing).
- Steps:
  1. `bun run audio:smoke`: check the voices and listen to the 20 samples.
  2. `TTS_PROVIDER=google bun run audio:generate -- --voices-verified`
  3. `bun run audio:verify`
- Voices and settings: see `ARCHITECTURE.md` → Audio generation. The run's settings are also recorded in `content/audio/manifest.json`.
- Generated audio is still TTS. The reviewer checklist below still applies: listen to spelled letters, phone numbers and umlauts.

### Content rules applied
- `sourceType: "ai_generated"`: the text was drafted with AI assistance, so it must be reviewed by a person. Everything is seeded as `draft` / `unpublished`.
- **Bangla:** no `bn` educational text exists, and Phase 3 added none. The UI falls back to English. A reviewer adds Bangla, which then goes through the same review. The six Bangla **skill labels** in `lib/content/skills.js` (from Phase 1) are **unreviewed**. They are flagged in the code and still need a Bangla speaker to check them.
- **Learner disclosure:** Module 1's lessons and module page show "AI-assisted content, not yet reviewed by a native speaker." Approving the content in `/admin` doesn't remove the notice: an in-app approval is not a native-speaker review.
- **Names and domains:** fictional people, and `beispiel.de` / `beispiel.com` for e-mail addresses.
- **Situation prompts:** in English so beginners understand the task. The answers are always German.
- **Integrity test:** `tests/unit/curriculum-content.test.js` checks that every item validates, every slug and reference resolves, every answer key scores 100% with the right answers and fails with wrong ones, and that no Bangla or approval state is shipped. `tests/unit/curriculum-modules.test.js` runs the same checks on every module and adds the level-wide ones (no orphan words, grammar or exercises; unique slugs and words across modules; a module test at the end; every module directory registered in order). `tests/integration/curriculum-a1.test.js` seeds the whole level and checks order, draft invisibility, learner visibility after publishing and the preview of every lesson.

### Reviewer checklist (before "approve")
1. German spelling, grammar and register (du/Sie) in every text, option and example.
2. Answer keys and accepted variants in the admin preview: exactly one correct MCQ option; `text_input` accepts all reasonable variants.
3. Audio is generated (publishing is blocked otherwise). Listen for pronunciation, especially spelled letters and phone numbers.
4. Nothing resembles textbook or exam material beyond the task format.
5. If adding Bangla, have it checked by a Bangla speaker. It resets the item to draft.
6. Items approved with `bun run content:fixture-publish` (dev/test databases only) are labelled "Test-fixture approval – not a genuine review". Before real learners see the module, they must be sent back to draft and genuinely reviewed and approved. `bun run content:check` lists them.

## 2b. Modules 2–12 (implemented 2026-09-29)

Modules 2–12 follow the plan in §1 one-to-one and use the same structure as Module 1, at a lighter density (product decision, 2026-09-29): **four lessons and a module test** per module, about 50 words and 12–15 exercises in the regular lessons. Modules 3, 6, 9 and 12 add a **Wiederholung** lesson (the Plattform 1–4 review units) before the module test: mixed exercises over the last three modules, no new words.

| # | Module (slug) | Lessons | Grammar | Words | Exercises (items) |
|---|---|---|---|---|---|
| 2 | Menschen & Berufe (`menschen-und-berufe`) | Was machst du gern? · Was sind Sie von Beruf? · Arbeitsplätze und Wochentage · Zahlen ab 20 und Formulare · Modultest | vowel-change verbs; sein/haben; ja/nein questions; der/die/das; plural | 50 | 21 (133) |
| 3 | In der Stadt (`in-der-stadt`) | Was gibt es in der Stadt? · Mit Bus und Bahn · Wie komme ich zum Bahnhof? · Im Sommer ist die Stadt schön · Wiederholung 1–3 · Modultest | ein/eine; kein/nicht; imperative (Sie); adjective after sein | 49 | 25 (144) |
| 4 | Essen & Einkaufen (`essen-und-einkaufen`) | Essen und Trinken · Im Supermarkt · Was kostet das? · Guten Appetit! · Modultest | accusative; verbs + accusative; mögen/möchten; position 1; gern | 50 | 21 (120) |
| 5 | Alltag & Familie (`alltag-und-familie`) | Wie spät ist es? · Mein Alltag · Meine Familie · Termine am Telefon · Modultest | clock time; am/um/von … bis; possessives; müssen/können/wollen | 49 | 21 (128) |
| 6 | Freizeit & Feste (`freizeit-und-feste`) | Wann hast du Geburtstag? · Kommst du mit? · Im Café · Wie war das Fest? · Wiederholung 4–6 · Modultest | dates/ordinals; separable verbs; accusative pronouns; für + Akk.; war/hatte | 49 | 24 (153) |
| 7 | Arbeit & Büro (`arbeit-und-buero`) | Im Büro · E-Mails im Büro · Mittagspause mit Kollegen · Wo ist …? · Modultest | und/oder/aber; dative article; mit + Dat.; wo? + Dat. | 49 | 22 (117) |
| 8 | Gesundheit (`gesundheit`) | Der Körper · Mir geht es nicht gut · In der Arztpraxis · Gute Besserung! · Modultest | Was tut weh?; imperative du/ihr/Sie; sollen/müssen/dürfen | 47 | 21 (120) |
| 9 | Wohnen (`wohnen`) | Meine Wohnung · Ich gehe in die Küche · Wo steht das Sofa? · Wohnungssuche · Wiederholung 7–9 · Modultest | sein + adjective, colours; in + Akk.; two-way prepositions + Dat.; stehen/liegen/hängen | 49 | 24 (140) |
| 10 | Was hast du gemacht? (`was-hast-du-gemacht`) | Am Wochenende · Schule und Studium · Ich suche eine Stelle · Am Telefon · Modultest | Perfekt with haben; Partizip II; Perfekt with sein (chunks); war/hatte revisited | 50 | 21 (125) |
| 11 | Kleidung & Kaufhaus (`kleidung-und-kaufhaus`) | Was trägst du? · Die Jacke gefällt mir! · Im Geschäft · Im Kaufhaus · Modultest | welcher/dieser; dative pronouns; verbs with dative; Partizip II (recognition) | 49 | 21 (118) |
| 12 | Reisen & Wetter (`reisen-und-wetter`) | Urlaub machen · Wie ist das Wetter? · Unterwegs in der Stadt · Grüße aus dem Urlaub · Wiederholung 10–12 · Modultest | man; denn; Wer/Wen/Wem; in/vor/nach/seit + Dat. | 47 | 25 (144) |

**The whole A1 level:** 12 modules, 65 lessons, 622 words, 50 grammar topics, 272 exercises (1,554 items) and 1,570 audio cues (1,600 with the practice exam).

- **Module tests** follow Module 1's pattern: `mini_test` blocks for listening, reading and writing (form filling / guided gap-fill), `mastery_check` blocks for grammar and vocabulary (all at 70%), and one ungraded speaking card. The intro says these are the app's learning targets, not Goethe pass marks.
- **Skills:** every module has graded vocabulary, grammar, reading, listening and writing exercises, and speaking practice in a lesson as well as in the test. Writing is auto-graded only (forms, gap-filled messages, choosing the fitting sentence). There is no free writing, because nothing can grade it reliably.
- **Listening difficulty rises:** slow single speakers in modules 2–3, normal-speed dialogues from module 4, and mostly normal speed from module 9. Goethe Hören formats: short dialogues and phone messages played twice, announcements once (modules 3, 11, 12).
- **Perfekt** (module 10) is taught receptively and with high-frequency verbs only, as decided in §1. The sein-Perfekt is limited to a few movement verbs taught as chunks.
- **Words are defined once.** Every word, grammar topic and exercise slug is unique across the level, so no word appears as two cards. When a later module needs a word from an earlier one, it uses it in texts without redefining it. `tests/unit/curriculum-modules.test.js` enforces this.
- **Provenance:** every module is `ai_generated`, with its Netzwerk neu chapter, Grammatik aktiv topics and Goethe task formats as reference metadata only. There is no Bangla.

### Reviewer notes from authoring
The authoring notes flagged these points for the native-speaker review (in addition to the checklist below):
- **Fixed chunks with grammar that hasn't been taught yet:** zum/zur, im Mai, zu Hause, Tut mir leid, "Alles Gute zum Geburtstag". The intros present them as phrases.
- **Words used in texts before they are defined:**
  - der Eingang appears in module 3 but is defined in module 7
  - der Stock and das Erdgeschoss appear in modules 7 and 9 but are defined in module 11
- **Accepted variants to check:** the "in das / in dem" forms in module 9, the imperative forms without -e (Trink / Trinke) in module 8, and the time and price formats in modules 4–6.
- **Plural judgement calls:** Kilo, Stück and Euro (module 4), der Stock (module 11), das Studium (module 10). der Grad follows Duden (module 12).
- **Two MCQs to double-check** for exactly one defensible answer: `m8-modalverben-bedeutung` q4 and `m7` lesson 4 q4 ("bei der" vs. "in der" Firma).
- **Real places** (Kiel, Heidelberg, Hamburg sights) are used for realism. All people, hotels, shops, companies and phone numbers are fictional.

### Content QA findings (2026-09-29)
The itemised findings below are also kept in machine-readable form in `content/curriculum/a1/review-findings.js` (ids AK-, AV-, PE-, ID-), so the readiness report (§2c) shows each one on the lessons and the exam it affects. A reviewer who resolves a finding removes its entry there in the same change that records the outcome here. None of them has been resolved yet.

A pre-publish QA pass checked modules 1–12 and the practice exam. It used the existing schemas, grading engine, `content:check` and `audio:verify`, plus an AI read-through of every German text. Nothing was changed in the content. The list below adds to the authoring notes above; it replaces none of them. An AI read-through is **not** a native-speaker review: every item still needs a person to confirm or reject it.

**Structurally valid.** No schema, reference, orphan, duplicate or answer-key errors. Every graded exercise scores 100% with the key and fails with wrong answers. Re-checked by hand and still valid:
- `m8-modalverben-bedeutung` q4 has exactly one defensible answer ("Darf ich hier rauchen?").
- `m7-wo-ist` q4 offers "bei der / beim / bei dem"; "in der" isn't an option, so there is exactly one answer.
- The imperative variants in module 8 are complete.
- The ins/in das and im/in dem variants in module 9 are grammatical.
- The Perfekt forms and auxiliaries in module 10 are correct.
- der Grad → die Grade is correct.
- The phone-number inputs all set `ignoreSpaces`.

**Answer keys that may mark a correct learner wrong** (confirm before approving):
- `m7-email-lesen` q6 "Frau Berger schreibt die E-Mail." (key: false). The text begins "vielen Dank für Ihre E-Mail", so she did write *an* e-mail. The statement is ambiguous.
- `m7-email-lesen` q3 and `m6-einladung-lesen` q6 treat a request in the text ("Bitte bringen Sie …", "Könnt ihr bis Mittwoch zusagen?") as a fact (key: true).
- `m7-bank-hoeren` q3 "Herr Novak hat keinen Ausweis." (key: false). The transcript answers "Haben Sie Ihren Ausweis?" with "Ja, hier ist mein Pass."
- `m3-haltestelle-hoeren` q3/q4: "Ist das weit? – Nein … fünf Minuten zu Fuß" is unclear about what "das" refers to (the station or the stop).
- Exam `a1-pp1-hoeren-3-telefon` q1 "When does Clara want to go swimming?": the transcript first mentions the original plan (Mittwoch). The key is the new suggestion (Donnerstag).
- `m4-position-1-ueben` instruction "Start with the word that has a capital letter" is misleading, because German nouns are capitalised too.
- `m11-umtausch-formular` q2 label "Artikel (Was?)": learners may type der/die/das.

**Accepted variants to add or check** (text inputs):
- `m3-test-formular` q4 accepts "7 Parkstraße", which contradicts the address rule taught in module 2.
- `m9-test-formular` q3 (label "Zimmer") accepts "2/zwei" but not "2 Zimmer / zwei Zimmer".
- `m8-test-formular` q4 lacks "Husten und Halsschmerzen, aber kein Fieber" (commas inside answers must match).
- `m5-zu-spaet-schreiben` q4 lacks "gegen".
- `m5-test-hoeren` q4 and `m5-test-formular` q3/q4: time formats "8 Uhr 45", "von 14:00", "vierzehn" without "Uhr".
- `m6-test-hoeren` q6 and `m6-datum-ordinal` q7: dates without a space ("19.Mai", "am 1.Januar").
- `m4-test-hoeren` q4 and `m4-einkaufszettel-schreiben` q2: prices and quantities ("5.80 €", "5 Euro 80", "0,5 Kilo").
- `m7-test-schreiben` q4: the inverted sentence "Auf dem Schreibtisch liegt mein Computer." is not accepted.
- `m11-umtausch-formular` q6: "passt nicht".
- Exam `a1-pp1-schreiben-1-formular` q5: phone formats with "/" or "-".
- `m7-email-schreiben` q5 accepts "… kaputt aber …" without a comma, against the module's own comma rule.

**Pedagogically questionable** (grammar or words used before they are taught; register):
- `m9-wdh-grammatik` q8 tests the verb form with *man* ("Hier ___ man nicht rauchen."), but *man* is taught in module 12.
- `m3-adjektive-sein` q2–q4 use er/es for things before any pronoun-for-things section.
- `m7-test-schreiben` q6 asks for a formal closing inside an informal (du) e-mail to Tom.
- `m12-postkarte-schreiben` switches from ich to wir with no companion introduced.
- More nouns used in module texts before their defining module (in addition to the authoring list; receptive use, so check that they are glossed):
  - M1: Formular, Adresse, Wohnort, Alter
  - M1–4: Morgen, Abend, Nacht
  - M4: Party, Tisch
  - M5: Geburtstag, Praxis, Problem
  - M6: Sonne
  - M7: Aufzug
  - M8: Bett, Mailbox
  - M10: Jacke
- **Audio speed (decided):** normal-speed dialogues start in module 4, as §2b says. The dialogue lines of `m4-markt-hoeren` and `m6-im-cafe-hoeren` now use `rate: "normal"`. All other cues keep their existing rate (explicit, or the `slow` default).

**Needs native-speaker confirmation** (possibly unidiomatic German):
- "U-Bahn Linie 2 / 1" (`m3-durchsagen-hoeren` q3, `m3-test-hoeren`): standard spelling is "U-Bahn-Linie".
- der Stock (module 11): the plural is null and the note points to "die Stockwerke". In the "floor" sense the plural is unchanged ("drei Stock").
- "Zum Bahnhof geht man nur fünf Minuten." (`m12-urlaubsorte-lesen`).
- "ein Museum besichtigen", and the contradictory weather in the `m12-test-lesen` stimulus ("Die Sonne scheint … am Nachmittag regnet es").
- "Ich habe schon das Zeugnis: „gut“!" for a language-course result (`m10-lebenslauf-lesen`).
- "Wir schicken ___ Büro in Hamburg die Datei." (`m7-dativ-artikel` q7): a place as the dative recipient.
- "Die Ärztin ruft Sie gleich." without "auf" (`m8-praxis-hoeren`).
- "Frau Doktor" (`m8-modalverben-formen` q8).
- "Sorry!" in `m9-umzug-lesen`.
- "in die Zimmer" vs. "in ihre Zimmer" (grammar `m9-in-akkusativ-richtung`).
- "für es" in the `m6-fuer-akkusativ` paradigm.
- "Mit der Karte" vs. the more common "mit Karte" (`m7-mit-dativ`).

**Provenance and realism:**
- Phone numbers in the exam (and in the module forms) use real area codes and mobile prefixes. Consider the Bundesnetzagentur ranges reserved for fiction.
- Invented business names in real places (Hotel Möwenblick on Rügen, Pension Bergwiese in Garmisch-Partenkirchen, Kaufhaus Brandner …): quick check that none is a real business.
- The exam's Hören Teil 1 titles use "Beispiel 1–6". In the Goethe format "Beispiel" is the unscored example; the scored items are "Aufgabe".

**Database state seen during QA (`lga_dev`, local development database):** Module 1 `hallo` is approved and published, but none of its lessons are published. Four of its lessons are approved but unpublished. Six items carry a `human_review` approval dated 2026-09-29: 1 module, 1 exercise, 2 words, 2 grammar topics. So learners see an empty module, and the six published items can't be reached through any published lesson. Confirm that these approvals were genuine reviews; if they weren't, send them back to draft in `/admin`. The media library also holds one unattached test upload ("sdfsd", `Unit 02.mp3`, `source: native`, no licence). Remove it unless its licence is documented.

## 2c. Readiness report

`bun run content:check -- --all` (read-only; `--level a2` for another level, `--json` for the full report) and the admin page `/admin/readiness` show the same report, built by `lib/services/readinessService.js` from the **stored** content, so CMS edits after seeding are checked too. The admin page isn't in the admin navigation yet; it will be linked once the uncommitted CMS navigation work is committed.

Per lesson it says whether learners can open it now (**live**: level, module, lesson and everything the lesson uses approved and published) and gives one readiness state, the first that applies:

| State | Meaning |
|---|---|
| blocked | a structural problem (list below) |
| needs audio | required listening audio has no playable source |
| needs review | the lesson or anything it uses isn't approved, carries a test-fixture approval, or has an open QA finding |
| ready | technically valid, approved by a person, audio present, no open QA finding |

"Ready" is a factual check. It never says the German or the teaching is good: that stays a person's review. Nothing in the report approves or publishes anything.

**Structural checks** (errors unless noted):
- broken lesson → exercise, grammar or word references, and archived dependencies
- duplicate block keys; a lesson with no blocks; the same word or exercise twice in a lesson (warning); one exercise in several lessons (warning: progress is per lesson)
- lesson, exercise, grammar and word content that no longer passes its schema
- answer keys: the key must score 100% and wrong answers must not pass (the same check the source tests run, `lib/exercises/answerKey.js`)
- attached recordings and images that are missing or archived
- Goethe links: the reference must exist, name one exam part (not the whole exam) and match the exercise's skill (Hören ↔ listening, Lesen ↔ reading, Schreiben ↔ writing, Sprechen ↔ speaking)
- duplicate lesson or module positions; gaps in the order (warning)
- a published level or module that learners see empty; a published lesson learners can't open (warning)
- the sequence (`lib/learning/continuation.js`): a simulated learner follows "Continue" from no progress and must reach every live lesson once, in order, never be sent back to a completed lesson, and end with every module page pointing to the next module and the last one reporting the level complete
- per exam: the exam's own publish readiness, its exercises (the checks above), missing audio, open findings, and sections that don't match a Goethe part (warning)

The source files keep their own integrity tests (`tests/unit/curriculum-*.test.js`), now including the Goethe links and that every QA finding points at an existing item. `tests/integration/readiness.test.js` breaks stored content in each of these ways and checks that the report finds it and writes nothing.

### State of `lga_dev` (read-only report, 2026-10-01)
The local development database. Nothing was changed; no seed, approval, publish or audio generation was run.

| # | Module | Lessons | Live | Needs audio | Needs review | Items approved | Required audio missing |
|---|---|---|---|---|---|---|---|
| 1 | hallo | 6 | 0 | 5 | 1 | 43 / 121 | 30 |
| 2 | menschen-und-berufe | 5 | 0 | 4 | 1 | 15 / 82 | 27 |
| 3 | in-der-stadt | 6 | 0 | 5 | 1 | 16 / 85 | 31 |
| 4 | essen-und-einkaufen | 5 | 0 | 2 | 3 | 14 / 82 | 20 |
| 5 | alltag-und-familie | 5 | 0 | 3 | 2 | 14 / 80 | 16 |
| 6 | freizeit-und-feste | 6 | 0 | 4 | 2 | 16 / 85 | 27 |
| 7 | arbeit-und-buero | 5 | 0 | 4 | 1 | 16 / 81 | 29 |
| 8 | gesundheit | 5 | 0 | 4 | 1 | 14 / 77 | 26 |
| 9 | wohnen | 6 | 0 | 4 | 2 | 14 / 84 | 25 |
| 10 | was-hast-du-gemacht | 5 | 0 | 3 | 2 | 13 / 81 | 19 |
| 11 | kleidung-und-kaufhaus | 5 | 0 | 4 | 1 | 10 / 80 | 29 |
| 12 | reisen-und-wetter | 6 | 0 | 5 | 1 | 6 / 83 | 32 |

- The level and all 12 modules are approved and published, but no lesson is: learners see 12 empty modules (13 blocking errors: one per module, one for the level). No lesson has a structural problem.
- 47 lessons, every module test and the practice exam (31 clips) are blocked on generated audio (`audio:generate` needs a Google TTS key). The 18 lessons without listening audio still need review: most of what they use is draft.
- 214 items are approved, all recorded as human review: the level, the 12 modules, the practice exam, and exactly 50 each of lessons, exercises, grammar topics and words. Exactly 50 per type matches one page of an admin list, which suggests page-wise approval rather than item-by-item review. Confirm whether these were genuine reviews; if not, send them back to draft in `/admin`.
- The word `alter` contains Bangla text, which needs review by a Bangla speaker. The source files contain none, so it was added in the CMS.
- The 34 open QA findings above are attached to their lessons and the exam.

## 3. Mastery thresholds

These are the A1 defaults, configured in `content/seed/levels.js` and resolved level → module → lesson:
- vocabulary 80%
- grammar 75%
- reading 70%
- listening 70%
- speaking 60% (optional)
- writing 60% (optional)

They are **the app's learning and mastery thresholds, not official Goethe pass criteria**. The Goethe PDFs don't document an overall pass mark (see `REFERENCE-ANALYSIS.md` §1).

**How scores are calculated:**
- A skill's score is the points from the learner's **latest** attempt at each graded exercise in scope, divided by all available points. Exercises not yet attempted count as 0.
- Skills with no graded content in scope show as "not assessed" and don't block mastery.
- Lesson completion uses the **best** attempt, since each exercise needs a passing attempt. So completion is never lost, while mastery reflects current ability.

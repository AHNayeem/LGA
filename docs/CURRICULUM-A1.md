# A1 Curriculum

Status: Phase 2. Module 1 is implemented and seeded as draft. Modules 2–12 are planned.

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

In total: 84 vocabulary items, 4 grammar topics, 26 exercises (112 items), and 169 audio cues. Every assessable A1 skill has exercises (vocabulary, grammar, reading, listening, writing). Speaking is practised through self-rating only and is **not assessed** until Phase 3 adds recording.

### Content rules applied
- `sourceType: "ai_generated"`: the text was drafted with AI assistance, so it must be reviewed by a person. Everything is seeded as `draft` / `unpublished`.
- **Bangla:** no `bn` text exists. The UI falls back to English. A reviewer adds Bangla, which then goes through the same review.
- **Names and domains:** fictional people, and `beispiel.de` / `beispiel.com` for e-mail addresses.
- **Situation prompts:** in English so beginners understand the task. The answers are always German.
- **Integrity test:** `tests/unit/curriculum-content.test.js` checks that every item validates, every slug and reference resolves, every answer key scores 100% with the right answers and fails with wrong ones, and that no Bangla or approval state is shipped.

### Reviewer checklist (before "approve")
1. German spelling, grammar and register (du/Sie) in every text, option and example.
2. Answer keys and accepted variants in the admin preview: exactly one correct MCQ option; `text_input` accepts all reasonable variants.
3. Audio is generated (publishing is blocked otherwise). Listen for pronunciation, especially spelled letters and phone numbers.
4. Nothing resembles textbook or exam material beyond the task format.
5. If adding Bangla, have it checked by a Bangla speaker. It resets the item to draft.

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

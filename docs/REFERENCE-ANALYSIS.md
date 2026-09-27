# Reference Material Analysis

Analysed 2026-09-27. This file records **structural information** taken from the reference PDFs in `docs/` and how it informs our own curriculum and exam design.

**Copyright rule.** None of the reference content (texts, exercises, dialogues, audio, images, answer keys, word-list translations) is copied into the application. Only structure is recorded here: section names, task formats, timings, scoring rules, and chapter and topic titles used for mapping. All learner-facing content is original.

The PDFs are copyrighted and should not be in version control. `docs/*.pdf` is gitignored for new files, but the existing PDFs were committed in `e065d05` and are still tracked (see the open item in the Phase 1 report).

| File | Type | Usable as |
|---|---|---|
| `GOETHE-ZERTIFIKAT A1 START DEUTSCH 1 (2).pdf` | Goethe *Modellsatz*, 8th ed., Feb 2024 | Official exam structure, timing, scoring |
| `Goethe-Zertifikat A1 Start Deutsch 1.pdf` | Goethe *Übungssatz 02*, 6th ed., Feb 2024 | Same structure, confirms task formats |
| `Netzwerk Neu A1 - Kursbuch.pdf` | Klett textbook | Chapter/topic mapping only |
| `Netzwerk Neu A1 - Übungsbuch.pdf` | Klett workbook | Same 12 chapters; mapping only |
| `Glossar-A1.pdf` | Klett Netzwerk neu A1 glossary DE–EN, per chapter | Vocabulary **coverage checking** only (which lemmas appear by chapter); translations are not imported |
| `A1-Glossary-BookG-Rafi.pdf` | Third-party per-chapter word list for Netzwerk A1 (Bangla text did not extract) | Coverage cross-check only; not imported |
| `Grammatik aktiv A1-B1.pdf` | Cornelsen grammar book (scanned, no text layer) | Grammar topic mapping; contents read from the page images |

---

## 1. Goethe-Zertifikat A1: Start Deutsch 1 (official information)

**Can-do statements (Vorwort, summarised).** The candidate can:
- understand short everyday questions, instructions, answering-machine messages, public announcements and short conversations
- extract information from short written messages, public signs and small ads
- give and understand numbers, quantities, times and prices
- fill in forms with personal details
- write short personal messages
- introduce themselves and answer simple personal questions
- make and respond to everyday requests

The exam has a written individual part (Hören, Lesen, Schreiben) and an **oral group exam** (max. 4 candidates, 2 examiners).

| Section | Time | Part | Task format | Items | Plays |
|---|---|---|---|---|---|
| **Hören** | ~20 min | Teil 1 | short everyday dialogues, 3-option MC (a/b/c) | 6 | **twice** |
| | | Teil 2 | public announcements (station, airport, shop), Richtig/Falsch | 4 | **once** |
| | | Teil 3 | answering-machine / phone messages, 3-option MC | 5 | **twice** |
| **Lesen** | ~25 min | Teil 1 | two short letters/e-mails, Richtig/Falsch | 5 | – |
| | | Teil 2 | "Where do you find the information?" choose between 2 ads/web snippets (a/b) | 5 | – |
| | | Teil 3 | signs/notices, Richtig/Falsch | 5 | – |
| **Schreiben** | ~20 min | Teil 1 | complete a form with 5 missing details from a situation text | 5 × 1 pt | – |
| | | Teil 2 | short message (~30 words) covering 3 content points | 10 pts | – |
| **Sprechen** | ~15 min (group) | Teil 1 | self-introduction from keyword card (Name, Alter, Land, Wohnort, Sprachen, Beruf, Hobby); then spell something and give a number | | |
| | | Teil 2 | ask/answer questions on a theme using word cards (2 themes, e.g. Einkaufen, Wochenende, Beruf, Sport) | | |
| | | Teil 3 | make a request from a picture/object card and respond to a partner's request (2 rounds) | | |

Dictionaries are not allowed.

**Scoring documented in the PDFs:**
- Hören: 15 items, 1 point each. Lesen: 15 items, 1 point each.
- Schreiben: Teil 1 is 5 × 1 point. For Teil 2, each of the 3 content points gets 3 / 1.5 / 0, plus 1 / 0.5 / 0 for "kommunikative Gestaltung" (e.g. greeting and closing), giving max 10. The Teil 2 score is the average of 2 raters. Schreiben total is **/15**.
- Written total (Hören + Lesen + Schreiben): **/45**.
- Sprechen: each task is marked full points, half points, or 0. **Maximum points per task and the overall pass mark are not given in these PDFs.** Our exam model therefore keeps `maxPoints` per section and `passRule` configurable. The UI will not show a "pass/fail" verdict until those values are confirmed from an official source.

**How this shapes our design:**
1. Exam and mock-exam sections are **Hören → Lesen → Schreiben → Sprechen**, with the timings above.
2. Listening exercises need a `maxPlays` setting (1 or 2) and a `transcriptPolicy` (hidden until submitted).
3. The core question types needed are: `mcq` (3 options), `true_false`, `choose_source` (a/b), `form_fill` (short answers checked against accepted variants), `guided_message` (rubric-scored), and speaking card tasks.
4. Listening content types to produce: everyday dialogue, public announcement, phone message. Reading content types: e-mail/letter, ad/web snippet, sign/notice.
5. Our writing rubric mirrors the published structure (content points + communicative design) but is labelled *practice feedback*, not an official score.
6. The speaking Teil 1 keyword set gives the target for Module 1–2 speaking production. Spelling and numbers must be practised early.

---

## 2. Netzwerk neu A1: chapter mapping (titles and topics only)

| Kap. | Title | Main topics (summarised) | Grammar listed |
|---|---|---|---|
| 1 | Guten Tag! | greeting, introductions, numbers to 20, phone/e-mail, spelling, countries & languages | W-question, statement, verbs + personal pronouns |
| 2 | Freunde, Kollegen und ich | hobbies, making plans, weekdays, jobs & working hours, numbers from 20, forms | irregular verbs, yes/no questions, definite article, singular/plural, haben/sein |
| 3 | In Hamburg | places & buildings, transport, directions, months & seasons | indefinite article, kein, Imperativ (Sie), adjective with sein |
| – | Plattform 1 | review | |
| 4 | Guten Appetit! | shopping for food, at the table, food preferences | Akkusativ, verbs + Akk., mögen/möchten, word positions |
| 5 | Alltag und Familie | clock time, daily routine, family, appointments by phone, apologising for lateness | am/um/von…bis, possessives (Nom./Akk.), müssen/können/wollen |
| 6 | Zeit mit Freunden | leisure, dates, birthdays, invitations, ordering & paying, events | dates, separable verbs, pronouns (Akk.), für + Akk., Präteritum haben/sein |
| – | Plattform 2 | review | |
| 7 | Arbeitsalltag | office routine, locations, bank, media, letters, small talk | und/oder/aber, Dativ article, mit + Dativ, local prepositions + Dativ |
| 8 | Fit und gesund | body, illness, doctor, instructions | Imperativ du/ihr/Sie, sollen/müssen/dürfen |
| 9 | Meine Wohnung | flat ads, rooms, furniture, colours, likes/dislikes | sein + adjective, in + Akk., Wechselpräpositionen + Dativ |
| – | Plattform 3 | review | |
| 10 | Studium und Beruf | describing a day in the past, job search, phoning | Perfekt (haben/sein), Partizip II |
| 11 | Die Jacke gefällt mir! | clothes, department store, asking for information | welcher/dieser, Partizip II (separable/inseparable), pronouns & verbs with Dativ |
| 12 | Ab in den Urlaub! | city tour, directions, postcards, travel reports, weather | man, denn, Wer/Wen/Wem, temporal prepositions + Dativ |
| – | Plattform 4 | review | |

## 3. Grammatik aktiv (A1–B1): A1-tagged chapters (titles only)

| # | Topic | # | Topic |
|---|---|---|---|
| 1 | Personalpronomen | 17 | Akkusativ |
| 2 | Konjugation Präsens | 18 | Dativ |
| 3 | sein, haben und besondere Verben | 19 | Possessivartikel |
| 4 | Verben mit Vokalwechsel | 20 | Artikel: interrogativ und demonstrativ |
| 5 | Modalverben: Konjugation und Position | 21 | Personalpronomen: Akkusativ und Dativ |
| 6 | Modalverben: Gebrauch 1 | 25 | Präteritum: sein und haben |
| 7 | Modalverben: Gebrauch 2 | 26 | Perfekt mit haben |
| 8 | Trennbare Verben | 32 | Temporale Präpositionen |
| 9 | Imperativ | 33 | Präpositionen mit Dativ |
| 10 | Fragen mit Fragewort | 34 | Präpositionen mit Akkusativ |
| 11 | Ja-/Nein-Fragen und Antworten | 35 | Wechselpräpositionen mit Dativ |
| 12 | Position 2 im Satz | 44 | Hauptsätze verbinden (und, aber, oder, denn) |
| 14 | Nomen: Plural | 47 | Komposita |
| 15 | Artikel: definit, indefinit, kein Artikel | 48 | Zusammengesetzte Verben |
| 16 | Negation | 49 | Genusregeln |

The book labels Perfekt mit *sein* (27) and Partizip II in detail (28) as A2. Netzwerk neu introduces both at the end of A1. We follow CEFR/Goethe A1 here: the Perfekt is taught **receptively and with high-frequency verbs only** in A1, with full coverage in A2.

---

## 4. Impact on our A1 curriculum (revised proposal)

Compared with the Phase 0 module list, three things change:
- **Health, clothing and weather** get their own place, because they appear in both the textbook sequence and Goethe-style tasks.
- **Numbers, spelling, clock times and prices** are spread across early modules, because Goethe tests them in every section.
- The **order of grammar topics** follows the textbook's progression, so learners using the book alongside the app stay in sync. The mapping is metadata only.

| # | Our module (original content) | Netzwerk neu | Grammatik aktiv | Goethe tasks it prepares |
|---|---|---|---|---|
| 1 | Hallo! Greetings, introductions, spelling, numbers 0–20 | Kap. 1 | 1, 2, 10, 12 | Sprechen T1, Hören T1 (numbers) |
| 2 | Menschen & Berufe: hobbies, jobs, weekdays, numbers 20+, forms | Kap. 2 | 3, 11, 14, 15 | Schreiben T1 (form), Sprechen T1 |
| 3 | In der Stadt: places, transport, directions, months | Kap. 3 | 15, 16, 9 (Sie) | Hören T2 (announcements), Lesen T3 (signs) |
| 4 | Essen & Einkaufen | Kap. 4 | 17, 6, 12 | Hören T1 (prices), Sprechen T3 (requests) |
| 5 | Alltag & Familie: time, routine, family, appointments | Kap. 5 | 19, 5, 32 | Hören T3 (phone messages) |
| 6 | Freizeit & Feste: dates, invitations, restaurant | Kap. 6 | 8, 21, 34, 25 | Schreiben T2 (message), Lesen T1 |
| 7 | Arbeit & Büro | Kap. 7 | 44, 18, 33 | Lesen T1 (e-mails) |
| 8 | Gesundheit | Kap. 8 | 9, 7 | Hören T3, Sprechen T3 |
| 9 | Wohnen | Kap. 9 | 35, 34 | Lesen T2 (ads) |
| 10 | Was hast du gemacht? Past events, jobs | Kap. 10 | 26, 25 | Sprechen T2 |
| 11 | Kleidung & Kaufhaus | Kap. 11 | 20, 21 | Hören T2 (store announcements), Lesen T3 |
| 12 | Reisen & Wetter | Kap. 12 | 44 (denn), 10 | Schreiben T2, Hören T2 |
| – | Review units after modules 3, 6, 9 and 12, then 2 mock exams and the A1 final assessment | Plattform 1–4 | | full exam |

In Phase 2 this plan was checked against the chapter order and grammar lists (see `CURRICULUM-A1.md` §1). Module 1 is implemented and seeded as `reviewStatus: draft`; modules 2–12 follow the same pattern.

The per-skill A1 mastery thresholds used by the app are learning targets, **not** Goethe pass criteria (none are documented in these PDFs).

// Goethe-Zertifikat A1 exam parts as LGA uses them (dependency-free: also runs in the
// browser). A part key is the Goethe reference child's slug without the parent's prefix
// (curriculumService.goetheParts): goethe-start-deutsch-1-hoeren → "hoeren".
//
// Each part is practised by exercises of exactly one skill; the readiness report
// (readinessService) flags an exercise linked to a part with another skill.
export const GOETHE_PART_SKILLS = Object.freeze({
  hoeren: "listening",
  lesen: "reading",
  schreiben: "writing",
  sprechen: "speaking",
});

export const GOETHE_PART_TITLES = Object.freeze({ hoeren: "Hören", lesen: "Lesen", schreiben: "Schreiben", sprechen: "Sprechen" });

// What LGA's practice covers per exam part, and what it doesn't (docs/CURRICULUM-A1.md
// §2b, docs/EXAMS.md). Shown on Goethe Prep so that a part is never presented as fully
// practised when LGA can't practise all of it. Plain facts about the app, no claims about
// exam readiness.
export const GOETHE_PART_COVERAGE = Object.freeze({
  hoeren: {
    covered: "Listening exercises in the exam's formats: short conversations and phone messages you can play twice, and announcements you can play once. Scored automatically.",
    notCovered: null,
  },
  lesen: {
    covered: "Reading exercises with messages, e-mails, ads and signs, answered with richtig/falsch or a choice of answers. Scored automatically.",
    notCovered: null,
  },
  schreiben: {
    covered: "Forms and guided messages with gaps, scored automatically: the format of Teil 1.",
    notCovered:
      "Free writing (Teil 2, a message of about 30 words) is not practised or scored in LGA: free text can't be graded reliably by the app. Practise it with a teacher or tutor.",
  },
  sprechen: {
    covered: "Speaking practice: record yourself, listen back, compare with a model answer and rate yourself.",
    notCovered:
      "Nothing you say is scored, and there is no partner or examiner: the conversation parts (Teil 2 and 3) can be prepared here, but not practised as in the exam.",
  },
});

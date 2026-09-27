// Curriculum-alignment metadata only: titles, section structure and timings.
// No textbook or exam content is stored. See docs/REFERENCE-ANALYSIS.md.

const netzwerkChapters = [
  [1, "Guten Tag!"],
  [2, "Freunde, Kollegen und ich"],
  [3, "In Hamburg"],
  ["P1", "Plattform 1"],
  [4, "Guten Appetit!"],
  [5, "Alltag und Familie"],
  [6, "Zeit mit Freunden"],
  ["P2", "Plattform 2"],
  [7, "Arbeitsalltag"],
  [8, "Fit und gesund"],
  [9, "Meine Wohnung"],
  ["P3", "Plattform 3"],
  [10, "Studium und Beruf"],
  [11, "Die Jacke gefällt mir!"],
  [12, "Ab in den Urlaub!"],
  ["P4", "Plattform 4"],
];

// Grammatik aktiv A1–B1: chapters the book itself labels A1.
const grammatikAktivA1 = [
  [1, "Personalpronomen"],
  [2, "Konjugation Präsens"],
  [3, "sein, haben und besondere Verben"],
  [4, "Verben mit Vokalwechsel"],
  [5, "Modalverben: Konjugation und Position im Satz"],
  [6, "Modalverben: Gebrauch 1"],
  [7, "Modalverben: Gebrauch 2"],
  [8, "Trennbare Verben"],
  [9, "Imperativ"],
  [10, "Fragen mit Fragewort"],
  [11, "Ja-/Nein-Fragen und Antworten"],
  [12, "Position 2 im Satz"],
  [14, "Nomen: Plural"],
  [15, "Artikel: definit, indefinit, kein Artikel"],
  [16, "Negation"],
  [17, "Akkusativ"],
  [18, "Dativ"],
  [19, "Possessivartikel"],
  [20, "Artikel: interrogativ und demonstrativ"],
  [21, "Personalpronomen: Akkusativ und Dativ"],
  [25, "Präteritum: sein und haben"],
  [26, "Perfekt mit haben"],
  [32, "Temporale Präpositionen"],
  [33, "Präpositionen mit Dativ"],
  [34, "Präpositionen mit Akkusativ"],
  [35, "Wechselpräpositionen mit Dativ"],
  [44, "Hauptsätze verbinden (Position 0)"],
  [47, "Komposita"],
  [48, "Zusammengesetzte Verben"],
  [49, "Genusregeln"],
];

// Goethe-Zertifikat A1: Start Deutsch 1 — structure from Modellsatz (8. Aufl., 02/2024)
// and Übungssatz 02 (6. Aufl., 02/2024). Points are raw points as documented there;
// Sprechen maximum and overall pass mark are not documented in those PDFs.
const goetheSections = [
  { key: "hoeren", title: "Hören", minutes: 20, parts: 3, items: 15, maxPoints: 15 },
  { key: "lesen", title: "Lesen", minutes: 25, parts: 3, items: 15, maxPoints: 15 },
  { key: "schreiben", title: "Schreiben", minutes: 20, parts: 2, items: 2, maxPoints: 15 },
  { key: "sprechen", title: "Sprechen", minutes: 15, parts: 3, items: 3, maxPoints: null },
];

export const REFERENCES = [
  {
    slug: "netzwerk-neu-a1",
    kind: "book",
    title: "Netzwerk neu A1",
    publisher: "Klett",
    notes: "Mapping reference only. No content from the Kursbuch or Übungsbuch is reproduced.",
    order: 1,
    children: netzwerkChapters.map(([n, title], i) => ({
      slug: `netzwerk-neu-a1-${String(n).toLowerCase()}`,
      kind: "chapter",
      title: typeof n === "number" ? `Kapitel ${n}: ${title}` : title,
      order: i + 1,
      meta: { chapter: String(n) },
    })),
  },
  {
    slug: "grammatik-aktiv-a1-b1",
    kind: "book",
    title: "Grammatik aktiv A1–B1",
    publisher: "Cornelsen",
    notes: "Grammar topic mapping only. No explanations, examples or exercises are reproduced.",
    order: 2,
    children: grammatikAktivA1.map(([n, title]) => ({
      slug: `grammatik-aktiv-${n}`,
      kind: "topic",
      title: `${n} ${title}`,
      order: n,
      meta: { chapter: String(n), level: "A1" },
    })),
  },
  {
    slug: "goethe-start-deutsch-1",
    kind: "exam_spec",
    title: "Goethe-Zertifikat A1: Start Deutsch 1",
    publisher: "Goethe-Institut",
    notes: "Official exam structure (sections, timing, documented scoring). Our practice exams are original.",
    order: 3,
    children: goetheSections.map((s, i) => ({
      slug: `goethe-start-deutsch-1-${s.key}`,
      kind: "exam_spec",
      title: s.title,
      order: i + 1,
      meta: {
        minutes: s.minutes,
        parts: s.parts,
        items: s.items,
        ...(s.maxPoints == null ? { maxPointsDocumented: false } : { maxPoints: s.maxPoints }),
      },
    })),
  },
];

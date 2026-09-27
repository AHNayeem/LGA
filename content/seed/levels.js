// CEFR level structure. Only structural metadata; lessons/modules are Phase 2 content.
// Bangla titles are intentionally omitted until a reviewer supplies them (UI falls back to English).
// Mastery thresholds are the app's learning targets (NOT official Goethe pass criteria),
// adjustable per level/module/lesson without code changes.
export const LEVELS = [
  {
    code: "A1",
    order: 1,
    title: { de: "A1 – Anfänger", en: "A1 – Beginner" },
    description: {
      en: "Understand and use everyday expressions, introduce yourself, and handle simple interactions.",
    },
    mastery: {
      skills: {
        vocabulary: { threshold: 0.8, required: true },
        grammar: { threshold: 0.75, required: true },
        reading: { threshold: 0.7, required: true },
        listening: { threshold: 0.7, required: true },
        speaking: { threshold: 0.6, required: false },
        writing: { threshold: 0.6, required: false },
      },
    },
  },
  { code: "A2", order: 2, title: { de: "A2 – Grundlegende Kenntnisse", en: "A2 – Elementary" } },
  { code: "B1", order: 3, title: { de: "B1 – Fortgeschrittene Sprachverwendung", en: "B1 – Intermediate" } },
  { code: "B2", order: 4, title: { de: "B2 – Selbständige Sprachverwendung", en: "B2 – Upper intermediate" } },
  { code: "C1", order: 5, title: { de: "C1 – Fachkundige Sprachkenntnisse", en: "C1 – Advanced" } },
  { code: "C2", order: 6, title: { de: "C2 – Annähernd muttersprachliche Kenntnisse", en: "C2 – Proficient" } },
];

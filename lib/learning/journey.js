import { EXERCISE_BLOCK_TYPES } from "@/lib/content/constants";
import { lessonCompletion, moduleCompletion, scopeMastery } from "@/lib/learning/progress";
import { isDue } from "@/lib/learning/srs";
import { practiceSummary } from "@/lib/learning/topics";

// Learner journey views: what the learner has done in a level, what to do next and how
// they are doing. Pure functions of
//
//   structure   the level's published content, reduced to what these views need
//               (built by journeyService.getLevelStructure on the server)
//   state       the learner state (lib/learning/state.js): from the database for
//               signed-in learners, from this browser for guests
//
// The server runs them for signed-in learners and the browser runs the very same
// functions for guests, so every number means the same everywhere. The definitions are
// documented in docs/LEARNER.md; change them there too.
//
// structure = {
//   level: { code, title, description },
//   rules,                                  level mastery rules (resolved)
//   modules: [{ id, slug, levelCode, order, title, description, goals, aiGenerated,
//               rules,                      level + module rules (resolved)
//               lessons: [{ id, slug, order, title, description, estimatedMinutes,
//                           blocks: [{ key, type, title, refId?, vocabIds? }], grammar: [title],
//                           grammarTopics: [{ id, slug, title }] }] }],
//   exercises: { [exerciseId]: { title, skill, maxScore, passThreshold, goethe } },
//   grammar: { [grammarTopicId]: { slug, title, summary } },   topics taught in these lessons
//   vocabTopics?: { [topic]: [vocabId] },   Practice pages only (lib/learning/topics.js)
//   goethe: [{ key, title, minutes, parts, items }],      Goethe exam parts for this level
//   exams: [{ id, slug, title, description, durationMinutes, passThreshold, questionCount, sections: [{ key, title }] }],
// }

const EXERCISE_BLOCKS = new Set(EXERCISE_BLOCK_TYPES);

export const lessonHref = (levelCode, moduleSlug, lessonSlug, blockKey = null) =>
  `/learn/${levelCode.toLowerCase()}/${moduleSlug}/${lessonSlug}${blockKey ? `?block=${blockKey}` : ""}`;
export const moduleHref = (levelCode, moduleSlug) => `/learn/${levelCode.toLowerCase()}/${moduleSlug}`;
export const goetheHref = (levelCode, sectionKey = null) => `/goethe/${levelCode.toLowerCase()}${sectionKey ? `/${sectionKey}` : ""}`;
export const examHref = (levelCode, examSlug) => `/exams/${levelCode.toLowerCase()}/${examSlug}`;

const lessonState = (state, lessonId) => state?.lessons?.[lessonId] ?? null;

function sortedModules(structure) {
  return [...structure.modules].sort((a, b) => a.order - b.order);
}

// Every exercise block of the given lessons once, in lesson order, with the learner's
// latest result from the lesson it appears in first.
function exerciseOccurrences(structure, lessons, state, mod = null) {
  const seen = new Set();
  const out = [];
  for (const { lesson, module } of lessons) {
    const p = lessonState(state, lesson.id);
    for (const b of lesson.blocks) {
      if (!EXERCISE_BLOCKS.has(b.type)) continue;
      const ex = structure.exercises[b.refId];
      if (!ex || seen.has(b.refId)) continue;
      seen.add(b.refId);
      out.push({ id: b.refId, ex, block: b, lesson, module: module ?? mod, progress: p?.exercises?.[b.refId] ?? null });
    }
  }
  return out;
}

const lessonsOf = (mod) => [...mod.lessons].sort((a, b) => a.order - b.order).map((lesson) => ({ lesson, module: mod }));
const allLessons = (structure) => sortedModules(structure).flatMap(lessonsOf);

function masteryEntries(occurrences) {
  return occurrences.map((o) => ({ skill: o.ex.skill, maxScore: o.ex.maxScore, last: o.progress?.last ?? null }));
}

// --- Modules --------------------------------------------------------------------------

// Module progress (blocks done / all blocks), lessons completed, skill mastery against the
// module's rules and the next unfinished lesson.
export function summarizeModule(structure, mod, state) {
  const lessons = lessonsOf(mod).map(({ lesson }) => {
    const p = lessonState(state, lesson.id);
    return {
      id: lesson.id,
      slug: lesson.slug,
      title: lesson.title,
      description: lesson.description ?? null,
      order: lesson.order,
      estimatedMinutes: lesson.estimatedMinutes ?? null,
      completion: lessonCompletion(lesson, p),
      completedAt: p?.completedAt ?? null,
    };
  });
  const mastery = scopeMastery(mod.rules, masteryEntries(exerciseOccurrences(structure, lessonsOf(mod), state)));
  const next = lessons.find((l) => !l.completion.complete) ?? null;
  return {
    module: {
      id: mod.id,
      slug: mod.slug,
      levelCode: mod.levelCode,
      order: mod.order,
      title: mod.title,
      description: mod.description ?? null,
      goals: mod.goals ?? [],
      aiGenerated: Boolean(mod.aiGenerated),
    },
    lessons,
    completion: moduleCompletion(lessons.map((l) => l.completion)),
    mastery,
    nextLesson: next ? { slug: next.slug, title: next.title } : null,
  };
}

export function summarizeModules(structure, state) {
  return sortedModules(structure).map((m) => summarizeModule(structure, m, state));
}

const isModuleComplete = (summary) => summary.completion.lessonsTotal > 0 && summary.completion.lessonsCompleted === summary.completion.lessonsTotal;

// --- Where to continue ----------------------------------------------------------------

// The first unfinished lesson, starting at the learner's chosen starting module (if any);
// modules before it are only suggested once everything after it is done.
export function continueAt(structure, summaries, state) {
  const start = state?.profile?.startModule ? structure.modules.find((m) => m.slug === state.profile.startModule) : null;
  const ordered = [...summaries].sort((a, b) => a.module.order - b.module.order);
  const from = start ? ordered.filter((s) => s.module.order >= start.order) : ordered;
  const summary = from.find((s) => s.nextLesson) ?? ordered.find((s) => s.nextLesson);
  if (!summary) return null;
  const lesson = summary.lessons.find((l) => l.slug === summary.nextLesson.slug);
  const code = structure.level.code;
  return {
    module: { slug: summary.module.slug, title: summary.module.title, order: summary.module.order },
    lesson: {
      slug: lesson.slug,
      title: lesson.title,
      estimatedMinutes: lesson.estimatedMinutes,
      stepsDone: lesson.completion.done,
      stepsTotal: lesson.completion.total,
    },
    started: lesson.completion.done > 0,
    href: lessonHref(code, summary.module.slug, lesson.slug),
  };
}

// --- Level ----------------------------------------------------------------------------

// Level-wide skills use the level's rules and the same calculation as a module (latest
// attempt per exercise, unattempted exercises count as 0): that score says how far the
// learner is towards the level target. `breakdown[skill].performance` is the score on the
// exercises actually attempted (latest attempts): how well they are doing so far. A skill
// with no attempt has performance null ("Not started yet").
export function levelSkills(structure, state) {
  const occurrences = exerciseOccurrences(structure, allLessons(structure), state);
  const mastery = scopeMastery(structure.rules, masteryEntries(occurrences));
  const tried = {};
  for (const o of occurrences) {
    const last = o.progress?.last;
    if (!(o.ex.maxScore > 0) || !last?.maxScore) continue;
    const t = (tried[o.ex.skill] ??= { score: 0, maxScore: 0 });
    t.score += (last.score / last.maxScore) * o.ex.maxScore;
    t.maxScore += o.ex.maxScore;
  }
  for (const [skill, b] of Object.entries(mastery.breakdown)) b.performance = tried[skill] ? tried[skill].score / tried[skill].maxScore : null;
  const ungraded = {};
  for (const o of occurrences) {
    if (o.ex.maxScore > 0) continue;
    const u = (ungraded[o.ex.skill] ??= { exercises: 0, practised: 0 });
    u.exercises += 1;
    if (o.progress?.attempts > 0) u.practised += 1;
  }
  return { ...mastery, ungraded };
}

// Skills where the learner's results so far (performance on attempted exercises) are
// below the target, weakest first. Exercises not done yet never make a skill "weak".
export function weakSkills(skills) {
  return Object.entries(skills.skills)
    .map(([skill, r]) => ({
      skill,
      performance: skills.breakdown?.[skill]?.performance ?? null,
      // How many exercises the performance rests on: shown with it, so one attempt isn't
      // presented as a settled weakness.
      attempted: skills.breakdown?.[skill]?.attempted ?? 0,
      threshold: r.threshold,
      status: r.status,
    }))
    .filter((w) => w.status !== "not_assessed" && w.performance != null && w.performance < w.threshold)
    .sort((a, b) => a.performance - b.performance)
    .map(({ skill, performance, attempted, threshold }) => ({ skill, performance, attempted, threshold }));
}

export function levelOverview(structure, state) {
  const modules = summarizeModules(structure, state);
  const lessonsTotal = modules.reduce((n, m) => n + m.completion.lessonsTotal, 0);
  const lessonsCompleted = modules.reduce((n, m) => n + m.completion.lessonsCompleted, 0);
  return {
    level: structure.level,
    modules,
    lessons: { completed: lessonsCompleted, total: lessonsTotal },
    modulesCompleted: modules.filter(isModuleComplete).length,
    // Modules with at least one live lesson: the ones a learner can complete.
    modulesAvailable: modules.filter((m) => m.completion.lessonsTotal > 0).length,
    complete: lessonsTotal > 0 && lessonsCompleted === lessonsTotal,
    skills: levelSkills(structure, state),
    continueAt: continueAt(structure, modules, state),
  };
}

// --- Review ---------------------------------------------------------------------------

// Words used in this level's lessons that are due for review now.
export function dueVocabulary(structure, state, now = new Date()) {
  const ids = new Set();
  for (const { lesson } of allLessons(structure)) {
    for (const b of lesson.blocks) if (b.type === "vocabulary") for (const id of b.vocabIds ?? []) ids.add(id);
  }
  const due = [...ids]
    .map((id) => [id, state?.vocab?.[id]])
    .filter(([, s]) => isDue(s, now))
    .sort((a, b) => new Date(a[1].dueAt) - new Date(b[1].dueAt))
    .map(([id]) => id);
  return { count: due.length, ids: due };
}

// A mistake is a graded exercise whose LATEST attempt scored below 100%. It disappears
// once the learner gets it fully right. In lesson order.
export function mistakes(structure, state, { lessons = allLessons(structure) } = {}) {
  const code = structure.level.code;
  return exerciseOccurrences(structure, lessons, state)
    .filter((o) => o.ex.maxScore > 0 && o.progress?.last && (o.progress.last.ratio ?? 0) < 1)
    .map((o) => ({
      exerciseId: o.id,
      title: o.ex.title,
      skill: o.ex.skill,
      goethe: o.ex.goethe ?? null,
      score: o.progress.last.score,
      maxScore: o.progress.last.maxScore,
      ratio: o.progress.last.ratio,
      passed: Boolean(o.progress.last.passed),
      at: o.progress.last.at,
      lesson: { id: o.lesson.id, slug: o.lesson.slug, title: o.lesson.title, grammar: o.lesson.grammar ?? [], grammarTopics: o.lesson.grammarTopics ?? [] },
      module: { slug: o.module.slug, title: o.module.title, order: o.module.order },
      href: lessonHref(code, o.module.slug, o.lesson.slug, o.block.key),
    }));
}

// Mistakes grouped by lesson (with the lesson's grammar topics as context), and counted
// per skill.
export function groupMistakes(list) {
  const byLesson = [];
  const index = new Map();
  const bySkill = {};
  for (const m of list) {
    if (!index.has(m.lesson.id)) {
      index.set(m.lesson.id, byLesson.length);
      byLesson.push({ lesson: m.lesson, module: m.module, items: [] });
    }
    byLesson[index.get(m.lesson.id)].items.push(m);
    bySkill[m.skill] = (bySkill[m.skill] ?? 0) + 1;
  }
  return { count: list.length, byLesson, bySkill };
}

// --- Goethe preparation -----------------------------------------------------------------

// Per Goethe exam part: the lesson exercises that prepare it (exercise refs), how many
// the learner has practised, and the score on the practised ones (latest attempts).
// Ungraded parts (speaking) only count practice.
//
// `next` is one suggested exercise with the reason for it, by fixed rules (no model, no
// prediction), first match wins:
//   mistake   the first exercise (course order) whose latest attempt wasn't fully right
//   started   the first exercise not practised yet in a lesson the learner has started
//   order     the first exercise not practised yet, in course order
// `exam` is the part's result in the most recent practice exam, when there is one; the
// page shows it next to the suggestion, as a result, not as a diagnosis.
export function goethePrep(structure, state) {
  const code = structure.level.code;
  const occurrences = exerciseOccurrences(structure, allLessons(structure), state);
  const startedLessons = new Set(
    Object.entries(state?.lessons ?? {})
      .filter(([, l]) => (l.blocksDone?.length ?? 0) > 0 || Object.keys(l.exercises ?? {}).length > 0)
      .map(([id]) => id),
  );
  const latestExam = examResults(structure, state)
    .filter((e) => e.latest)
    .sort((a, b) => String(b.latest.at ?? "").localeCompare(String(a.latest.at ?? "")))[0];

  return structure.goethe.map((section) => {
    const exercises = occurrences
      .filter((o) => o.ex.goethe === section.key)
      .map((o) => {
        const last = o.progress?.last ?? null;
        const graded = o.ex.maxScore > 0;
        const status = !o.progress?.attempts ? "new" : !graded ? "practised" : (last?.ratio ?? 0) >= 1 ? "perfect" : last?.passed ? "passed" : "mistakes";
        return {
          id: o.id,
          title: o.ex.title,
          skill: o.ex.skill,
          graded,
          status,
          last,
          lesson: { id: o.lesson.id, slug: o.lesson.slug, title: o.lesson.title },
          module: { slug: o.module.slug, title: o.module.title, order: o.module.order },
          // From Goethe Prep, the lesson offers the way back to this part.
          href: `${lessonHref(code, o.module.slug, o.lesson.slug, o.block.key)}&from=goethe-${section.key}`,
        };
      });
    const practised = exercises.filter((e) => e.status !== "new");
    const gradedPractised = practised.filter((e) => e.graded && e.last);
    const max = gradedPractised.reduce((n, e) => n + e.last.maxScore, 0);
    const score = gradedPractised.reduce((n, e) => n + e.last.score, 0);

    const again = exercises.find((e) => e.status === "mistakes");
    const fresh = exercises.filter((e) => e.status === "new");
    const inStarted = fresh.find((e) => startedLessons.has(e.lesson.id));
    const next = again
      ? { exercise: again, reason: { kind: "mistake", score: again.last.score, maxScore: again.last.maxScore } }
      : inStarted
        ? { exercise: inStarted, reason: { kind: "started" } }
        : fresh[0]
          ? { exercise: fresh[0], reason: { kind: "order" } }
          : null;
    const examPart = latestExam?.latest.sections.find((sec) => sec.key === section.key) ?? null;

    return {
      ...section,
      teile: section.teile ?? [],
      href: goetheHref(code, section.key),
      total: exercises.length,
      practised: practised.length,
      gradedPractised: gradedPractised.length,
      perfect: exercises.filter((e) => e.status === "perfect").length,
      lessons: new Set(exercises.map((e) => e.lesson.id)).size,
      graded: exercises.some((e) => e.graded),
      ratio: max > 0 ? score / max : null,
      toImprove: exercises.filter((e) => e.status === "mistakes").length,
      next,
      exam: examPart ? { title: latestExam.title, href: latestExam.href, ratio: examPart.ratio, belowTarget: examPart.belowTarget, at: latestExam.latest.at } : null,
      exercises,
    };
  });
}

// The learner's results per practice exam: latest and best, with the latest section
// results mapped to Goethe parts (section key = Goethe part key) for targeted practice.
export function examResults(structure, state) {
  const parts = new Set(structure.goethe.map((g) => g.key));
  return (structure.exams ?? []).map((exam) => {
    const results = state?.exams?.[exam.id] ?? [];
    const latest = results[0] ?? null;
    return {
      ...exam,
      href: examHref(structure.level.code, exam.slug),
      taken: results.length,
      best: results.length ? Math.max(...results.map((r) => r.ratio ?? 0)) : null,
      latest: latest
        ? {
            ...latest,
            sections: latest.sections.map((s) => ({
              ...s,
              belowTarget: s.ratio != null && s.ratio < (latest.passThreshold ?? exam.passThreshold),
              practiceHref: parts.has(s.key) ? goetheHref(structure.level.code, s.key) : null,
            })),
          }
        : null,
    };
  });
}

// --- Today --------------------------------------------------------------------------

// A short, deterministic plan (docs/LEARNER.md, "Today's plan"):
//   1. the next lesson (with the lesson's own time estimate)
//   2. words due for review
//   3. up to two mistakes to practise again, from the weakest skills first
//   4. for learners preparing for Goethe (or practising skills): the exam part practised least
//   5. once every lesson is done: the practice exam
// Only lessons carry a time estimate, so only they show minutes.
export function todayPlan(structure, state, { now = new Date(), overview = levelOverview(structure, state) } = {}) {
  const items = [];
  const code = structure.level.code;
  const c = overview.continueAt;
  if (c) {
    items.push({
      kind: "lesson",
      title: c.lesson.title,
      context: c.module.title,
      moduleOrder: c.module.order,
      detail: c.started ? { stepsDone: c.lesson.stepsDone, stepsTotal: c.lesson.stepsTotal } : null,
      minutes: c.lesson.estimatedMinutes ?? null,
      href: c.href,
    });
  }
  const due = dueVocabulary(structure, state, now);
  if (due.count > 0) items.push({ kind: "review", count: due.count, minutes: null, href: "/review" });

  const weak = weakSkills(overview.skills).map((w) => w.skill);
  const rank = (skill) => (weak.includes(skill) ? weak.indexOf(skill) : weak.length);
  const open = mistakes(structure, state).sort((a, b) => rank(a.skill) - rank(b.skill) || a.ratio - b.ratio);
  for (const m of open.slice(0, 2)) {
    items.push({ kind: "mistake", title: m.title, context: m.lesson.title, skill: m.skill, score: m.score, maxScore: m.maxScore, minutes: null, href: m.href });
  }

  // Goethe preparation, or skill practice (the Goethe parts are the four skills).
  if (state?.profile?.goal === "goethe" || state?.profile?.goal === "skills") {
    const part = goethePrep(structure, state)
      .filter((g) => g.total > 0 && g.practised < g.total)
      .sort((a, b) => a.practised / a.total - b.practised / b.total)[0];
    if (part) items.push({ kind: "goethe", goal: state.profile.goal, title: part.title, practised: part.practised, total: part.total, minutes: null, href: part.href });
  }

  if (!c && overview.lessons.total > 0) {
    const exam = (structure.exams ?? [])[0];
    if (exam) items.push({ kind: "exam", title: exam.title, minutes: exam.durationMinutes ?? null, href: examHref(code, exam.slug) });
  }
  const minutes = items.reduce((n, i) => n + (i.minutes ?? 0), 0);
  return { items, knownMinutes: minutes || null };
}

// --- Page views -----------------------------------------------------------------------

export function homeView(structure, state, { now = new Date() } = {}) {
  const overview = levelOverview(structure, state);
  const due = dueVocabulary(structure, state, now);
  const goethe = goethePrep(structure, state).map(({ exercises, ...s }) => s);
  return {
    level: structure.level,
    profile: state?.profile ?? null,
    overview: { ...overview, modules: overview.modules },
    plan: todayPlan(structure, state, { now, overview }),
    reviewDue: due.count,
    mistakes: mistakes(structure, state).length,
    weakSkills: weakSkills(overview.skills),
    practice: practiceSummary(structure, state),
    goethe,
    exams: examResults(structure, state),
  };
}

export function levelView(structure, state) {
  return { ...levelOverview(structure, state), exams: examResults(structure, state), goethe: goethePrep(structure, state).map(({ exercises, ...s }) => s) };
}

export function moduleView(structure, state, moduleSlug) {
  const mods = sortedModules(structure);
  const i = mods.findIndex((m) => m.slug === moduleSlug);
  if (i < 0) return null;
  const summary = summarizeModule(structure, mods[i], state);
  const next = mods.slice(i + 1).find((m) => m.lessons.length > 0) ?? null;
  const firstLesson = next ? [...next.lessons].sort((a, b) => a.order - b.order)[0] : null;
  const own = mistakes(structure, state, { lessons: lessonsOf(mods[i]) });
  return {
    level: structure.level,
    ...summary,
    complete: isModuleComplete(summary),
    mistakes: own.length,
    nextModule: next
      ? { slug: next.slug, title: next.title, order: next.order, href: lessonHref(structure.level.code, next.slug, firstLesson.slug), firstLesson: { slug: firstLesson.slug, title: firstLesson.title } }
      : null,
    // Every live lesson of the level complete (the same rule as levelOverview.complete):
    // modules with no live lessons yet (content still being published) don't hold it back.
    levelComplete: levelOverview(structure, state).complete,
    exams: (structure.exams ?? []).map((e) => ({ slug: e.slug, title: e.title, href: examHref(structure.level.code, e.slug) })),
  };
}

export function reviewView(structure, state, { now = new Date() } = {}) {
  const list = mistakes(structure, state);
  return {
    level: structure.level,
    due: dueVocabulary(structure, state, now),
    mistakes: groupMistakes(list),
    weakSkills: weakSkills(levelSkills(structure, state)),
    weakTopics: practiceSummary(structure, state).weakTopics,
  };
}

export function goetheView(structure, state) {
  return { level: structure.level, sections: goethePrep(structure, state), exams: examResults(structure, state) };
}

export function goetheSectionView(structure, state, sectionKey) {
  const section = goethePrep(structure, state).find((s) => s.key === sectionKey);
  if (!section) return null;
  return { level: structure.level, section, exams: examResults(structure, state) };
}

export const JOURNEY_VIEWS = Object.freeze({
  home: homeView,
  level: levelView,
  review: reviewView,
  goethe: goetheView,
});

// --- Lesson player --------------------------------------------------------------------

// The lesson's blocks as the progress functions need them.
export function lessonBlocksOf(data) {
  return (data.blocks ?? []).map((b) => ({ key: b.key, type: b.type, ...(b.exercise ? { refId: b.exercise.id } : {}) }));
}

// A lesson view (getLearnerLesson) with a learner state applied: step done flags, stats,
// completion and results. Guests' browsers use it on the fresh view the server sends; it
// produces what the server computes for a signed-in learner.
export function lessonViewWithState(data, lessonProgress) {
  if (!data.available) return data;
  const blocks = lessonBlocksOf(data);
  const completion = lessonCompletion({ blocks }, lessonProgress);
  return {
    ...data,
    blocks: data.blocks.map((b, i) => {
      const p = b.exercise ? lessonProgress?.exercises?.[b.exercise.id] : null;
      return {
        ...b,
        done: completion.blocks[i].done,
        ...(b.exercise ? { stats: p ? { attempts: p.attempts, bestRatio: p.bestRatio ?? null, last: p.last ?? null } : null } : {}),
      };
    }),
    completion: { total: completion.total, done: completion.done, complete: completion.complete },
    completedAt: lessonProgress?.completedAt ?? null,
    results: (data.results ?? []).map((r) => {
      const p = lessonProgress?.exercises?.[r.exerciseId];
      return { ...r, attempts: p?.attempts ?? 0, last: p?.last ?? null };
    }),
  };
}

import { toClientExercise } from "@/lib/exercises/engine";

// Builds a fully correct (or deliberately wrong) submission from an exercise's own answer
// key, the way a learner would: by picking the options/tokens shown in the client payload.
// Used to check that an answer key is self-consistent (the key scores 100%, wrong answers
// don't pass): by the content integrity tests on the source files and by the readiness
// report on stored content (lib/services/readinessService.js). Never sent to a browser.
// `seedPrefix`: the per-attempt shuffle seed used in exams.
export function keyAnswers(exercise, exerciseId, { wrong = false, seedPrefix = null } = {}) {
  const client = toClientExercise(exercise, { exerciseId, seedPrefix });
  const answers = {};
  for (const item of exercise.items) {
    const c = client.items.find((i) => i.id === item.id);
    switch (item.type) {
      case "mcq":
        answers[item.id] = wrong ? item.options.find((o) => o.id !== item.answer).id : item.answer;
        break;
      case "true_false":
        answers[item.id] = wrong ? !item.answer : item.answer;
        break;
      case "text_input":
        answers[item.id] = wrong ? "xyz" : item.accepted[0];
        break;
      case "match": {
        const used = new Set();
        answers[item.id] = Object.fromEntries(
          item.pairs.map((p) => {
            const r = c.right.find((x) => JSON.stringify(x.text) === JSON.stringify(p.right) && !used.has(x.id));
            if (!r) throw new Error(`match item ${item.id}: no option for pair ${p.id}`);
            used.add(r.id);
            return [p.id, r.id];
          }),
        );
        if (wrong) {
          const ids = Object.keys(answers[item.id]);
          const vals = ids.map((k) => answers[item.id][k]);
          ids.forEach((k, i) => (answers[item.id][k] = vals[(i + 1) % vals.length]));
        }
        break;
      }
      case "order": {
        const pool = [...c.tokens];
        const ids = item.tokens.map((t) => {
          const idx = pool.findIndex((x) => x && x.text === t);
          if (idx < 0) throw new Error(`order item ${item.id}: token "${t}" not offered`);
          const id = pool[idx].id;
          pool[idx] = null;
          return id;
        });
        answers[item.id] = wrong ? [...ids].reverse() : ids;
        break;
      }
      case "speak_prompt":
        answers[item.id] = "confident";
        break;
      default:
        throw new Error(`unsupported item type ${item.type}`);
    }
  }
  return answers;
}

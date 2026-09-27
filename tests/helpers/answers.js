import { toClientExercise } from "@/lib/exercises/engine";

// Builds a fully correct (or deliberately wrong) submission from an authored exercise,
// the way a learner would: by picking options/tokens shown in the client payload.
export function answersFor(exercise, exerciseId, { wrong = false } = {}) {
  const client = toClientExercise(exercise, { exerciseId });
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
        throw new Error(`answersFor: unsupported type ${item.type}`);
    }
  }
  return answers;
}

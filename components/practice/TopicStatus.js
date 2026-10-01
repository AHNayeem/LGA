// One line saying how a grammar topic is going, always as text (never colour alone), from
// lib/learning/topics.js. "% right" always says how many exercises it rests on.
const pct = (r) => `${Math.round((r ?? 0) * 100)}%`;
const exercisesText = (n) => (n === 1 ? "1 exercise" : `${n} exercises`);

export function topicStatusText(t) {
  switch (t.status) {
    case "no_exercises":
      return "Explanation only";
    case "new":
      return `Not practised yet · ${exercisesText(t.total)}`;
    case "needs_practice":
      return `Needs practice · ${pct(t.performance)} right in ${t.attempted === 1 ? "the one exercise" : `${t.attempted} exercises`} you did`;
    default:
      return `${pct(t.performance)} right · ${t.attempted} of ${exercisesText(t.total)} practised`;
  }
}

// The result part only ("67% right in the one exercise you did"), where a label already
// says the status.
export function topicResultText(t) {
  return topicStatusText(t).replace(/^Needs practice · /, "");
}

export default function TopicStatus({ topic, className = "" }) {
  const tone = topic.status === "needs_practice" ? "text-warning-700 font-medium" : "text-ink-muted";
  return (
    <span className={`${tone} ${className}`} data-topic-status={topic.status}>
      {topicStatusText(topic)}
    </span>
  );
}

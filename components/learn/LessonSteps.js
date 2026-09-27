import Link from "next/link";
import LocalizedText from "@/components/ui/LocalizedText";

const TYPE_LABEL = {
  intro: "Introduction",
  vocabulary: "Words",
  grammar: "Grammar",
  reading: "Reading",
  listening: "Listening",
  speaking: "Speaking",
  writing: "Writing",
  practice: "Practice",
  mini_test: "Test",
  mastery_check: "Check",
};

export function blockLabel(block) {
  return TYPE_LABEL[block.type] ?? block.type;
}

// Step list for a lesson: horizontal scroller on phones, vertical list on desktop.
export default function LessonSteps({ blocks, currentKey, hrefFor, locale }) {
  return (
    <nav aria-label="Lesson steps">
      {/* `relative` keeps the absolutely positioned sr-only labels inside the scroller. */}
      <ol className="relative flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
        {blocks.map((b, i) => {
          const current = b.key === currentKey;
          return (
            <li key={b.key} className="shrink-0">
              <Link
                href={hrefFor(b.key)}
                aria-current={current ? "step" : undefined}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                  current ? "border-brand-600 bg-brand-50 font-medium" : "border-line bg-surface hover:bg-canvas"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`flex size-5 shrink-0 items-center justify-center rounded-full text-xs ${
                    b.done ? "bg-success-700 text-white" : "border border-line text-ink-muted"
                  }`}
                >
                  {b.done ? "✓" : i + 1}
                </span>
                <span className="whitespace-nowrap">
                  {b.title ? <LocalizedText text={b.title} prefer={locale} /> : blockLabel(b)}
                </span>
                <span className="sr-only">{b.done ? "(done)" : "(not done)"}</span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

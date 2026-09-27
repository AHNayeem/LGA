import Link from "next/link";
import LocalizedText from "@/components/ui/LocalizedText";
import ProgressBar from "@/components/learn/ProgressBar";

export default function ModuleCard({ summary, href, locale = "en" }) {
  const { module: mod, completion, mastery } = summary;
  return (
    <Link href={href} className="block h-full rounded-xl border border-line bg-surface p-5 hover:border-brand-600/40" data-module={mod.slug}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Module {mod.order}</p>
          <LocalizedText as="h3" text={mod.title} prefer="de" className="text-lg font-semibold" />
        </div>
        {mastery.mastered && <span className="rounded-full bg-success-50 px-2 py-0.5 text-xs font-medium text-success-700">Mastered</span>}
      </div>
      {mod.description && <LocalizedText as="p" text={mod.description} prefer={locale} className="mt-1 text-sm text-ink-muted" />}
      <div className="mt-4 flex justify-between text-sm">
        <span>
          {completion.lessonsCompleted}/{completion.lessonsTotal} lessons
        </span>
        <span className="tabular-nums text-ink-muted" data-testid="module-percent">
          {completion.percent}%
        </span>
      </div>
      <ProgressBar value={completion.percent} label="Module progress" className="mt-1.5" tone={mastery.mastered ? "success" : "brand"} />
    </Link>
  );
}

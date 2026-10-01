import LocalizedText from "@/components/ui/LocalizedText";

// Every word of a deck at a glance (lesson word steps, word topics in Practice).
export default function WordList({ cards, locale, label = "All words in this step" }) {
  return (
    <details className="rounded-xl border border-line bg-surface p-4">
      <summary className="cursor-pointer font-medium">
        {label} ({cards.length})
      </summary>
      <ul className="mt-3 divide-y divide-line text-sm">
        {cards.map((c) => (
          <li key={c.id} className="flex flex-wrap justify-between gap-2 py-2">
            <span lang="de" className="font-medium">
              {c.display}
              {c.plural && <span className="font-normal text-ink-muted"> · {c.plural}</span>}
            </span>
            <LocalizedText text={c.meanings} prefer={locale} className="text-ink-muted" />
          </li>
        ))}
      </ul>
    </details>
  );
}

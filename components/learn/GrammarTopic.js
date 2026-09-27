import LocalizedText from "@/components/ui/LocalizedText";

// Structured grammar explanation (headings, text, tables, examples). Rendered as plain
// text only; no HTML from content is ever injected.
export default function GrammarTopic({ grammar, locale = "en" }) {
  return (
    <article className="space-y-6">
      <header>
        <LocalizedText as="h2" text={grammar.title} prefer="de" className="text-xl font-semibold" />
        {grammar.summary && <LocalizedText as="p" text={grammar.summary} prefer={locale} className="mt-1 text-ink-muted" />}
      </header>
      {grammar.sections.map((s, i) => (
        <section key={i} className="space-y-3">
          {s.heading && <LocalizedText as="h3" text={s.heading} prefer={locale} className="font-semibold" />}
          {s.body && <LocalizedText as="p" text={s.body} prefer={locale} className="leading-relaxed" />}
          {s.table && (
            <div className="overflow-x-auto rounded-lg border border-line">
              <table className="w-full text-left text-sm" lang="de">
                <thead className="bg-canvas">
                  <tr>
                    {s.table.headers.map((h, j) => (
                      <th key={j} scope="col" className="px-3 py-2 font-semibold">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {s.table.rows.map((row, r) => (
                    <tr key={r} className="border-t border-line">
                      {row.map((cell, c) => (
                        <td key={c} className={`px-3 py-2 ${c === 0 ? "font-medium" : ""}`}>
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {s.examples?.length > 0 && (
            <ul className="space-y-1.5">
              {s.examples.map((ex, j) => (
                <li key={j} className="rounded-lg bg-canvas px-3 py-2">
                  <span lang="de" className="font-medium">
                    {ex.de}
                  </span>
                  {(ex[locale] || ex.en) && <LocalizedText text={{ ...ex, de: undefined }} prefer={locale} className="block text-sm text-ink-muted" />}
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </article>
  );
}

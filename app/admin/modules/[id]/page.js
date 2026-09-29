import Link from "next/link";
import { requireAdminPage } from "@/lib/auth/dal";
import { getModuleReview } from "@/lib/services/contentService";
import { orNotFound } from "@/lib/pages";
import { COLLECTIONS } from "@/lib/db/collections";
import { pickText } from "@/lib/i18n/locales";
import { editHref, lessonPreviewHref, listHref, newHref } from "@/lib/content/adminSections";
import StatusBadge from "@/components/ui/StatusBadge";
import LifecycleControls from "@/components/admin/LifecycleControls";
import BulkReviewControls from "@/components/admin/BulkReviewControls";

export const metadata = { title: "Module review" };

const t = (text) => pickText(text, "de").text;
const en = (text) => pickText(text, "en").text;

function Row({ kind, item, title, links, children }) {
  return (
    <tr className="border-b border-line align-top last:border-0">
      <td className="px-4 py-3">
        <p className="font-medium" lang="de">
          <Link href={editHref(kind, item.id)} className="hover:underline">
            {title}
          </Link>
        </p>
        <p className="font-mono text-xs text-ink-muted">{item.slug}</p>
        {links}
        {children && (
          <details className="mt-2 text-sm">
            <summary className="cursor-pointer text-brand-700">Preview content</summary>
            <div className="mt-2 max-w-2xl space-y-2">{children}</div>
          </details>
        )}
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={item.reviewStatus} />
        {item.reviewStatus === "approved" && item.approvalBasis === "test_fixture" && (
          <p className="mt-1 max-w-[10rem] text-xs font-medium text-warning-700" data-testid="fixture-approval">
            Test-fixture approval – not a genuine review
          </p>
        )}
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={item.publishStatus} />
      </td>
      <td className="px-4 py-3 tabular-nums">v{item.version}</td>
      <td className="px-4 py-3">
        <LifecycleControls kind={kind} item={item} />
      </td>
    </tr>
  );
}

function Table({ id, title, count, children }) {
  return (
    <section aria-labelledby={id} className="mt-8">
      <h2 id={id} className="text-lg font-semibold">
        {title} <span className="font-normal text-ink-muted">({count})</span>
      </h2>
      <div className="mt-3 overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-line text-xs uppercase text-ink-muted">
            <tr>
              <th scope="col" className="px-4 py-3">Item</th>
              <th scope="col" className="px-4 py-3">Review</th>
              <th scope="col" className="px-4 py-3">Visibility</th>
              <th scope="col" className="px-4 py-3">Version</th>
              <th scope="col" className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </section>
  );
}

// Read-only preview of an item's German content, including the answer key, for reviewers.
function ExercisePreview({ ex }) {
  return (
    <>
      <p className="text-ink-muted">
        Skill: {ex.skill} · {ex.items.length} items · {ex.maxScore} points · pass at {Math.round(ex.passThreshold * 100)}%
        {ex.missingAudio > 0 && <strong className="ml-1 text-danger-700">· {ex.missingAudio} audio clip(s) not generated</strong>}
      </p>
      {ex.stimulus?.text && <p className="whitespace-pre-line rounded bg-canvas p-2" lang="de">{t(ex.stimulus.text)}</p>}
      {ex.stimulus?.audio && (
        <ul className="rounded bg-canvas p-2" lang="de">
          {ex.stimulus.audio.lines.map((l, i) => (
            <li key={i}>
              {l.speaker && <strong>{l.speaker}: </strong>}
              {l.text} <span className="text-xs text-ink-muted">({l.voice}, {l.rate})</span>
            </li>
          ))}
        </ul>
      )}
      <ol className="list-decimal space-y-1 pl-5">
        {ex.items.map((i) => (
          <li key={i.id}>
            <span className="text-xs text-ink-muted">[{i.type}] </span>
            {i.prompt && <span>{t(i.prompt)} </span>}
            {i.audio && <span lang="de">🔊 „{i.audio.text}“ </span>}
            {i.statement && <span lang="de">{t(i.statement)} </span>}
            {i.before && <span lang="de">{i.before} ___ {i.after}</span>}
            {i.label && <span lang="de">{i.label}: ___</span>}
            <span className="text-success-700">
              {" → "}
              {i.type === "mcq" && t(i.options.find((o) => o.id === i.answer)?.text)}
              {i.type === "true_false" && (i.answer ? "richtig" : "falsch")}
              {i.type === "text_input" && i.accepted.join(" / ")}
              {i.type === "order" && [i.tokens.join(" "), ...(i.alternatives ?? [])].join(" / ")}
              {i.type === "match" && i.pairs.map((p) => `${t(p.left)} = ${t(p.right)}`).join("; ")}
              {i.type === "speak_prompt" && t(i.modelAnswer)}
            </span>
          </li>
        ))}
      </ol>
    </>
  );
}

export default async function ModuleReviewPage({ params }) {
  const admin = await requireAdminPage();
  const { id } = await params;
  const data = await orNotFound(getModuleReview(admin, id));
  const { module: mod, level, lessons, exercises, vocabulary, grammarTopics } = data;

  return (
    <>
      <nav aria-label="Breadcrumb" className="text-sm text-ink-muted">
        <Link href="/admin" className="hover:underline">
          Content administration
        </Link>
        {" / "}
        <Link href={listHref(COLLECTIONS.modules)} className="hover:underline">
          Modules
        </Link>
      </nav>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">
        Review: {mod.levelCode} · <span lang="de">{t(mod.title)}</span>
      </h1>
      <p className="mt-1 max-w-3xl text-sm text-ink-muted">
        Source: {mod.sourceType}
        {mod.sourceReference ? ` – ${mod.sourceReference}` : ""}. Check the German, the answer keys and the audio before approving.
        Learners see the module only when the level ({level?.code}: {level?.publishStatus ?? "missing"}), the module, its lessons and all their content are published.
      </p>

      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        <Link href={editHref(COLLECTIONS.modules, mod.id)} className="inline-flex h-9 items-center rounded-lg border border-line bg-surface px-4 font-medium hover:bg-canvas">
          Edit module
        </Link>
        <Link href={newHref(COLLECTIONS.lessons, { moduleId: mod.id })} className="inline-flex h-9 items-center rounded-lg border border-line bg-surface px-4 font-medium hover:bg-canvas">
          Add lesson
        </Link>
        <Link href={listHref(COLLECTIONS.lessons, { moduleId: mod.id, publish: "any" })} className="inline-flex h-9 items-center rounded-lg border border-line bg-surface px-4 font-medium hover:bg-canvas">
          All lessons (incl. archived)
        </Link>
      </div>

      <div className="mt-6 rounded-xl border border-line bg-surface p-4">
        <h2 className="text-sm font-semibold">Bulk steps for this module</h2>
        <p className="mb-3 mt-1 text-xs text-ink-muted">Each step only moves items that are in the previous state. Publishing checks dependencies and audio.</p>
        <BulkReviewControls moduleId={mod.id} />
      </div>

      <Table id="module-heading" title="Module" count={1}>
        <Row kind={COLLECTIONS.modules} item={mod} title={t(mod.title)} />
      </Table>

      <Table id="lessons-heading" title="Lessons" count={lessons.length}>
        {lessons.map((l) => (
          <Row
            key={l.id}
            kind={COLLECTIONS.lessons}
            item={l}
            title={t(l.title)}
            links={
              <Link href={lessonPreviewHref(l.id)} className="text-sm text-brand-700 hover:underline">
                Preview as learner
              </Link>
            }
          >
            <ol className="list-decimal pl-5">
              {l.blocks.map((b) => (
                <li key={b.key}>
                  {b.type} <span className="font-mono text-xs text-ink-muted">({b.key})</span>
                  {b.body && <p className="whitespace-pre-line text-ink-muted">{en(b.body)}</p>}
                </li>
              ))}
            </ol>
          </Row>
        ))}
      </Table>

      <Table id="exercises-heading" title="Exercises" count={exercises.length}>
        {exercises.map((ex) => (
          <Row key={ex.id} kind={COLLECTIONS.exercises} item={ex} title={t(ex.title)}>
            <ExercisePreview ex={ex} />
          </Row>
        ))}
      </Table>

      <Table id="grammar-heading" title="Grammar topics" count={grammarTopics.length}>
        {grammarTopics.map((g) => (
          <Row key={g.id} kind={COLLECTIONS.grammarTopics} item={g} title={t(g.title)}>
            {g.sections.map((s, i) => (
              <div key={i}>
                {s.heading && <p className="font-medium">{en(s.heading)}</p>}
                {s.body && <p>{en(s.body)}</p>}
                {s.examples?.map((e, j) => (
                  <p key={j} lang="de" className="text-ink-muted">
                    {e.de}
                  </p>
                ))}
              </div>
            ))}
          </Row>
        ))}
      </Table>

      <Table id="vocabulary-heading" title="Vocabulary" count={vocabulary.length}>
        {vocabulary.map((v) => (
          <Row key={v.id} kind={COLLECTIONS.vocabulary} item={v} title={v.article ? `${v.article} ${v.lemma}` : v.lemma}>
            <p>
              {v.pos}
              {v.plural ? ` · ${v.plural}` : ""} · {en(v.meanings)}
              {!v.meanings.bn && <span className="ml-1 text-xs text-warning-700">(no Bangla yet)</span>}
            </p>
            {v.example && (
              <p lang="de" className="text-ink-muted">
                {v.example.de}
              </p>
            )}
          </Row>
        ))}
      </Table>
    </>
  );
}

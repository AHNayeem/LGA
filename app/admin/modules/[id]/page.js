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
import BulkActionBar, { SelectAllCheckbox } from "@/components/admin/BulkSelection";
import { ButtonLink, PageHeader, RowCheckbox, tableClasses as tc } from "@/components/admin/list";

export const metadata = { title: "Module review" };

const t = (text) => pickText(text, "de").text;
const en = (text) => pickText(text, "en").text;

const bulkId = (kind) => `bulk-module-${kind}`;

function Row({ kind, item, title, links, children, selectable = true }) {
  return (
    <tr className={`${tc.tr} has-[input[data-bulk-row]:checked]:bg-brand-50/70`}>
      <td className="w-9 py-2 pl-3 align-top">{selectable && <RowCheckbox formId={bulkId(kind)} id={item.id} label={`Select ${item.slug}`} />}</td>
      <td className={`${tc.td} align-top`}>
        <p className="font-medium" lang="de">
          <Link href={editHref(kind, item.id)} className="hover:text-brand-700 hover:underline">
            {title}
          </Link>
        </p>
        <p className="font-mono text-[11px] text-ink-muted">{item.slug}</p>
        {links}
        {children && (
          <details className="group mt-1 text-[13px]">
            <summary className="cursor-pointer select-none text-xs font-medium text-brand-700 hover:underline">Preview content</summary>
            <div className="mt-2 max-w-2xl space-y-2 rounded-md border border-line bg-canvas/50 p-3">{children}</div>
          </details>
        )}
      </td>
      <td className={`${tc.td} align-top`}>
        <StatusBadge status={item.reviewStatus} />
        {item.reviewStatus === "approved" && item.approvalBasis === "test_fixture" && (
          <p className="mt-1 max-w-[10rem] text-[11px] font-medium text-warning-700" data-testid="fixture-approval">
            Test-fixture approval – not a genuine review
          </p>
        )}
      </td>
      <td className={`${tc.td} align-top`}>
        <StatusBadge status={item.publishStatus} />
      </td>
      <td className={`${tc.td} align-top tabular-nums text-ink-muted`}>v{item.version}</td>
      <td className={`${tc.td} align-top`}>
        <LifecycleControls kind={kind} item={item} />
      </td>
    </tr>
  );
}

function Table({ id, title, count, kind, children }) {
  return (
    <section aria-labelledby={id} className="mt-8">
      <h2 id={id} className="text-[15px] font-semibold tracking-tight">
        {title} <span className="font-normal tabular-nums text-ink-muted">({count})</span>
      </h2>
      {kind && count > 0 && <BulkActionBar formId={bulkId(kind)} kind={kind} />}
      <div className={`mt-3 ${tc.wrap}`}>
        <table className={`${tc.table} min-w-190`}>
          <thead className={tc.thead}>
            <tr>
              <th scope="col" className="h-9 w-9 pl-3">{kind && count > 0 && <SelectAllCheckbox formId={bulkId(kind)} />}</th>
              <th scope="col" className={tc.th}>Item</th>
              <th scope="col" className={tc.th}>Review</th>
              <th scope="col" className={tc.th}>Visibility</th>
              <th scope="col" className={tc.th}>Version</th>
              <th scope="col" className={tc.th}>Actions</th>
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
      <PageHeader
        crumbs={[
          { href: "/admin", label: "Content administration" },
          { href: listHref(COLLECTIONS.modules), label: "Modules" },
        ]}
        title={
          <>
            Review: {mod.levelCode} · <span lang="de">{t(mod.title)}</span>
          </>
        }
        description={
          <>
            Source: {mod.sourceType}
            {mod.sourceReference ? ` – ${mod.sourceReference}` : ""}. Check the German, the answer keys and the audio before approving.
            Learners see the module only when the level ({level?.code}: {level?.publishStatus ?? "missing"}), the module, its lessons and all their content are published.
          </>
        }
        actions={
          <>
            <ButtonLink href={listHref(COLLECTIONS.lessons, { moduleId: mod.id, publish: "any" })} variant="ghost">
              All lessons (incl. archived)
            </ButtonLink>
            <ButtonLink href={newHref(COLLECTIONS.lessons, { moduleId: mod.id })} variant="secondary" icon="plus">
              Add lesson
            </ButtonLink>
            <ButtonLink href={editHref(COLLECTIONS.modules, mod.id)} variant="secondary">
              Edit module
            </ButtonLink>
          </>
        }
      />

      <div className="mt-5 rounded-lg border border-line bg-surface px-3 py-2.5 shadow-xs">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <h2 className="text-[13px] font-semibold">Bulk steps for this module</h2>
          <p className="text-xs text-ink-muted">Each step only moves items that are in the previous state. Publishing checks dependencies and audio.</p>
        </div>
        <div className="mt-2">
          <BulkReviewControls moduleId={mod.id} />
        </div>
      </div>

      <Table id="module-heading" title="Module" count={1}>
        <Row kind={COLLECTIONS.modules} item={mod} title={t(mod.title)} selectable={false} />
      </Table>

      <Table id="lessons-heading" title="Lessons" count={lessons.length} kind={COLLECTIONS.lessons}>
        {lessons.map((l) => (
          <Row
            key={l.id}
            kind={COLLECTIONS.lessons}
            item={l}
            title={t(l.title)}
            links={
              <Link href={lessonPreviewHref(l.id)} className="mt-0.5 inline-block text-xs font-medium text-brand-700 hover:underline">
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

      <Table id="exercises-heading" title="Exercises" count={exercises.length} kind={COLLECTIONS.exercises}>
        {exercises.map((ex) => (
          <Row key={ex.id} kind={COLLECTIONS.exercises} item={ex} title={t(ex.title)}>
            <ExercisePreview ex={ex} />
          </Row>
        ))}
      </Table>

      <Table id="grammar-heading" title="Grammar topics" count={grammarTopics.length} kind={COLLECTIONS.grammarTopics}>
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

      <Table id="vocabulary-heading" title="Vocabulary" count={vocabulary.length} kind={COLLECTIONS.vocabulary}>
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

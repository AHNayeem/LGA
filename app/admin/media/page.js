import Link from "next/link";
import { requireAdminPage } from "@/lib/auth/dal";
import { listCurriculumMedia } from "@/lib/services/mediaService";
import { ButtonLink, ContentTable, FilterBar, PageHeader, Pagination } from "@/components/admin/list";
import { AudioPreview, ImagePreview, MediaStatusBadge, mediaMeta, sourceLabel } from "@/components/admin/media/labels";
import Alert from "@/components/ui/Alert";

export const metadata = { title: "Media" };

const KIND_FILTER = [
  { value: "", label: "Audio and images" },
  { value: "audio", label: "Audio" },
  { value: "image", label: "Images" },
];
const SOURCE_FILTER = [
  { value: "", label: "Uploads (own + licensed)" },
  { value: "native", label: "Own (native recordings, own images)" },
  { value: "licensed", label: "Licensed" },
  { value: "tts", label: "Generated TTS" },
  { value: "all", label: "Everything" },
];
const STATUS_FILTER = [
  { value: "", label: "Active" },
  { value: "archived", label: "Archived" },
  { value: "any", label: "Any status" },
];
const USAGE_FILTER = [
  { value: "", label: "Used or unused" },
  { value: "used", label: "Attached to content" },
  { value: "unused", label: "Unused" },
];

export default async function MediaPage({ searchParams }) {
  const admin = await requireAdminPage();
  const sp = await searchParams;
  const list = await listCurriculumMedia(admin, sp);
  const filtered = Boolean(list.query.q || list.query.usage || list.query.status || list.query.source || list.query.kind);
  return (
    <>
      <PageHeader
        crumbs={[{ href: "/admin", label: "Admin" }]}
        title="Media"
        description="Curriculum audio and images: recordings and images uploaded here, and the generated TTS clips. Attach a recording to a listening exercise to replace its TTS; without one, the exercise plays generated TTS. Attach images to intro blocks, words and exercise stimuli in their editors. Learner recordings are never listed here."
        actions={<ButtonLink href="/admin/media/new">Upload media</ButtonLink>}
      />
      {sp?.deleted === "1" && (
        <div className="mt-4">
          <Alert tone="success">The file was deleted.</Alert>
        </div>
      )}
      <FilterBar
        action="/admin/media"
        values={list.query}
        fields={[
          { name: "q", label: "Search", type: "search", placeholder: "Title, file name, transcript, speaker, alt text" },
          { name: "kind", label: "Type", type: "select", options: KIND_FILTER },
          { name: "source", label: "Source", type: "select", options: SOURCE_FILTER },
          { name: "status", label: "Status", type: "select", options: STATUS_FILTER },
          { name: "usage", label: "Usage", type: "select", options: USAGE_FILTER },
        ]}
      />
      <ContentTable
        items={list.items}
        empty={filtered ? "No media match these filters." : "No uploads yet. Upload a recording or an image, then attach it to content."}
        columns={[
          {
            header: "Media",
            cell: (m) => (
              <>
                <Link href={`/admin/media/${m.id}`} className="font-medium text-brand-700 hover:underline" lang="de">
                  {m.title ?? m.transcript?.slice(0, 80) ?? m.id}
                </Link>
                <p className="text-xs text-ink-muted">
                  {m.kind} · {mediaMeta(m)}
                  {m.originalName ? ` · ${m.originalName}` : ""}
                </p>
              </>
            ),
          },
          { header: "Source", cell: (m) => <span className="text-xs">{sourceLabel(m)}</span> },
          {
            header: "Preview",
            cell: (m) => (m.kind === "image" ? <ImagePreview id={m.id} alt="" /> : <AudioPreview id={m.id} label={`Preview ${m.title ?? "audio"}`} />),
          },
          {
            header: "Used by",
            cell: (m) =>
              m.editable ? (
                <span className="text-xs tabular-nums">{m.usedBy ? `${m.usedBy} ${m.kind === "image" ? "item(s)" : "exercise(s)"}` : "unused"}</span>
              ) : (
                <span className="text-xs text-ink-muted">matched by cue text</span>
              ),
          },
          { header: "Status", cell: (m) => <MediaStatusBadge status={m.status} /> },
        ]}
      />
      <Pagination basePath="/admin/media" params={list.query} page={list.page} pageSize={list.pageSize} total={list.total} />
    </>
  );
}

import { requireAdminPage } from "@/lib/auth/dal";
import { getEnv } from "@/lib/config/env";
import { PageHeader } from "@/components/admin/list";
import MediaUploadForm from "@/components/admin/media/MediaUploadForm";

export const metadata = { title: "Upload media" };

export default async function NewMediaPage() {
  await requireAdminPage();
  return (
    <>
      <PageHeader
        crumbs={[
          { href: "/admin", label: "Admin" },
          { href: "/admin/media", label: "Media" },
        ]}
        title="Upload media"
        description="Upload a recording of German speech (a native speaker or licensed material) or an image (PNG, JPEG, WebP or GIF). Attach audio to a listening passage or question, and images to intro blocks, words or exercise stimuli. Learners get a file only once approved, published content uses it."
      />
      <section className="mt-6 max-w-2xl rounded-lg border border-line bg-surface p-4 shadow-xs">
        <MediaUploadForm limits={{ audio: getEnv().CURRICULUM_MEDIA_MAX_BYTES, image: getEnv().CURRICULUM_IMAGE_MAX_BYTES }} />
      </section>
    </>
  );
}

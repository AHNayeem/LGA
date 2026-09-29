import { requireAdminPage } from "@/lib/auth/dal";
import AdminNav from "@/components/admin/AdminNav";

export const metadata = { title: { default: "Admin", template: "%s · Admin · LGA" } };

// Page-level gate. Every admin action is authorised again in the service layer.
export default async function AdminLayout({ children }) {
  await requireAdminPage();
  return (
    <>
      <AdminNav />
      <div className="mx-auto w-full max-w-6xl px-4 py-8">{children}</div>
    </>
  );
}

import { requireAdminPage } from "@/lib/auth/dal";
import AdminShell from "@/components/admin/AdminShell";

export const metadata = { title: { default: "Admin", template: "%s · Admin · LGA" } };

// Page-level gate. Every admin action is authorised again in the service layer.
export default async function AdminLayout({ children }) {
  const admin = await requireAdminPage();
  return <AdminShell user={{ name: admin.name, email: admin.email }}>{children}</AdminShell>;
}

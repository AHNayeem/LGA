import { requireAdminPage } from "@/lib/auth/dal";

export const metadata = { title: { default: "Admin", template: "%s · Admin · LGA" } };

// Page-level gate. Every admin action is authorised again in the service layer.
export default async function AdminLayout({ children }) {
  await requireAdminPage();
  return <div className="mx-auto w-full max-w-6xl px-4 py-10">{children}</div>;
}

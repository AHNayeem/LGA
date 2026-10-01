"use client";

import { usePathname } from "next/navigation";

// The admin area has its own shell (sidebar + topbar), so learner chrome stays out of it.
export default function HideInAdmin({ children }) {
  const pathname = usePathname();
  return pathname.startsWith("/admin") ? null : children;
}

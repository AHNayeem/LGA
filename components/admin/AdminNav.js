"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_SECTIONS } from "@/lib/content/adminSections";

const LINKS = [
  { href: "/admin", label: "Dashboard", exact: true },
  ...ADMIN_SECTIONS.map((s) => ({ href: `/admin/${s.segment}`, label: s.label })),
  { href: "/admin/media", label: "Media" },
  { href: "/admin/review", label: "Review & publish" },
];

export default function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="border-b border-line bg-surface">
      <ul className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 text-sm">
        {LINKS.map((l) => {
          const active = l.exact ? pathname === l.href : pathname === l.href || pathname.startsWith(`${l.href}/`);
          return (
            <li key={l.href} className="shrink-0">
              <Link
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex h-11 items-center border-b-2 px-3 ${
                  active ? "border-brand-600 font-medium text-ink" : "border-transparent text-ink-muted hover:text-ink"
                }`}
              >
                {l.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

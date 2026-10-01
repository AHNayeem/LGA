"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { sectionForKind } from "@/lib/content/adminSections";
import Icon from "@/components/admin/icons";

const section = (kind, icon) => {
  const s = sectionForKind(kind);
  return { href: `/admin/${s.segment}`, label: s.label, icon };
};

// Grouped admin navigation. Every entry is an existing admin route.
export const ADMIN_NAV = [
  { items: [{ href: "/admin", label: "Overview", icon: "overview", exact: true }] },
  { label: "Curriculum", items: [section("levels", "levels"), section("modules", "modules"), section("lessons", "lessons")] },
  {
    label: "Library",
    items: [
      section("vocabulary", "vocabulary"),
      section("grammarTopics", "grammar"),
      section("exercises", "exercises"),
      section("exams", "exams"),
      { href: "/admin/media", label: "Media", icon: "media" },
    ],
  },
  { label: "Publishing", items: [{ href: "/admin/review", label: "Review & publish", icon: "review" }] },
];

const isActive = (pathname, item) => (item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`));

// The group and entry for the current URL (used by the topbar).
export function activeNav(pathname) {
  for (const group of ADMIN_NAV) {
    const item = group.items.find((i) => isActive(pathname, i));
    if (item) return { group, item };
  }
  return null;
}

export default function AdminNav({ onNavigate }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="flex flex-col gap-4 px-3 py-3">
      {ADMIN_NAV.map((group, gi) => (
        <div key={group.label ?? gi}>
          {group.label && (
            <p id={`admin-nav-${gi}`} className="mb-1 px-2 text-[11px] font-medium uppercase tracking-wider text-ink-muted">
              {group.label}
            </p>
          )}
          <ul className="flex flex-col gap-px" aria-labelledby={group.label ? `admin-nav-${gi}` : undefined}>
            {group.items.map((item) => {
              const active = isActive(pathname, item);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={`group flex h-8 items-center gap-2.5 rounded-md px-2 text-[13px] transition-colors ${
                      active ? "bg-brand-50 font-medium text-brand-700" : "text-ink-muted hover:bg-canvas hover:text-ink"
                    }`}
                  >
                    <Icon name={item.icon} className={`size-4 ${active ? "text-brand-600" : "text-ink-subtle group-hover:text-ink-muted"}`} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export const LEARNER_NAV = [
  // Practice is reached from the learner home, so it belongs to "Learn" until it earns a
  // tab of its own (adding { href: "/practice", label: "Practice", match: ["/practice"] }).
  { href: "/dashboard", label: "Learn", match: ["/dashboard", "/learn", "/start", "/practice"] },
  { href: "/review", label: "Review", match: ["/review"] },
  { href: "/goethe", label: "Goethe Prep", match: ["/goethe", "/exams"] },
  { href: "/account", label: "Account", match: ["/account"] },
];

const isActive = (pathname, item) => item.match.some((p) => pathname === p || pathname.startsWith(`${p}/`));

// Desktop and tablet: the links inside the header.
export function HeaderNavLinks() {
  const pathname = usePathname();
  return (
    <ul className="hidden items-center gap-1 text-sm md:flex">
      {LEARNER_NAV.filter((i) => i.href !== "/account").map((item) => {
        const active = isActive(pathname, item);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`rounded-md px-3 py-2 ${active ? "bg-brand-50 font-medium text-brand-700" : "hover:bg-canvas"}`}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

// Inside a lesson or a running exam the learner is focused on one task, and those pages
// have their own sticky action bar at the bottom: the tab bar stays out of the way.
function isFocusMode(pathname, search) {
  if (/^\/learn\/[^/]+\/[^/]+\/[^/]+/.test(pathname)) return true;
  if (pathname.startsWith("/exams/attempts/")) return true;
  return pathname.startsWith("/exams/") && search?.get("take") === "1";
}

// Phones: a bottom tab bar (thumb reach), hidden in focus mode and in the admin area.
export function BottomTabBar() {
  const pathname = usePathname();
  const search = useSearchParams();
  if (pathname.startsWith("/admin") || isFocusMode(pathname, search)) return null;
  return (
    <>
      {/* Keeps page content clear of the fixed bar. */}
      <div aria-hidden="true" className="h-16 md:hidden" />
      <nav aria-label="Learning" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden">
        <ul className="grid grid-cols-4">
          {LEARNER_NAV.map((item) => {
            const active = isActive(pathname, item);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex h-16 flex-col items-center justify-center gap-0.5 text-xs ${active ? "font-semibold text-brand-700" : "text-ink-muted"}`}
                >
                  <span aria-hidden="true" className={`h-1 w-8 rounded-full ${active ? "bg-brand-600" : "bg-transparent"}`} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import AdminNav, { activeNav } from "@/components/admin/AdminNav";
import Icon from "@/components/admin/icons";

// Admin application shell: a fixed 240px sidebar and a 56px sticky topbar. Below `lg` the
// sidebar becomes a modal drawer (Esc, backdrop click and navigation close it; focus is
// kept inside while it is open and returned to the menu button afterwards).

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

function initials(user) {
  const source = user.name?.trim() || user.email || "?";
  const parts = source.split(/[\s@.]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

// "Library / Vocabulary / New" for the topbar; pages keep their own breadcrumb links.
function pageContext(pathname) {
  const match = activeNav(pathname);
  if (!match) return ["Admin"];
  const trail = [match.group.label, match.item.label].filter(Boolean);
  const rest = pathname.slice(match.item.href.length);
  if (rest === "/new") trail.push("New");
  else if (rest === "/import") trail.push("Import");
  else if (rest.endsWith("/preview")) trail.push("Preview");
  else if (rest.endsWith("/edit")) trail.push("Edit");
  else if (rest.length > 1) trail.push(match.item.href === "/admin/modules" ? "Review" : "Edit");
  return trail;
}

function Sidebar({ user, open, onClose, onNavigate, drawerRef }) {
  return (
    <aside
      id="admin-sidebar"
      ref={drawerRef}
      role={open ? "dialog" : undefined}
      aria-modal={open ? "true" : undefined}
      aria-label={open ? "Admin menu" : undefined}
      className={`fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-line bg-surface transition-[transform,visibility] duration-200 ease-out lg:visible lg:translate-x-0 ${
        open ? "translate-x-0 shadow-xl lg:shadow-none" : "max-lg:invisible max-lg:-translate-x-full"
      }`}
    >
      <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-line px-4">
        <Link href="/admin" onClick={onNavigate} className="flex min-w-0 items-center gap-2.5">
          <span className="grid size-7 place-items-center rounded-md bg-brand-600 text-xs font-bold text-white" aria-hidden="true">
            L
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block text-sm font-semibold tracking-tight" lang="de">
              LGA
            </span>
            <span className="block truncate text-[11px] text-ink-muted">Learning platform</span>
          </span>
        </Link>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close admin menu"
          className="grid size-8 place-items-center rounded-md text-ink-muted hover:bg-canvas hover:text-ink lg:hidden"
        >
          <Icon name="close" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <AdminNav onNavigate={onNavigate} />
      </div>

      <div className="shrink-0 border-t border-line p-3">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="mb-2 flex h-8 items-center gap-2.5 rounded-md px-2 text-[13px] text-ink-muted hover:bg-canvas hover:text-ink"
        >
          <Icon name="external" className="size-4 text-ink-subtle" />
          View learner site
        </Link>
        <div className="flex items-center gap-2.5 rounded-md px-2 py-1">
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-canvas text-[11px] font-semibold text-ink-muted ring-1 ring-line" aria-hidden="true">
            {initials(user)}
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-[13px] font-medium">{user.name || user.email}</p>
            <p className="truncate text-[11px] text-ink-muted">Administrator</p>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              aria-label="Sign out"
              title="Sign out"
              className="grid size-7 place-items-center rounded-md text-ink-muted hover:bg-canvas hover:text-ink"
            >
              <Icon name="logout" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}

function Topbar({ open, onOpen, menuButtonRef }) {
  const pathname = usePathname();
  const trail = pageContext(pathname);
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-line bg-surface/90 px-4 backdrop-blur supports-[backdrop-filter]:bg-surface/75 sm:px-6 lg:px-8">
      <button
        ref={menuButtonRef}
        type="button"
        onClick={onOpen}
        aria-label="Open admin menu"
        aria-expanded={open}
        aria-controls="admin-sidebar"
        className="-ml-1.5 grid size-8 place-items-center rounded-md text-ink-muted hover:bg-canvas hover:text-ink lg:hidden"
      >
        <Icon name="menu" />
      </button>
      <p className="flex min-w-0 items-center gap-1.5 text-[13px]">
        {trail.map((part, i) => (
          <span key={`${part}-${i}`} className="flex min-w-0 items-center gap-1.5">
            {i > 0 && (
              <span className="text-line-strong max-sm:hidden" aria-hidden="true">
                /
              </span>
            )}
            <span className={`truncate ${i === trail.length - 1 ? "font-medium text-ink" : "text-ink-muted max-sm:hidden"}`}>{part}</span>
          </span>
        ))}
      </p>
    </header>
  );
}

export default function AdminShell({ user, children }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);
  const drawerRef = useRef(null);
  const menuButtonRef = useRef(null);
  // Dismissing (Esc, backdrop, close button) returns focus to the menu button; navigating does not.
  const restoreFocus = useRef(true);
  const close = (restore) => {
    restoreFocus.current = restore;
    setOpen(false);
  };

  // Any navigation closes the drawer.
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const drawer = drawerRef.current;
    const menuButton = menuButtonRef.current;
    drawer?.querySelector(FOCUSABLE)?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        restoreFocus.current = true;
        setOpen(false);
        return;
      }
      if (e.key !== "Tab" || !drawer) return;
      const nodes = [...drawer.querySelectorAll(FOCUSABLE)];
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    // Growing past the drawer breakpoint turns the drawer back into the fixed sidebar.
    const desktop = window.matchMedia("(min-width: 64rem)");
    const onResize = () => {
      if (!desktop.matches) return;
      restoreFocus.current = false;
      setOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    desktop.addEventListener("change", onResize);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      desktop.removeEventListener("change", onResize);
      document.body.style.overflow = previousOverflow;
      if (restoreFocus.current) menuButton?.focus();
    };
  }, [open]);

  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-canvas">
      <Sidebar user={user} open={open} onClose={() => close(true)} onNavigate={() => close(false)} drawerRef={drawerRef} />
      {open && <div className="fixed inset-0 z-40 bg-ink/30 lg:hidden" aria-hidden="true" onClick={() => close(true)} />}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-60">
        <Topbar
          open={open}
          onOpen={() => {
            restoreFocus.current = true;
            setOpen(true);
          }}
          menuButtonRef={menuButtonRef}
        />
        <div className="mx-auto w-full max-w-7xl flex-1 px-4 pb-10 pt-6 sm:px-6 lg:px-8">{children}</div>
      </div>
    </div>
  );
}

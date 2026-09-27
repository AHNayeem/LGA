import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/dal";
import { isAdmin } from "@/lib/auth/roles";
import { logoutAction } from "@/app/actions/auth";

export default async function SiteHeader() {
  let user = null;
  try {
    user = await getCurrentUser();
  } catch {
    // DB unavailable: render the public header rather than failing every page.
  }

  return (
    <header className="border-b border-line bg-surface">
      <nav aria-label="Main" className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href={user ? "/dashboard" : "/"} className="text-lg font-semibold tracking-tight">
          <span lang="de">LGA</span> <span className="font-normal text-ink-muted">Deutsch</span>
        </Link>
        <ul className="flex items-center gap-1 text-sm sm:gap-2">
          {user ? (
            <>
              <li>
                <Link href="/dashboard" className="rounded-md px-3 py-2 hover:bg-canvas">
                  Dashboard
                </Link>
              </li>
              {isAdmin(user) && (
                <li>
                  <Link href="/admin" className="rounded-md px-3 py-2 hover:bg-canvas">
                    Admin
                  </Link>
                </li>
              )}
              <li>
                <form action={logoutAction}>
                  <button type="submit" className="rounded-md px-3 py-2 text-ink-muted hover:bg-canvas hover:text-ink">
                    Sign out
                  </button>
                </form>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link href="/login" className="rounded-md px-3 py-2 hover:bg-canvas">
                  Sign in
                </Link>
              </li>
              <li>
                <Link href="/register" className="rounded-md bg-brand-600 px-3 py-2 font-medium text-white hover:bg-brand-700">
                  Create account
                </Link>
              </li>
            </>
          )}
        </ul>
      </nav>
    </header>
  );
}

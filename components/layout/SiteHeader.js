import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/dal";
import { isAdmin } from "@/lib/auth/roles";
import { logoutAction } from "@/app/actions/auth";
import { HeaderNavLinks } from "@/components/layout/LearnerNav";

// Learning is open to guests, so the learner navigation (Learn, Review, Goethe Prep) is
// the same for everyone; the account area on the right differs. On phones the learner
// navigation is the bottom tab bar (LearnerNav.BottomTabBar, in the root layout).
export default async function SiteHeader() {
  let user = null;
  try {
    user = await getCurrentUser();
  } catch {
    // DB unavailable: render the public header rather than failing every page.
  }

  return (
    <header className="border-b border-line bg-surface">
      <nav aria-label="Main" className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-4">
        <div className="flex items-center gap-4">
          <Link href={user ? "/dashboard" : "/"} className="shrink-0 text-lg font-semibold tracking-tight">
            <span lang="de">LGA</span> <span className="hidden font-normal text-ink-muted sm:inline">Deutsch</span>
          </Link>
          <HeaderNavLinks />
        </div>
        <ul className="flex items-center gap-1 text-sm">
          {user ? (
            <>
              {isAdmin(user) && (
                <li>
                  <Link href="/admin" className="rounded-md px-2 py-2 hover:bg-canvas sm:px-3">
                    Admin
                  </Link>
                </li>
              )}
              <li className="hidden md:block">
                <Link href="/account" className="rounded-md px-3 py-2 hover:bg-canvas">
                  Account
                </Link>
              </li>
              <li>
                <form action={logoutAction}>
                  <button type="submit" className="rounded-md px-2 py-2 text-ink-muted hover:bg-canvas hover:text-ink sm:px-3">
                    Sign out
                  </button>
                </form>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link href="/login" className="rounded-md px-2 py-2 hover:bg-canvas sm:px-3">
                  Sign in
                </Link>
              </li>
              <li>
                <Link href="/register" className="whitespace-nowrap rounded-md bg-brand-600 px-2.5 py-2 font-medium text-white hover:bg-brand-700 sm:px-3">
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

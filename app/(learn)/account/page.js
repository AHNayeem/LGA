import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/dal";
import { logoutAction } from "@/app/actions/auth";
import { GOAL_OPTIONS } from "@/lib/learning/profile";
import GuestAccount from "@/components/journey/GuestAccount";

export const metadata = { title: "Account" };

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">Account</h1>
        <div className="mt-6">
          <GuestAccount />
        </div>
      </div>
    );
  }
  const goal = GOAL_OPTIONS.find((g) => g.value === user.learningProfile?.goal);
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Account</h1>
      <section className="mt-6 rounded-xl border border-line bg-surface p-5 text-sm">
        <p className="font-medium">{user.name}</p>
        <p className="text-ink-muted">{user.email}</p>
        <p className="mt-3">Your progress is saved to this account and available on every device you sign in on.</p>
      </section>
      <section className="mt-4 rounded-xl border border-line bg-surface p-5 text-sm">
        <h2 className="font-semibold">Your learning goal</h2>
        <p className="mt-1">
          {goal ? goal.label : "Not set yet"}
          {user.learningProfile?.startModule && <span className="text-ink-muted"> · started from a chosen module</span>}
        </p>
        <Link href="/start" className="mt-2 inline-block font-medium text-brand-700 underline">
          {goal ? "Change goal or starting point" : "Set your goal"}
        </Link>
      </section>
      <form action={logoutAction} className="mt-6">
        <button type="submit" className="inline-flex h-11 items-center rounded-lg border border-line bg-surface px-4 font-medium hover:bg-canvas">
          Sign out
        </button>
      </form>
    </div>
  );
}

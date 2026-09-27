import Link from "next/link";
import AuthCard from "@/components/auth/AuthCard";
import LoginForm from "@/components/auth/LoginForm";
import { safeRedirectPath } from "@/lib/actions/result";
import { redirectIfSignedIn } from "@/lib/auth/guest";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }) {
  const { next } = await searchParams;
  await redirectIfSignedIn(safeRedirectPath(next));
  return (
    <AuthCard
      title="Willkommen zurück"
      subtitle="Sign in to continue learning."
      footer={
        <>
          New here?{" "}
          <Link href="/register" className="font-medium text-brand-700 underline-offset-2 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <LoginForm next={safeRedirectPath(next)} />
    </AuthCard>
  );
}

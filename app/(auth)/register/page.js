import Link from "next/link";
import AuthCard from "@/components/auth/AuthCard";
import RegisterForm from "@/components/auth/RegisterForm";
import { redirectIfSignedIn } from "@/lib/auth/guest";
import { safeRedirectPath } from "@/lib/actions/result";

export const metadata = { title: "Create account" };

export default async function RegisterPage({ searchParams }) {
  const { next } = await searchParams;
  await redirectIfSignedIn(safeRedirectPath(next));
  return (
    <AuthCard
      title="Konto erstellen"
      subtitle="Free. Your lessons, results and words are saved and follow you to any device."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-brand-700 underline-offset-2 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <RegisterForm next={safeRedirectPath(next)} />
    </AuthCard>
  );
}

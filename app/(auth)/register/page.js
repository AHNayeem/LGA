import Link from "next/link";
import AuthCard from "@/components/auth/AuthCard";
import RegisterForm from "@/components/auth/RegisterForm";
import { redirectIfSignedIn } from "@/lib/auth/guest";

export const metadata = { title: "Create account" };

export default async function RegisterPage() {
  await redirectIfSignedIn();
  return (
    <AuthCard
      title="Konto erstellen"
      subtitle="Create your free account to start with A1."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-brand-700 underline-offset-2 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthCard>
  );
}

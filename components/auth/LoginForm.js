"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/actions/auth";
import FormField from "@/components/ui/FormField";
import SubmitButton from "@/components/ui/SubmitButton";
import Alert from "@/components/ui/Alert";

export default function LoginForm({ next }) {
  const [state, formAction] = useActionState(loginAction, null);
  const errors = state?.fieldErrors ?? {};

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {state && !state.ok && <Alert tone="error">{state.message}</Alert>}
      <input type="hidden" name="next" value={next ?? ""} />
      <FormField
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
        defaultValue={state?.values?.email ?? ""}
        errors={errors.email}
      />
      <FormField
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        errors={errors.password}
      />
      <SubmitButton pendingLabel="Signing in…">Sign in</SubmitButton>
    </form>
  );
}

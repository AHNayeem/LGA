"use client";

import { useActionState } from "react";
import { registerAction } from "@/app/actions/auth";
import FormField from "@/components/ui/FormField";
import SubmitButton from "@/components/ui/SubmitButton";
import Alert from "@/components/ui/Alert";
import { EXPLANATION_LOCALES, LOCALE_LABELS } from "@/lib/i18n/locales";

export default function RegisterForm() {
  const [state, formAction] = useActionState(registerAction, null);
  const errors = state?.fieldErrors ?? {};

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {state && !state.ok && <Alert tone="error">{state.message}</Alert>}
      <FormField
        label="Name"
        name="name"
        autoComplete="name"
        required
        maxLength={80}
        defaultValue={state?.values?.name ?? ""}
        errors={errors.name}
      />
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
        autoComplete="new-password"
        required
        minLength={10}
        hint="At least 10 characters."
        errors={errors.password}
      />
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">Explanation language</legend>
        <div className="flex gap-4">
          {EXPLANATION_LOCALES.map((code, i) => (
            <label key={code} className="flex items-center gap-2 text-sm">
              <input type="radio" name="uiLanguage" value={code} defaultChecked={i === 0} className="h-4 w-4" />
              <span lang={code}>{LOCALE_LABELS[code]}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <SubmitButton pendingLabel="Creating account…">Create account</SubmitButton>
    </form>
  );
}

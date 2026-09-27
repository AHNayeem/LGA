"use server";

import { redirect } from "next/navigation";
import * as authService from "@/lib/services/authService";
import { setSessionCookie, readSessionToken, clearSessionCookie } from "@/lib/auth/session";
import { getRequestContext } from "@/lib/security/request";
import { runAction, formToObject, safeRedirectPath } from "@/lib/actions/result";

export async function registerAction(_prev, formData) {
  const input = formToObject(formData, ["name", "email", "password", "uiLanguage"]);
  const result = await runAction("register", async () => {
    const { token, expiresAt } = await authService.register(input, await getRequestContext());
    await setSessionCookie(token, expiresAt);
  });
  if (!result.ok) return { ...result, values: { name: input.name, email: input.email } };
  redirect("/dashboard");
}

export async function loginAction(_prev, formData) {
  const input = formToObject(formData, ["email", "password"]);
  const next = safeRedirectPath(formData.get("next"));
  const result = await runAction("login", async () => {
    const { token, expiresAt } = await authService.login(input, await getRequestContext());
    await setSessionCookie(token, expiresAt);
  });
  if (!result.ok) return { ...result, values: { email: input.email } };
  redirect(next);
}

export async function logoutAction() {
  const token = await readSessionToken();
  await runAction("logout", () => authService.logout(token));
  await clearSessionCookie();
  redirect("/");
}

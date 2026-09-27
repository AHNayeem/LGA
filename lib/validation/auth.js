import { z } from "zod";
import { email, text } from "@/lib/validation/common";
import { EXPLANATION_LOCALES } from "@/lib/i18n/locales";

// bcrypt only uses the first 72 bytes; cap length in bytes, not characters.
const password = z
  .string()
  .min(10, "Use at least 10 characters")
  .refine((v) => new TextEncoder().encode(v).length <= 72, "Password is too long");

export const registerSchema = z.object({
  name: text(80).pipe(z.string().min(1, "Enter your name")),
  email,
  password,
  uiLanguage: z.enum(EXPLANATION_LOCALES).default("en"),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password").max(200),
});

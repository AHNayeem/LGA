import { z } from "zod";
import { ObjectId } from "mongodb";
import { EXPLANATION_LOCALES, LEARNING_LANGUAGE } from "@/lib/i18n/locales";
import { ValidationError } from "@/lib/errors";
import { LEVEL_CODES } from "@/lib/content/constants";

export { LEVEL_CODES };

export const objectIdString = z
  .string()
  .trim()
  .refine((v) => ObjectId.isValid(v) && String(new ObjectId(v)) === v.toLowerCase(), "Invalid id");

export const slug = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens");

export const levelCode = z.enum(LEVEL_CODES);

const LOCALE_KEYS = [LEARNING_LANGUAGE, ...EXPLANATION_LOCALES];

// Unicode-safe text: NFC-normalised so "ü" typed as u + combining diaeresis equals "ü".
export const text = (max = 2000) =>
  z
    .string()
    .transform((v) => v.normalize("NFC").trim())
    .pipe(z.string().max(max));

// { de?, en?, bn? } – at least one entry. `require` lists locales that must be present.
export function localizedText({ max = 2000, require = [] } = {}) {
  const shape = Object.fromEntries(LOCALE_KEYS.map((k) => [k, text(max).optional()]));
  return z
    .object(shape)
    .strict()
    .superRefine((val, ctx) => {
      const present = Object.entries(val).filter(([, v]) => v);
      if (present.length === 0) ctx.addIssue({ code: "custom", message: "At least one language is required" });
      for (const loc of require) {
        if (!val[loc]) ctx.addIssue({ code: "custom", path: [loc], message: `${loc} is required` });
      }
    });
}

export const email = z
  .string()
  .trim()
  .toLowerCase()
  .max(254)
  .email("Enter a valid email address");

// Parses input with a Zod schema and throws a ValidationError with field messages.
export function parseOrThrow(schema, input, message = "Please check the highlighted fields.") {
  const result = schema.safeParse(input);
  if (result.success) return result.data;
  const fieldErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join(".") || "_form";
    (fieldErrors[key] ??= []).push(issue.message);
  }
  throw new ValidationError(message, fieldErrors);
}

export function toObjectId(id) {
  if (id instanceof ObjectId) return id;
  if (typeof id !== "string" || !ObjectId.isValid(id)) return null;
  return new ObjectId(id);
}

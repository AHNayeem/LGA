// German is the learning language. Explanations/UI support are keyed by locale code so
// new locales only need to be added here, not in any schema.
export const LEARNING_LANGUAGE = "de";
export const EXPLANATION_LOCALES = Object.freeze(["en", "bn"]);
export const DEFAULT_LOCALE = "en";

export const LOCALE_LABELS = Object.freeze({
  de: "Deutsch",
  en: "English",
  bn: "বাংলা",
});

export function isSupportedLocale(code) {
  return EXPLANATION_LOCALES.includes(code);
}

// Picks the best available translation: requested locale → default → any.
export function localize(text, locale = DEFAULT_LOCALE) {
  if (text == null) return "";
  if (typeof text === "string") return text;
  return text[locale] ?? text[DEFAULT_LOCALE] ?? Object.values(text).find(Boolean) ?? "";
}

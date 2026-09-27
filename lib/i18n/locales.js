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

// Like localize(), but also reports which language was picked so the UI can set `lang`.
// `preferred` is usually "de" for German learning content and the learner's locale for
// explanations.
export function pickText(text, preferred = DEFAULT_LOCALE) {
  if (text == null) return { text: "", lang: null };
  if (typeof text === "string") return { text, lang: null };
  for (const lang of [preferred, DEFAULT_LOCALE, LEARNING_LANGUAGE]) {
    if (text[lang]) return { text: text[lang], lang };
  }
  const entry = Object.entries(text).find(([, v]) => v);
  return entry ? { text: entry[1], lang: entry[0] } : { text: "", lang: null };
}

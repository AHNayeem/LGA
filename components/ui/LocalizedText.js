import { pickText } from "@/lib/i18n/locales";

// Renders a { de, en, bn } value and tags it with the language actually shown, so screen
// readers pronounce German as German and hyphenation works.
export default function LocalizedText({ text, prefer = "en", as: Tag = "span", className, ...props }) {
  const picked = pickText(text, prefer);
  if (!picked.text) return null;
  return (
    <Tag lang={picked.lang ?? undefined} className={className} {...props}>
      {picked.text}
    </Tag>
  );
}

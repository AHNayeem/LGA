import { goetheHref } from "@/lib/learning/journey";
import { GOETHE_PART_TITLES } from "@/lib/learning/goethe";
import { grammarTopicHref, practiceHref } from "@/lib/learning/topics";

// ?from=… on a lesson step: where the learner came from, so the step offers the way back
// (above the step and after an exercise's result). Only these forms are accepted; anything
// else is ignored and changes nothing else on the page.
//   goethe-<part>    Goethe Prep, one of the four exam parts
//   practice         the Practice overview
//   grammar-<slug>   a grammar topic page in Practice
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function returnLinkFor(from, level) {
  if (typeof from !== "string" || typeof level !== "string") return null;
  if (from.startsWith("goethe-")) {
    const key = from.slice(7);
    return Object.hasOwn(GOETHE_PART_TITLES, key) ? { href: goetheHref(level, key), label: `Back to ${GOETHE_PART_TITLES[key]} practice` } : null;
  }
  if (from === "practice") return { href: practiceHref(level), label: "Back to Practice" };
  if (from.startsWith("grammar-")) {
    const slug = from.slice(8);
    return SLUG.test(slug) && slug.length <= 80 ? { href: grammarTopicHref(level, slug), label: "Back to grammar practice" } : null;
  }
  return null;
}

"use client";

import { useState } from "react";
import { pickText } from "@/lib/i18n/locales";
import LocalizedText from "@/components/ui/LocalizedText";

// A curriculum image in the learner lesson UI (and the CMS draft preview, which renders
// the same components). `image` comes from imageService.createImageResolver:
//   { src: "/api/media/:id", width, height, alt: {de,en,bn}, caption? } or null
//
// A plain <img>: the file is served by the authorised media route (session cookie,
// access re-checked on every load), which the next/image optimiser can't fetch. The
// intrinsic width/height keep the aspect ratio before the file arrives, so nothing jumps.
// Images are optional: a missing one renders nothing, and one that fails to load removes
// itself instead of showing a broken icon; the step around it keeps working.
//
//   locale     the learner's locale for the alt text and caption
//   className  sizing of the figure (defaults to full width, capped height)
export default function ContentImage({ image, locale = "en", className = "", imgClassName = "max-h-80" }) {
  const [failed, setFailed] = useState(false);
  if (!image?.src || failed) return null;
  const alt = pickText(image.alt, locale);
  return (
    <figure className={`space-y-1.5 ${className}`} data-testid="content-image">
      {/* eslint-disable-next-line @next/next/no-img-element -- authorised /api/media route; see above */}
      <img
        src={image.src}
        alt={alt.text}
        lang={alt.lang ?? undefined}
        width={image.width ?? undefined}
        height={image.height ?? undefined}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        className={`mx-auto h-auto w-auto max-w-full rounded-lg border border-line bg-canvas object-contain ${imgClassName}`}
      />
      {image.caption && <LocalizedText as="figcaption" text={image.caption} prefer={locale} className="block text-center text-sm text-ink-muted" />}
    </figure>
  );
}

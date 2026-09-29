// Learner disclosure for content with sourceType "ai_generated". The wording must stay
// accurate: this content has NOT been reviewed by a native speaker, and publishing it
// (even after an in-app approval) must not be presented as professional verification.
export default function AiContentNotice({ className = "" }) {
  return (
    <p className={`rounded-lg border border-line bg-canvas px-3 py-2 text-xs text-ink-muted ${className}`} data-testid="ai-content-notice">
      <span className="font-medium text-ink">AI-assisted content, not yet reviewed by a native speaker.</span> It may contain mistakes.
    </p>
  );
}

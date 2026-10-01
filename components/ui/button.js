// One button scale for links and buttons. Admin screens use sm (28px) and md (32px);
// lg (44px) is the touch-friendly size of the learner app.
const BASE =
  "inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50";

const SIZES = {
  sm: "h-7 px-2.5 text-xs",
  md: "h-8 px-3 text-[13px]",
  lg: "h-11 rounded-lg px-4 text-base",
};

const VARIANTS = {
  primary: "bg-brand-600 text-white shadow-xs hover:bg-brand-700",
  secondary: "border border-line bg-surface text-ink shadow-xs hover:border-line-strong hover:bg-canvas",
  ghost: "text-ink-muted hover:bg-canvas hover:text-ink",
  danger: "border border-line bg-surface text-danger-700 shadow-xs hover:border-danger-700/30 hover:bg-danger-50",
};

export function buttonClass({ variant = "secondary", size = "md", className = "" } = {}) {
  return `${BASE} ${SIZES[size]} ${VARIANTS[variant]} ${className}`;
}

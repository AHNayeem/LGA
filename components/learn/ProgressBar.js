export default function ProgressBar({ value, label, tone = "brand", className = "" }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const fill = tone === "success" ? "bg-success-700" : "bg-brand-600";
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      className={`h-2 w-full overflow-hidden rounded-full bg-line ${className}`}
    >
      <div className={`h-full rounded-full ${fill} transition-[width]`} style={{ width: `${pct}%` }} />
    </div>
  );
}

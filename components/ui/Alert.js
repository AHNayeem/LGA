const TONES = {
  error: "border-danger-700/20 bg-danger-50 text-danger-700",
  success: "border-success-700/20 bg-success-50 text-success-700",
  warning: "border-warning-700/20 bg-warning-50 text-warning-700",
  info: "border-brand-600/20 bg-brand-50 text-brand-700",
};

export default function Alert({ tone = "info", children, id }) {
  return (
    <div id={id} role={tone === "error" ? "alert" : "status"} className={`rounded-lg border px-4 py-3 text-sm ${TONES[tone]}`}>
      {children}
    </div>
  );
}

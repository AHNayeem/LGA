import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-sm font-medium text-ink-muted">404</p>
      <h1 className="mt-2 text-2xl font-semibold" lang="de">
        Seite nicht gefunden
      </h1>
      <p className="mt-2 text-ink-muted">This page doesn&apos;t exist.</p>
      <Link href="/" className="mt-6 font-medium text-brand-700 underline-offset-2 hover:underline">
        Go to the start page
      </Link>
    </div>
  );
}

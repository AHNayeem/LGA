import "server-only";
import { notFound } from "next/navigation";
import { NotFoundError } from "@/lib/errors";

// Page helper: service NotFoundErrors become Next's 404 page; everything else propagates
// to the error boundary.
export async function orNotFound(promise) {
  try {
    return await promise;
  } catch (err) {
    if (err instanceof NotFoundError) notFound();
    throw err;
  }
}

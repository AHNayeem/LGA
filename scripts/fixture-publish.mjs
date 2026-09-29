// Usage (development/test databases ONLY):
//   ADMIN_EMAIL=… bun run content:fixture-publish -- --module a1/hallo --confirm-test-fixture
//
// Moves a module (and its level) through review → approve → publish with
// approvalBasis "test_fixture", so Module 1 can be validated end to end on a dev/Atlas
// test database before a human reviewer has checked it.
//
// This is NOT a content review. Every approval it makes is labelled "test_fixture"
// (shown in /admin and by content:check), provenance stays "ai_generated", and learners
// still see "AI-assisted content, not yet reviewed by a native speaker". Refuses to run
// against a database whose name does not mark it as dev/test, or with NODE_ENV=production.
import { closeClient } from "@/lib/db/client";
import { getEnv } from "@/lib/config/env";
import { assertNonProductionDatabase } from "@/lib/config/databaseGuard";
import { isAdmin } from "@/lib/auth/roles";
import { APPROVAL_BASIS, PUBLISH_STATUS, REVIEW_STATUS } from "@/lib/content/lifecycle";
import { findUserByEmailWithHash } from "@/lib/repositories/userRepository";
import { levelRepository, moduleRepository } from "@/lib/repositories/contentRepository";
import { bulkModuleTransition, setPublishStatus, transitionReview } from "@/lib/services/contentService";
import { checkModuleReadiness } from "@/lib/services/publishCheckService";

const args = process.argv.slice(2);
const option = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};
const FIXTURE = { approvalBasis: APPROVAL_BASIS.testFixture };

try {
  if (!args.includes("--confirm-test-fixture")) {
    throw new Error("Pass --confirm-test-fixture to confirm that this is a test-fixture approval, not a content review.");
  }
  const dbName = getEnv().MONGODB_DB;
  assertNonProductionDatabase(dbName, "make test-fixture approvals");
  const email = process.env.ADMIN_EMAIL;
  const adminDoc = email ? await findUserByEmailWithHash(email.toLowerCase()) : null;
  if (!adminDoc || !isAdmin(adminDoc)) throw new Error("Set ADMIN_EMAIL to an existing admin (bun run create-admin).");
  const admin = { id: String(adminDoc._id), role: adminDoc.role };

  const [levelCode, slug] = option("module", "a1/hallo").split("/");
  const code = levelCode.toUpperCase();
  const mod = await moduleRepository.findOne({ levelCode: code, slug });
  if (!mod) throw new Error(`Module ${code}/${slug} not found. Run \`bun run seed\` first.`);

  // Required audio must exist before anything is approved.
  const before = await checkModuleReadiness(admin, String(mod._id));
  const audioErrors = before.errors.filter((e) => e.includes("audio"));
  if (audioErrors.length) throw new Error(`Required audio is missing:\n  ${audioErrors.join("\n  ")}`);

  console.log(`Database ${dbName}: TEST-FIXTURE approval of ${code}/${slug} (not a content review).`);
  for (const step of ["review", "approve", "publish"]) {
    const r = await bulkModuleTransition(admin, String(mod._id), step, FIXTURE);
    console.log(`  ${step}: ${r.changed} changed${r.failed.length ? `, ${r.failed.length} failed` : ""}`);
    if (r.failed.length) throw new Error(`${step} failed: ${JSON.stringify(r.failed, null, 2)}`);
  }

  const level = await levelRepository.findOne({ code });
  const id = String(level._id);
  if (level.reviewStatus === REVIEW_STATUS.draft) await transitionReview(admin, "levels", { id, to: REVIEW_STATUS.reviewed });
  if ((await levelRepository.findById(id)).reviewStatus === REVIEW_STATUS.reviewed) {
    await transitionReview(admin, "levels", { id, to: REVIEW_STATUS.approved }, FIXTURE);
  }
  if ((await levelRepository.findById(id)).publishStatus !== PUBLISH_STATUS.published) {
    await setPublishStatus(admin, "levels", { id, to: PUBLISH_STATUS.published });
  }

  const after = await checkModuleReadiness(admin, String(mod._id), { expectedSourceType: "ai_generated" });
  for (const w of after.warnings) console.log(`WARN  ${w}`);
  for (const e of after.errors) console.log(`ERROR ${e}`);
  if (!after.ok) process.exitCode = 1;
  else console.log(`Published ${after.items} items for validation. Approvals: ${JSON.stringify(after.approvals)}.`);
} catch (err) {
  console.error("content:fixture-publish failed:", err.message);
  process.exitCode = 1;
} finally {
  await closeClient();
}

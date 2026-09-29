// Usage: bun run content:check [-- --module a1/hallo] [--source-type ai_generated]
//
// Read-only pre-publish report for a curriculum module against the configured database:
// required audio, lifecycle consistency, unpublished dependencies, provenance, approval
// basis (human review vs. test fixture) and unreviewed Bangla. Exits 1 on errors.
import { closeClient } from "@/lib/db/client";
import { getEnv } from "@/lib/config/env";
import { ROLES } from "@/lib/auth/roles";
import { moduleRepository } from "@/lib/repositories/contentRepository";
import { checkModuleReadiness } from "@/lib/services/publishCheckService";

const args = process.argv.slice(2);
const option = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};
const [levelCode, slug] = option("module", "a1/hallo").split("/");
const expectedSourceType = option("source-type", "ai_generated");

// Read-only system actor: the report needs draft access but writes nothing.
const SYSTEM = { id: "000000000000000000000000", role: ROLES.ADMIN };

try {
  console.log(`Database: ${getEnv().MONGODB_DB}`);
  const mod = await moduleRepository.findOne({ levelCode: levelCode.toUpperCase(), slug });
  if (!mod) throw new Error(`Module ${levelCode}/${slug} not found. Run \`bun run seed\` first.`);
  const report = await checkModuleReadiness(SYSTEM, String(mod._id), { expectedSourceType });
  const { errors, warnings, ...summary } = report;
  console.log(JSON.stringify(summary, null, 2));
  for (const w of warnings) console.log(`WARN  ${w}`);
  for (const e of errors) console.log(`ERROR ${e}`);
  console.log(report.ok ? "\nReady: no blocking issues." : `\n${errors.length} blocking issue(s).`);
  if (!report.ok) process.exitCode = 1;
} catch (err) {
  console.error("content:check failed:", err.message);
  process.exitCode = 1;
} finally {
  await closeClient();
}

import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { hasPermission, PERMISSIONS } from "@/lib/auth/roles";
import { PUBLISH_STATUS } from "@/lib/content/lifecycle";
import { toLevelCode } from "@/lib/services/curriculumService";
import { lessonDependencies } from "@/lib/services/contentService";
import { exerciseRepository, grammarTopicRepository, lessonRepository, levelRepository, moduleRepository } from "@/lib/repositories/contentRepository";
import { explanationReport } from "@/lib/content/explanationReport";
import { serialize } from "@/lib/db/serialize";

// Explanation coverage of a level's exercises (lib/content/explanationReport.js), on the
// STORED content in every lifecycle state except archived: drafts are exactly what
// authors need to fix. Read-only, content reviewers only. `bun run content:check --
// --explanations` prints it.
export async function getExplanationReport(actor, levelParam) {
  if (!hasPermission(actor, PERMISSIONS.contentReadDrafts)) throw new ForbiddenError();
  const code = toLevelCode(levelParam);
  const level = await levelRepository.findOne({ code });
  if (!level) throw new NotFoundError();
  const notArchived = { publishStatus: { $ne: PUBLISH_STATUS.archived } };

  const { items: modules } = await moduleRepository.list({ levelCode: code, ...notArchived }, { pageSize: 100 });
  const lessons = [];
  for (let page = 1; ; page++) {
    const { items, total } = await lessonRepository.list({ moduleId: { $in: modules.map((m) => m._id) }, ...notArchived }, { page, pageSize: 100 });
    lessons.push(...items);
    if (items.length === 0 || lessons.length >= total) break;
  }
  const deps = lessons.map(lessonDependencies);
  const [exercises, grammar] = await Promise.all([
    exerciseRepository.findManyByIds(deps.flatMap((d) => d.exercises), {}),
    grammarTopicRepository.findManyByIds(deps.flatMap((d) => d.grammar), {}),
  ]);
  const byId = (docs) => new Map(docs.map((d) => [String(d._id), d]));
  return serialize({ level: { code: level.code }, ...explanationReport({ modules, lessons, exercises: byId(exercises), grammar: byId(grammar) }) });
}

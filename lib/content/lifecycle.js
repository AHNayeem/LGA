import { z } from "zod";
import { text } from "@/lib/validation/common";
import { ConflictError } from "@/lib/errors";

// Two independent axes:
//   reviewStatus  – editorial quality gate:   draft -> reviewed -> approved
//   publishStatus – learner visibility:       unpublished | published | archived
// Only approved content can be published. Editing approved content sends it back
// to draft (and unpublishes it) so unreviewed German never reaches learners.

export const REVIEW_STATUS = Object.freeze({ draft: "draft", reviewed: "reviewed", approved: "approved" });
export const PUBLISH_STATUS = Object.freeze({ unpublished: "unpublished", published: "published", archived: "archived" });

export const SOURCE_TYPES = Object.freeze([
  "original", // written by our team
  "ai_generated", // machine-drafted; always needs human review
  "licensed", // third-party content with explicit rights (sourceReference required)
  "reference_metadata", // structural metadata only (e.g. chapter titles for mapping)
  "system", // structural records (levels) created by seed scripts
]);

// Why an item is approved. Anything approved through the admin UI is "human_review".
// "test_fixture" marks approvals made by a guarded script (E2E / development databases)
// so content can be published for validation. It is NOT a genuine content review and
// must never be used for content released to real learners.
export const APPROVAL_BASIS = Object.freeze({ humanReview: "human_review", testFixture: "test_fixture" });

const REVIEW_TRANSITIONS = {
  draft: ["reviewed"],
  reviewed: ["approved", "draft"],
  approved: ["draft"],
};

export function canTransitionReview(from, to) {
  return REVIEW_TRANSITIONS[from]?.includes(to) ?? false;
}

export function canPublish(doc) {
  return doc.reviewStatus === REVIEW_STATUS.approved && doc.publishStatus !== PUBLISH_STATUS.published;
}

export const provenanceSchema = z
  .object({
    sourceType: z.enum(SOURCE_TYPES),
    sourceReference: text(500).optional(),
  })
  .superRefine((val, ctx) => {
    if (val.sourceType === "licensed" && !val.sourceReference) {
      ctx.addIssue({ code: "custom", path: ["sourceReference"], message: "Licensed content needs a source reference" });
    }
  });

// Fields every content document starts with. New content is never approved.
export function initialLifecycle({ sourceType, sourceReference, createdBy = null, now = new Date() }) {
  return {
    sourceType,
    sourceReference: sourceReference ?? null,
    reviewStatus: REVIEW_STATUS.draft,
    publishStatus: PUBLISH_STATUS.unpublished,
    reviewedBy: null,
    reviewedAt: null,
    approvedBy: null,
    approvedAt: null,
    approvalBasis: null,
    publishedAt: null,
    version: 1,
    createdBy,
    updatedBy: createdBy,
    createdAt: now,
    updatedAt: now,
  };
}

// Returns the $set patch for a review transition, or throws ConflictError.
export function reviewTransitionPatch(doc, to, actorId, now = new Date(), { approvalBasis = APPROVAL_BASIS.humanReview } = {}) {
  if (!canTransitionReview(doc.reviewStatus, to)) {
    throw new ConflictError(`Cannot move content from "${doc.reviewStatus}" to "${to}".`);
  }
  const patch = { reviewStatus: to, updatedBy: actorId, updatedAt: now };
  if (to === REVIEW_STATUS.reviewed) Object.assign(patch, { reviewedBy: actorId, reviewedAt: now });
  if (to === REVIEW_STATUS.approved) {
    if (!Object.values(APPROVAL_BASIS).includes(approvalBasis)) throw new ConflictError(`Unknown approval basis "${approvalBasis}".`);
    Object.assign(patch, { approvedBy: actorId, approvedAt: now, approvalBasis });
  }
  if (to === REVIEW_STATUS.draft) {
    Object.assign(patch, { reviewedBy: null, reviewedAt: null, approvedBy: null, approvedAt: null, approvalBasis: null });
    if (doc.publishStatus === PUBLISH_STATUS.published) patch.publishStatus = PUBLISH_STATUS.unpublished;
  }
  return patch;
}

export function publishPatch(doc, to, actorId, now = new Date()) {
  if (to === PUBLISH_STATUS.published) {
    if (!canPublish(doc)) throw new ConflictError("Only approved content can be published.");
    return { publishStatus: to, publishedAt: now, updatedBy: actorId, updatedAt: now };
  }
  if (!Object.values(PUBLISH_STATUS).includes(to)) throw new ConflictError(`Unknown publish status "${to}".`);
  return { publishStatus: to, updatedBy: actorId, updatedAt: now };
}

// Content edits bump the version and reset review so changes are re-checked.
export function editPatch(doc, changes, actorId, now = new Date()) {
  const patch = { ...changes, version: (doc.version ?? 1) + 1, updatedBy: actorId, updatedAt: now };
  if (doc.reviewStatus !== REVIEW_STATUS.draft) {
    Object.assign(patch, {
      reviewStatus: REVIEW_STATUS.draft,
      reviewedBy: null,
      reviewedAt: null,
      approvedBy: null,
      approvedAt: null,
      approvalBasis: null,
    });
    if (doc.publishStatus === PUBLISH_STATUS.published) patch.publishStatus = PUBLISH_STATUS.unpublished;
  }
  return patch;
}

export function isVisibleToLearners(doc) {
  return doc?.publishStatus === PUBLISH_STATUS.published && doc?.reviewStatus === REVIEW_STATUS.approved;
}

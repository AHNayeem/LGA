import { describe, expect, it } from "vitest";
import {
  canTransitionReview,
  editPatch,
  initialLifecycle,
  isVisibleToLearners,
  provenanceSchema,
  publishPatch,
  reviewTransitionPatch,
} from "@/lib/content/lifecycle";
import { ConflictError } from "@/lib/errors";

const actor = "actor-1";

describe("content lifecycle", () => {
  it("starts new content as draft + unpublished, version 1", () => {
    const doc = initialLifecycle({ sourceType: "ai_generated" });
    expect(doc).toMatchObject({ reviewStatus: "draft", publishStatus: "unpublished", version: 1, reviewedBy: null });
  });

  it("allows only draft -> reviewed -> approved and returns to draft", () => {
    expect(canTransitionReview("draft", "reviewed")).toBe(true);
    expect(canTransitionReview("reviewed", "approved")).toBe(true);
    expect(canTransitionReview("draft", "approved")).toBe(false);
    expect(canTransitionReview("approved", "reviewed")).toBe(false);
    expect(canTransitionReview("approved", "draft")).toBe(true);
  });

  it("records reviewer and approver", () => {
    const now = new Date("2026-01-01");
    expect(reviewTransitionPatch({ reviewStatus: "draft" }, "reviewed", actor, now)).toMatchObject({
      reviewStatus: "reviewed",
      reviewedBy: actor,
      reviewedAt: now,
    });
    expect(reviewTransitionPatch({ reviewStatus: "reviewed" }, "approved", actor, now)).toMatchObject({
      approvedBy: actor,
      approvedAt: now,
    });
  });

  it("rejects skipping review", () => {
    expect(() => reviewTransitionPatch({ reviewStatus: "draft" }, "approved", actor)).toThrow(ConflictError);
  });

  it("unpublishes content sent back to draft", () => {
    const patch = reviewTransitionPatch({ reviewStatus: "approved", publishStatus: "published" }, "draft", actor);
    expect(patch).toMatchObject({ reviewStatus: "draft", publishStatus: "unpublished", approvedBy: null });
  });

  it("only publishes approved content", () => {
    expect(() => publishPatch({ reviewStatus: "reviewed", publishStatus: "unpublished" }, "published", actor)).toThrow(
      ConflictError,
    );
    expect(publishPatch({ reviewStatus: "approved", publishStatus: "unpublished" }, "published", actor)).toMatchObject({
      publishStatus: "published",
    });
  });

  it("editing bumps version and resets review of approved content", () => {
    const patch = editPatch({ version: 3, reviewStatus: "approved", publishStatus: "published" }, { order: 2 }, actor);
    expect(patch).toMatchObject({ version: 4, reviewStatus: "draft", publishStatus: "unpublished", order: 2 });
  });

  it("editing a draft keeps it draft and bumps version", () => {
    const patch = editPatch({ version: 1, reviewStatus: "draft", publishStatus: "unpublished" }, {}, actor);
    expect(patch.version).toBe(2);
    expect(patch.reviewStatus).toBeUndefined();
  });

  it("learners see only approved + published", () => {
    expect(isVisibleToLearners({ reviewStatus: "approved", publishStatus: "published" })).toBe(true);
    expect(isVisibleToLearners({ reviewStatus: "draft", publishStatus: "published" })).toBe(false);
    expect(isVisibleToLearners({ reviewStatus: "approved", publishStatus: "archived" })).toBe(false);
  });

  it("licensed content requires a source reference", () => {
    expect(provenanceSchema.safeParse({ sourceType: "licensed" }).success).toBe(false);
    expect(provenanceSchema.safeParse({ sourceType: "licensed", sourceReference: "Contract 42" }).success).toBe(true);
    expect(provenanceSchema.safeParse({ sourceType: "copied" }).success).toBe(false);
  });
});

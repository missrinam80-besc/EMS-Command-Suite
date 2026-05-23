import assert from "node:assert/strict";
import test from "node:test";
import {
  applyHandbookStatusGuardrails,
  isHandbookArticleVisibleForViewer,
  type HandbookArticle,
} from "../src/lib/handbook";

function buildArticle(overrides: Partial<HandbookArticle> = {}): HandbookArticle {
  return {
    id: "article-1",
    categoryId: "cat-1",
    title: "Triage",
    slug: "triage",
    summary: null,
    content: "content",
    status: "published",
    isActive: true,
    sortOrder: 1,
    visibleRankIds: [],
    visibleSpecializationIds: [],
    updatedAt: new Date().toISOString(),
    categoryLabel: "Zorg",
    ...overrides,
  };
}

test("applyHandbookStatusGuardrails forces archived articles inactive", () => {
  const next = applyHandbookStatusGuardrails({ status: "archived" as const, isActive: true });
  assert.equal(next.status, "archived");
  assert.equal(next.isActive, false);
});

test("applyHandbookStatusGuardrails forces published articles active", () => {
  const next = applyHandbookStatusGuardrails({ status: "published" as const, isActive: false });
  assert.equal(next.status, "published");
  assert.equal(next.isActive, true);
});

test("applyHandbookStatusGuardrails leaves draft unchanged", () => {
  const next = applyHandbookStatusGuardrails({ status: "draft" as const, isActive: false });
  assert.equal(next.status, "draft");
  assert.equal(next.isActive, false);
});

test("isHandbookArticleVisibleForViewer hides non-published or inactive articles", () => {
  const viewer = { rankId: "rank-1", specializationIds: ["spec-1"] };
  assert.equal(
    isHandbookArticleVisibleForViewer(buildArticle({ status: "draft" }), viewer),
    false,
  );
  assert.equal(
    isHandbookArticleVisibleForViewer(buildArticle({ isActive: false }), viewer),
    false,
  );
});

test("isHandbookArticleVisibleForViewer allows published unrestricted articles", () => {
  const viewer = { rankId: null, specializationIds: [] };
  assert.equal(isHandbookArticleVisibleForViewer(buildArticle(), viewer), true);
});

test("isHandbookArticleVisibleForViewer enforces rank/specialization restrictions", () => {
  const restricted = buildArticle({
    visibleRankIds: ["rank-command"],
    visibleSpecializationIds: ["spec-trauma"],
  });

  assert.equal(
    isHandbookArticleVisibleForViewer(restricted, {
      rankId: "rank-command",
      specializationIds: [],
    }),
    true,
  );

  assert.equal(
    isHandbookArticleVisibleForViewer(restricted, {
      rankId: null,
      specializationIds: ["spec-trauma"],
    }),
    true,
  );

  assert.equal(
    isHandbookArticleVisibleForViewer(restricted, {
      rankId: "rank-other",
      specializationIds: ["spec-other"],
    }),
    false,
  );
});

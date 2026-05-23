"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { writeAuditLog } from "@/lib/audit";
import { requirePermission } from "@/lib/auth";
import { buildFeedbackUrl } from "@/lib/feedback";
import { applyHandbookStatusGuardrails } from "@/lib/handbook";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";

const categorySchema = z.object({
  code: z.string().trim().min(2, "Code is verplicht."),
  label: z.string().trim().min(2, "Naam is verplicht."),
  description: z.string().trim().optional(),
  sortOrder: z.coerce.number().int().min(0).default(100),
  isActive: z.boolean().default(true),
});

const categoryUpdateSchema = categorySchema.extend({
  id: z.string().trim().min(1, "Categorie ontbreekt."),
});

const categoryDeleteSchema = z.object({
  id: z.string().trim().min(1, "Categorie ontbreekt."),
});

const articleCreateSchema = z.object({
  categoryId: z.string().trim().min(1, "Categorie is verplicht."),
  title: z.string().trim().min(3, "Titel is verplicht."),
  slug: z.string().trim().min(3, "Slug is verplicht."),
  summary: z.string().trim().optional(),
  content: z.string().trim().min(1, "Inhoud is verplicht."),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  sortOrder: z.coerce.number().int().min(0).default(100),
  isActive: z.boolean().default(true),
  visibleRankIds: z.array(z.string().trim()).default([]),
  visibleSpecializationIds: z.array(z.string().trim()).default([]),
  visibilityPreset: z.enum(["custom", "everyone", "ranks_only", "specializations_only"]).default("custom"),
});

const articleUpdateSchema = articleCreateSchema.extend({
  id: z.string().trim().min(1, "Artikel ontbreekt."),
});

const articleDeleteSchema = z.object({
  id: z.string().trim().min(1, "Artikel ontbreekt."),
});

const articleStatusTransitionSchema = z.object({
  id: z.string().trim().min(1, "Artikel ontbreekt."),
  status: z.enum(["draft", "published", "archived"]),
});

function checkboxToBoolean(value: FormDataEntryValue | null) {
  return value === "on" || value === "true" || value === "1";
}

function cleanOptional(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeSlug(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function applyVisibilityPreset<T extends {
  visibleRankIds: string[];
  visibleSpecializationIds: string[];
  visibilityPreset: "custom" | "everyone" | "ranks_only" | "specializations_only";
}>(input: T): T {
  if (input.visibilityPreset === "everyone") {
    return { ...input, visibleRankIds: [], visibleSpecializationIds: [] };
  }
  if (input.visibilityPreset === "ranks_only") {
    if (input.visibleRankIds.length === 0) {
      throw new Error("Selecteer minstens één rank voor preset 'ranks_only'.");
    }
    return { ...input, visibleSpecializationIds: [] };
  }
  if (input.visibilityPreset === "specializations_only") {
    if (input.visibleSpecializationIds.length === 0) {
      throw new Error("Selecteer minstens één specialisatie voor preset 'specializations_only'.");
    }
    return { ...input, visibleRankIds: [] };
  }
  return input;
}

export async function createHandbookCategoryAction(formData: FormData) {
  try {
    const session = await requirePermission("handbook.manage");
    const parsed = categorySchema.parse({
      code: String(formData.get("code") ?? ""),
      label: String(formData.get("label") ?? ""),
      description: String(formData.get("description") ?? ""),
      sortOrder: Number(formData.get("sortOrder") ?? 100),
      isActive: checkboxToBoolean(formData.get("isActive")),
    });
    const supabase = await createSupabaseServerClient();
    const { data: inserted, error } = await supabase
      .from("handbook_categories")
      .insert({
        code: parsed.code,
        label: parsed.label,
        description: cleanOptional(parsed.description),
        sort_order: parsed.sortOrder,
        is_active: parsed.isActive,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    await writeAuditLog(supabase, {
      targetType: "handbook_category",
      targetId: inserted?.id ?? null,
      action: "handbook_category_created",
      summary: `Handboekcategorie aangemaakt: ${parsed.label}`,
      afterState: parsed,
      changedFields: ["code", "label", "description", "sort_order", "is_active"],
      context: { admin_area: "handbook", updated_by: session.userId },
    });
    redirect(buildFeedbackUrl("/handboek", "success", "Categorie aangemaakt."));
  } catch (error) {
    redirect(
      buildFeedbackUrl(
        "/handboek",
        "error",
        error instanceof Error ? error.message : "Categorie kon niet worden aangemaakt.",
      ),
    );
  }
}

export async function updateHandbookCategoryAction(formData: FormData) {
  try {
    const session = await requirePermission("handbook.manage");
    const parsed = categoryUpdateSchema.parse({
      id: String(formData.get("id") ?? ""),
      code: String(formData.get("code") ?? ""),
      label: String(formData.get("label") ?? ""),
      description: String(formData.get("description") ?? ""),
      sortOrder: Number(formData.get("sortOrder") ?? 100),
      isActive: checkboxToBoolean(formData.get("isActive")),
    });
    const supabase = await createSupabaseServerClient();
    const { data: current } = await supabase
      .from("handbook_categories")
      .select("id, code, label, description, sort_order, is_active")
      .eq("id", parsed.id)
      .single();
    const { error } = await supabase
      .from("handbook_categories")
      .update({
        code: parsed.code,
        label: parsed.label,
        description: cleanOptional(parsed.description),
        sort_order: parsed.sortOrder,
        is_active: parsed.isActive,
      })
      .eq("id", parsed.id);
    if (error) throw new Error(error.message);
    await writeAuditLog(supabase, {
      targetType: "handbook_category",
      targetId: parsed.id,
      action: "handbook_category_updated",
      summary: `Handboekcategorie bijgewerkt: ${parsed.label}`,
      beforeState: current ?? null,
      afterState: parsed,
      changedFields: ["code", "label", "description", "sort_order", "is_active"],
      context: { admin_area: "handbook", updated_by: session.userId },
    });
    redirect(buildFeedbackUrl("/handboek", "success", "Categorie bijgewerkt."));
  } catch (error) {
    redirect(
      buildFeedbackUrl(
        "/handboek",
        "error",
        error instanceof Error ? error.message : "Categorie kon niet worden bijgewerkt.",
      ),
    );
  }
}

export async function deleteHandbookCategoryAction(formData: FormData) {
  try {
    const session = await requirePermission("handbook.manage");
    const parsed = categoryDeleteSchema.parse({ id: String(formData.get("id") ?? "") });
    const supabase = await createSupabaseServerClient();
    const { data: current } = await supabase
      .from("handbook_categories")
      .select("id, label")
      .eq("id", parsed.id)
      .single();
    const { count } = await supabase
      .from("handbook_articles")
      .select("id", { count: "exact", head: true })
      .eq("category_id", parsed.id);
    if ((count ?? 0) > 0) {
      throw new Error("Categorie bevat nog artikelen en kan niet verwijderd worden.");
    }
    const { error } = await supabase.from("handbook_categories").delete().eq("id", parsed.id);
    if (error) throw new Error(error.message);
    await writeAuditLog(supabase, {
      targetType: "handbook_category",
      targetId: parsed.id,
      action: "handbook_category_deleted",
      summary: `Handboekcategorie verwijderd: ${current?.label ?? parsed.id}`,
      beforeState: current ?? null,
      changedFields: ["id"],
      context: { admin_area: "handbook", updated_by: session.userId },
    });
    redirect(buildFeedbackUrl("/handboek", "success", "Categorie verwijderd."));
  } catch (error) {
    redirect(
      buildFeedbackUrl(
        "/handboek",
        "error",
        error instanceof Error ? error.message : "Categorie kon niet worden verwijderd.",
      ),
    );
  }
}

export async function createHandbookArticleAction(formData: FormData) {
  try {
    const session = await requirePermission("handbook.manage");
    const rawParsed = articleCreateSchema.parse({
      categoryId: String(formData.get("categoryId") ?? ""),
      title: String(formData.get("title") ?? ""),
      slug: normalizeSlug(String(formData.get("slug") ?? "")),
      summary: String(formData.get("summary") ?? ""),
      content: String(formData.get("content") ?? ""),
      status: String(formData.get("status") ?? "draft"),
      sortOrder: Number(formData.get("sortOrder") ?? 100),
      isActive: checkboxToBoolean(formData.get("isActive")),
      visibleRankIds: formData.getAll("visibleRankIds").map(String),
      visibleSpecializationIds: formData.getAll("visibleSpecializationIds").map(String),
      visibilityPreset: String(formData.get("visibilityPreset") ?? "custom"),
    });
    const parsed = applyHandbookStatusGuardrails(applyVisibilityPreset(rawParsed));
    const supabase = await createSupabaseServerClient();
    const { data: inserted, error } = await supabase
      .from("handbook_articles")
      .insert({
        category_id: parsed.categoryId,
        title: parsed.title,
        slug: parsed.slug,
        summary: cleanOptional(parsed.summary),
        content: parsed.content,
        status: parsed.status,
        sort_order: parsed.sortOrder,
        is_active: parsed.isActive,
        visible_rank_ids: parsed.visibleRankIds,
        visible_specialization_ids: parsed.visibleSpecializationIds,
        author_profile_id: session.userId,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    await writeAuditLog(supabase, {
      targetType: "handbook_article",
      targetId: inserted?.id ?? null,
      action: "handbook_article_created",
      summary: `Handboekartikel aangemaakt: ${parsed.title}`,
      afterState: parsed,
      changedFields: [
        "category_id",
        "title",
        "slug",
        "summary",
        "content",
        "status",
        "sort_order",
        "is_active",
        "visible_rank_ids",
        "visible_specialization_ids",
      ],
      context: { admin_area: "handbook", updated_by: session.userId },
    });
    redirect(buildFeedbackUrl("/handboek", "success", "Artikel aangemaakt."));
  } catch (error) {
    redirect(
      buildFeedbackUrl(
        "/handboek",
        "error",
        error instanceof Error ? error.message : "Artikel kon niet worden aangemaakt.",
      ),
    );
  }
}

export async function updateHandbookArticleAction(formData: FormData) {
  try {
    const session = await requirePermission("handbook.manage");
    const rawParsed = articleUpdateSchema.parse({
      id: String(formData.get("id") ?? ""),
      categoryId: String(formData.get("categoryId") ?? ""),
      title: String(formData.get("title") ?? ""),
      slug: normalizeSlug(String(formData.get("slug") ?? "")),
      summary: String(formData.get("summary") ?? ""),
      content: String(formData.get("content") ?? ""),
      status: String(formData.get("status") ?? "draft"),
      sortOrder: Number(formData.get("sortOrder") ?? 100),
      isActive: checkboxToBoolean(formData.get("isActive")),
      visibleRankIds: formData.getAll("visibleRankIds").map(String),
      visibleSpecializationIds: formData.getAll("visibleSpecializationIds").map(String),
      visibilityPreset: String(formData.get("visibilityPreset") ?? "custom"),
    });
    const parsed = applyHandbookStatusGuardrails(applyVisibilityPreset(rawParsed));
    const supabase = await createSupabaseServerClient();
    const { data: current } = await supabase
      .from("handbook_articles")
      .select("id, title, slug, status")
      .eq("id", parsed.id)
      .single();
    const { error } = await supabase
      .from("handbook_articles")
      .update({
        category_id: parsed.categoryId,
        title: parsed.title,
        slug: parsed.slug,
        summary: cleanOptional(parsed.summary),
        content: parsed.content,
        status: parsed.status,
        sort_order: parsed.sortOrder,
        is_active: parsed.isActive,
        visible_rank_ids: parsed.visibleRankIds,
        visible_specialization_ids: parsed.visibleSpecializationIds,
      })
      .eq("id", parsed.id);
    if (error) throw new Error(error.message);
    await writeAuditLog(supabase, {
      targetType: "handbook_article",
      targetId: parsed.id,
      action: "handbook_article_updated",
      summary: `Handboekartikel bijgewerkt: ${parsed.title}`,
      beforeState: current ?? null,
      afterState: parsed,
      changedFields: [
        "category_id",
        "title",
        "slug",
        "summary",
        "content",
        "status",
        "sort_order",
        "is_active",
        "visible_rank_ids",
        "visible_specialization_ids",
      ],
      context: { admin_area: "handbook", updated_by: session.userId },
    });
    redirect(buildFeedbackUrl("/handboek", "success", "Artikel bijgewerkt."));
  } catch (error) {
    redirect(
      buildFeedbackUrl(
        "/handboek",
        "error",
        error instanceof Error ? error.message : "Artikel kon niet worden bijgewerkt.",
      ),
    );
  }
}

export async function deleteHandbookArticleAction(formData: FormData) {
  try {
    const session = await requirePermission("handbook.manage");
    const parsed = articleDeleteSchema.parse({ id: String(formData.get("id") ?? "") });
    const supabase = await createSupabaseServerClient();
    const { data: current } = await supabase
      .from("handbook_articles")
      .select("id, title")
      .eq("id", parsed.id)
      .single();
    const { error } = await supabase.from("handbook_articles").delete().eq("id", parsed.id);
    if (error) throw new Error(error.message);
    await writeAuditLog(supabase, {
      targetType: "handbook_article",
      targetId: parsed.id,
      action: "handbook_article_deleted",
      summary: `Handboekartikel verwijderd: ${current?.title ?? parsed.id}`,
      beforeState: current ?? null,
      changedFields: ["id"],
      context: { admin_area: "handbook", updated_by: session.userId },
    });
    redirect(buildFeedbackUrl("/handboek", "success", "Artikel verwijderd."));
  } catch (error) {
    redirect(
      buildFeedbackUrl(
        "/handboek",
        "error",
        error instanceof Error ? error.message : "Artikel kon niet worden verwijderd.",
      ),
    );
  }
}

export async function transitionHandbookArticleStatusAction(formData: FormData) {
  try {
    const session = await requirePermission("handbook.manage");
    const parsed = articleStatusTransitionSchema.parse({
      id: String(formData.get("id") ?? ""),
      status: String(formData.get("status") ?? "draft"),
    });
    const supabase = await createSupabaseServerClient();
    const { data: current, error: currentError } = await supabase
      .from("handbook_articles")
      .select("id, title, status, is_active")
      .eq("id", parsed.id)
      .single();
    if (currentError || !current) {
      throw new Error("Artikel niet gevonden.");
    }

    const nextState = applyHandbookStatusGuardrails({
      status: parsed.status,
      isActive: current.is_active,
    });
    const { error } = await supabase
      .from("handbook_articles")
      .update({
        status: nextState.status,
        is_active: nextState.isActive,
      })
      .eq("id", parsed.id);
    if (error) throw new Error(error.message);

    await writeAuditLog(supabase, {
      targetType: "handbook_article",
      targetId: parsed.id,
      action: "handbook_article_status_updated",
      summary: `Status aangepast voor handboekartikel: ${current.title}`,
      beforeState: current,
      afterState: { status: nextState.status, isActive: nextState.isActive },
      changedFields: ["status", "is_active"],
      context: { admin_area: "handbook", updated_by: session.userId },
    });
    redirect(buildFeedbackUrl("/handboek", "success", "Artikelstatus bijgewerkt."));
  } catch (error) {
    redirect(
      buildFeedbackUrl(
        "/handboek",
        "error",
        error instanceof Error ? error.message : "Artikelstatus kon niet worden bijgewerkt.",
      ),
    );
  }
}

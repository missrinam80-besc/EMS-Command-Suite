"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { writeAuditLog } from "@/lib/audit";
import { requirePermission } from "@/lib/auth";
import { buildFeedbackUrl } from "@/lib/feedback";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";

const categorySchema = z.object({
  code: z.string().trim().min(2, "Code is verplicht."),
  label: z.string().trim().min(2, "Naam is verplicht."),
  description: z.string().trim().optional(),
  sortOrder: z.coerce.number().int().min(0).default(100),
  isActive: z.boolean().default(true),
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
});

const articleUpdateSchema = articleCreateSchema.extend({
  id: z.string().trim().min(1, "Artikel ontbreekt."),
});

const articleDeleteSchema = z.object({
  id: z.string().trim().min(1, "Artikel ontbreekt."),
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

export async function createHandbookArticleAction(formData: FormData) {
  try {
    const session = await requirePermission("handbook.manage");
    const parsed = articleCreateSchema.parse({
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
    });
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
    const parsed = articleUpdateSchema.parse({
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
    });
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

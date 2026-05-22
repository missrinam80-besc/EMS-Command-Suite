import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseEnv, shouldUseDemoData } from "@/lib/env";

export type HandbookCategory = {
  id: string;
  code: string;
  label: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
};

export type HandbookArticle = {
  id: string;
  categoryId: string;
  title: string;
  slug: string;
  summary: string | null;
  content: string;
  status: "draft" | "published" | "archived";
  isActive: boolean;
  sortOrder: number;
  visibleRankIds: string[];
  visibleSpecializationIds: string[];
  updatedAt: string;
  categoryLabel?: string | null;
};

export type HandbookVisibilityReference = {
  id: string;
  code: string;
  name: string;
};

export async function getHandbookCategories(): Promise<HandbookCategory[]> {
  if (shouldUseDemoData() || !hasSupabaseEnv()) return [];
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("handbook_categories")
    .select("id, code, label, description, sort_order, is_active")
    .order("sort_order", { ascending: true });
  if (error) return [];
  return (data ?? []).map((item) => ({
    id: item.id,
    code: item.code,
    label: item.label,
    description: item.description,
    sortOrder: item.sort_order,
    isActive: item.is_active,
  }));
}

export async function getHandbookArticles(params?: {
  query?: string;
  categoryId?: string;
  status?: "draft" | "published" | "archived" | "all";
}): Promise<HandbookArticle[]> {
  if (shouldUseDemoData() || !hasSupabaseEnv()) return [];
  const supabase = await createSupabaseServerClient();
  let queryBuilder = supabase
    .from("handbook_articles")
    .select(
      "id, category_id, title, slug, summary, content, status, is_active, sort_order, visible_rank_ids, visible_specialization_ids, updated_at, handbook_categories(label)",
    )
    .order("sort_order", { ascending: true });
  if (params?.categoryId) queryBuilder = queryBuilder.eq("category_id", params.categoryId);
  if (params?.status && params.status !== "all") queryBuilder = queryBuilder.eq("status", params.status);
  if (params?.query) {
    const q = params.query.replace(/[%_]/g, "");
    queryBuilder = queryBuilder.or(`title.ilike.%${q}%,summary.ilike.%${q}%`);
  }
  const { data, error } = await queryBuilder;
  if (error) return [];
  return (data ?? []).map((item) => ({
    id: item.id,
    categoryId: item.category_id,
    title: item.title,
    slug: item.slug,
    summary: item.summary,
    content: item.content ?? "",
    status: item.status as HandbookArticle["status"],
    isActive: item.is_active,
    sortOrder: item.sort_order,
    visibleRankIds: Array.isArray(item.visible_rank_ids)
      ? item.visible_rank_ids.filter((entry): entry is string => typeof entry === "string")
      : [],
    visibleSpecializationIds: Array.isArray(item.visible_specialization_ids)
      ? item.visible_specialization_ids.filter((entry): entry is string => typeof entry === "string")
      : [],
    updatedAt: item.updated_at,
    categoryLabel: Array.isArray(item.handbook_categories)
      ? item.handbook_categories[0]?.label ?? null
      : (item.handbook_categories as { label?: string } | null)?.label ?? null,
  }));
}

export async function getHandbookArticleBySlug(slug: string): Promise<HandbookArticle | null> {
  if (shouldUseDemoData() || !hasSupabaseEnv()) return null;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("handbook_articles")
    .select(
      "id, category_id, title, slug, summary, content, status, is_active, sort_order, visible_rank_ids, visible_specialization_ids, updated_at, handbook_categories(label)",
    )
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data) return null;
  return {
    id: data.id,
    categoryId: data.category_id,
    title: data.title,
    slug: data.slug,
    summary: data.summary,
    content: data.content ?? "",
    status: data.status as HandbookArticle["status"],
    isActive: data.is_active,
    sortOrder: data.sort_order,
    visibleRankIds: Array.isArray(data.visible_rank_ids)
      ? data.visible_rank_ids.filter((entry): entry is string => typeof entry === "string")
      : [],
    visibleSpecializationIds: Array.isArray(data.visible_specialization_ids)
      ? data.visible_specialization_ids.filter((entry): entry is string => typeof entry === "string")
      : [],
    updatedAt: data.updated_at,
    categoryLabel: Array.isArray(data.handbook_categories)
      ? data.handbook_categories[0]?.label ?? null
      : (data.handbook_categories as { label?: string } | null)?.label ?? null,
  };
}

export async function getHandbookVisibilityReferences(): Promise<{
  ranks: HandbookVisibilityReference[];
  specializations: HandbookVisibilityReference[];
}> {
  if (shouldUseDemoData() || !hasSupabaseEnv()) return { ranks: [], specializations: [] };
  const supabase = await createSupabaseServerClient();
  const [{ data: ranks, error: ranksError }, { data: specs, error: specsError }] = await Promise.all([
    supabase.from("ranks").select("id, code, name").order("rank_number", { ascending: true }),
    supabase.from("specializations").select("id, code, name").order("name", { ascending: true }),
  ]);
  if (ranksError || specsError) return { ranks: [], specializations: [] };
  return {
    ranks: (ranks ?? []).map((item) => ({ id: item.id, code: item.code, name: item.name })),
    specializations: (specs ?? []).map((item) => ({ id: item.id, code: item.code, name: item.name })),
  };
}

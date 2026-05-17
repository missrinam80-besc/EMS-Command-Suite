import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseEnv, shouldUseDemoData } from "@/lib/env";
import { hasServiceRoleEnv } from "@/lib/supabase/admin";
import type { AppPermission } from "@/lib/auth";

export type PermissionCatalogItem = {
  id: string;
  code: AppPermission;
  label: string;
  description: string | null;
};

export type ManagedUser = {
  id: string;
  fullName: string;
  email: string;
  citizenId: string;
  callSign: string | null;
  profileType: "medical_staff" | "administratie" | "directie_assistent";
  employmentStatus: string;
  joinedAt: string | null;
  rankId: string | null;
  rankCode: string | null;
  rankName: string | null;
  phone: string | null;
  specializationNames: string[];
  directPermissionCodes: AppPermission[];
  inheritedPermissionCodes: AppPermission[];
};

export type RankPermissionGroup = {
  rankId: string;
  rankCode: string;
  rankName: string;
  permissionCodes: AppPermission[];
};

export type ManagedCatalogItem = {
  id: string;
  code: string;
  label: string;
  colorHex: string | null;
  sortOrder: number;
  isActive: boolean;
  isSystem: boolean;
  description?: string | null;
};

export type InfrastructureHealth = {
  runtimeLabel: string;
  vercelEnv: string;
  vercelUrl: string | null;
  gitCommitSha: string | null;
  supabaseConfigured: boolean;
  serviceRoleConfigured: boolean;
  dataModeLabel: string;
  databaseHealthy: boolean;
  databaseMessage: string;
  patientCount: number;
  reportCount: number;
  profileCount: number;
  auditLogCount: number;
};

function uniquePermissions(codes: string[]): AppPermission[] {
  return [...new Set(codes)].filter((code): code is AppPermission => Boolean(code));
}

function flattenPermissionCodes(
  rows: Array<{ permissions?: { code?: string } | { code?: string }[] | null }>,
) {
  return uniquePermissions(
    rows.flatMap((row) => {
      const relation = row.permissions;
      if (Array.isArray(relation)) {
        return relation.map((item) => item?.code).filter(Boolean) as string[];
      }
      return relation?.code ? [relation.code] : [];
    }),
  );
}

export async function getPermissionCatalog(): Promise<PermissionCatalogItem[]> {
  if (shouldUseDemoData() || !hasSupabaseEnv()) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("permissions")
    .select("id, code, label, description")
    .eq("is_active", true)
    .order("label", { ascending: true });

  if (error) {
    return [];
  }

  return (data ?? []).map((item) => ({
    id: item.id,
    code: item.code as AppPermission,
    label: item.label,
    description: item.description,
  }));
}

export async function getManagedUsers(): Promise<ManagedUser[]> {
  if (shouldUseDemoData() || !hasSupabaseEnv()) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const [
    { data: profiles, error: profilesError },
    { data: privateDetails, error: privateDetailsError },
    { data: rankPermissions, error: rankPermissionsError },
    { data: profilePermissions, error: profilePermissionsError },
    { data: profileSpecializations, error: profileSpecializationsError },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, profile_type, call_sign, employment_status, joined_at, rank_id, ranks(code, name)")
      .order("full_name", { ascending: true }),
    supabase.from("profile_private_details").select("profile_id, email, citizenid, phone"),
    supabase.from("rank_permissions").select("rank_id, permissions(code)"),
    supabase.from("profile_permissions").select("profile_id, permissions(code)"),
    supabase.from("profile_specializations").select("profile_id, specializations(name)"),
  ]);

  if (
    profilesError ||
    privateDetailsError ||
    rankPermissionsError ||
    profilePermissionsError ||
    profileSpecializationsError
  ) {
    return [];
  }

  const privateDetailsMap = new Map(
    (privateDetails ?? []).map((detail) => [detail.profile_id, detail]),
  );

  const rankPermissionMap = new Map<string, AppPermission[]>();
  for (const row of rankPermissions ?? []) {
    const existing = rankPermissionMap.get(row.rank_id) ?? [];
    const next = flattenPermissionCodes([row]);
    rankPermissionMap.set(row.rank_id, uniquePermissions([...existing, ...next]));
  }

  const profilePermissionMap = new Map<string, AppPermission[]>();
  for (const row of profilePermissions ?? []) {
    const existing = profilePermissionMap.get(row.profile_id) ?? [];
    const next = flattenPermissionCodes([row]);
    profilePermissionMap.set(row.profile_id, uniquePermissions([...existing, ...next]));
  }

  const specializationMap = new Map<string, string[]>();
  for (const row of profileSpecializations ?? []) {
    const relation = row.specializations as { name?: string } | { name?: string }[] | null;
    const name = Array.isArray(relation) ? relation[0]?.name : relation?.name;
    if (!name) continue;
    const existing = specializationMap.get(row.profile_id) ?? [];
    specializationMap.set(row.profile_id, [...existing, name]);
  }

  return (profiles ?? []).map((profile) => {
    const rankRelation = profile.ranks as
      | { code?: string; name?: string }
      | { code?: string; name?: string }[]
      | null;
    const rank = Array.isArray(rankRelation) ? rankRelation[0] : rankRelation;
    const details = privateDetailsMap.get(profile.id);
    return {
      id: profile.id,
      fullName: profile.full_name,
      email: details?.email ?? "",
      citizenId: details?.citizenid ?? "",
      callSign: profile.call_sign,
      profileType: profile.profile_type,
      employmentStatus: profile.employment_status,
      joinedAt: profile.joined_at,
      rankId: profile.rank_id,
      rankCode: rank?.code ?? null,
      rankName: rank?.name ?? null,
      phone: details?.phone ?? null,
      specializationNames: specializationMap.get(profile.id) ?? [],
      directPermissionCodes: profilePermissionMap.get(profile.id) ?? [],
      inheritedPermissionCodes: profile.rank_id ? rankPermissionMap.get(profile.rank_id) ?? [] : [],
    } satisfies ManagedUser;
  });
}

export async function getRankPermissionGroups(): Promise<RankPermissionGroup[]> {
  if (shouldUseDemoData() || !hasSupabaseEnv()) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const [{ data: ranks, error: ranksError }, { data: rankPermissions, error: permissionsError }] =
    await Promise.all([
      supabase.from("ranks").select("id, code, name, rank_number").order("rank_number"),
      supabase.from("rank_permissions").select("rank_id, permissions(code)"),
    ]);

  if (ranksError || permissionsError) {
    return [];
  }

  const permissionMap = new Map<string, AppPermission[]>();
  for (const row of rankPermissions ?? []) {
    const existing = permissionMap.get(row.rank_id) ?? [];
    permissionMap.set(row.rank_id, uniquePermissions([...existing, ...flattenPermissionCodes([row])]));
  }

  return (ranks ?? []).map((rank) => ({
    rankId: rank.id,
    rankCode: rank.code,
    rankName: rank.name,
    permissionCodes: permissionMap.get(rank.id) ?? [],
  }));
}

async function getManagedCatalog(
  table: "report_types" | "warning_badges" | "patient_statuses",
): Promise<ManagedCatalogItem[]> {
  if (shouldUseDemoData() || !hasSupabaseEnv()) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  if (table === "report_types") {
    const { data, error } = await supabase
      .from("report_types")
      .select("id, code, label, color_hex, sort_order, is_active, is_system, description")
      .order("sort_order", { ascending: true });

    if (error) {
      return [];
    }

    return (data ?? []).map((item) => ({
      id: item.id,
      code: item.code,
      label: item.label,
      colorHex: item.color_hex,
      sortOrder: item.sort_order,
      isActive: item.is_active,
      isSystem: item.is_system,
      description: item.description ?? null,
    }));
  }

  const { data, error } = await supabase
    .from(table)
    .select("id, code, label, color_hex, sort_order, is_active, is_system")
    .order("sort_order", { ascending: true });

  if (error) {
    return [];
  }

  return (data ?? []).map((item) => ({
    id: item.id,
    code: item.code,
    label: item.label,
    colorHex: item.color_hex,
    sortOrder: item.sort_order,
    isActive: item.is_active,
    isSystem: item.is_system,
    description: null,
  }));
}

export async function getManagedReportTypes() {
  return getManagedCatalog("report_types");
}

export async function getManagedWarningBadges() {
  return getManagedCatalog("warning_badges");
}

export async function getManagedPatientStatuses() {
  return getManagedCatalog("patient_statuses");
}

export async function getInfrastructureHealth(): Promise<InfrastructureHealth> {
  const supabaseConfigured = hasSupabaseEnv();
  const serviceRoleConfigured = hasServiceRoleEnv();
  const demoMode = shouldUseDemoData();

  if (!supabaseConfigured || demoMode) {
    return {
      runtimeLabel: process.env.VERCEL === "1" ? "Vercel" : "Lokaal",
      vercelEnv: process.env.VERCEL_ENV ?? "development",
      vercelUrl: process.env.VERCEL_URL ?? null,
      gitCommitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
      supabaseConfigured,
      serviceRoleConfigured,
      dataModeLabel: demoMode ? "Lokale demo actief" : "Supabase ontbreekt",
      databaseHealthy: false,
      databaseMessage: demoMode
        ? "De app draait in expliciete lokale demo-modus."
        : "Supabase environment variables ontbreken.",
      patientCount: 0,
      reportCount: 0,
      profileCount: 0,
      auditLogCount: 0,
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const [
      { count: patientCount, error: patientError },
      { count: reportCount, error: reportError },
      { count: profileCount, error: profileError },
      { count: auditLogCount, error: auditError },
    ] = await Promise.all([
      supabase.from("patients").select("*", { count: "exact", head: true }),
      supabase.from("medical_reports").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("audit_logs").select("*", { count: "exact", head: true }),
    ]);

    const errors = [patientError, reportError, profileError, auditError].filter(Boolean);

    return {
      runtimeLabel: process.env.VERCEL === "1" ? "Vercel" : "Lokaal",
      vercelEnv: process.env.VERCEL_ENV ?? "development",
      vercelUrl: process.env.VERCEL_URL ?? null,
      gitCommitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
      supabaseConfigured: true,
      serviceRoleConfigured,
      dataModeLabel: "Supabase actief",
      databaseHealthy: errors.length === 0,
      databaseMessage:
        errors.length === 0
          ? "Databasequeries slagen en de live datalaag is actief."
          : errors.map((error) => error?.message).join(" | "),
      patientCount: patientCount ?? 0,
      reportCount: reportCount ?? 0,
      profileCount: profileCount ?? 0,
      auditLogCount: auditLogCount ?? 0,
    };
  } catch (error) {
    return {
      runtimeLabel: process.env.VERCEL === "1" ? "Vercel" : "Lokaal",
      vercelEnv: process.env.VERCEL_ENV ?? "development",
      vercelUrl: process.env.VERCEL_URL ?? null,
      gitCommitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
      supabaseConfigured: true,
      serviceRoleConfigured,
      dataModeLabel: "Supabase actief",
      databaseHealthy: false,
      databaseMessage:
        error instanceof Error ? error.message : "Onbekende infrastructuurfout.",
      patientCount: 0,
      reportCount: 0,
      profileCount: 0,
      auditLogCount: 0,
    };
  }
}

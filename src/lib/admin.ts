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
  tenantId: string | null;
};

export type RankPermissionGroup = {
  rankId: string;
  rankCode: string;
  rankName: string;
  permissionCodes: AppPermission[];
};

export type ManagedRank = {
  id: string;
  code: string;
  name: string;
  rankNumber: number;
  colorHex: string | null;
  description: string | null;
  isActive: boolean;
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

export type ManagedFormTemplate = {
  id: string;
  code: string;
  label: string;
  templateKind: "form" | "report";
  description: string | null;
  reportTypeCode: string | null;
  isActive: boolean;
  isSystem: boolean;
  fieldCount: number;
  updatedAt: string;
};

export type ManagedFormField = {
  id: string;
  templateId: string;
  sectionKey: string;
  fieldKey: string;
  label: string;
  fieldType:
    | "text"
    | "textarea"
    | "number"
    | "date"
    | "datetime"
    | "select"
    | "multiselect"
    | "checkbox"
    | "radio";
  placeholder: string | null;
  helpText: string | null;
  bindingSource: "custom" | "medical_reports" | "patients" | "patient_cases";
  bindingColumn: string | null;
  validationRules: Record<string, unknown>;
  conditionalLogic: Record<string, unknown>;
  options: string[];
  isRequired: boolean;
  sortOrder: number;
  isActive: boolean;
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

export type AdminAuditLogRow = {
  id: string;
  action: string;
  summary: string;
  targetType: string;
  targetId: string | null;
  actorProfileId: string | null;
  actorName: string | null;
  targetLabel: string | null;
  createdAt: string;
};

export type ManagedHospitalConfig = {
  id: string;
  code: string;
  hospitalName: string;
  shortName: string | null;
  city: string | null;
  country: string | null;
  timezone: string;
};

export type ManagedFeatureFlag = {
  id: string;
  code: string;
  label: string;
  description: string | null;
  isEnabled: boolean;
};

export type ManagedNavigationItem = {
  id: string;
  itemKey: string;
  parentItemKey: string | null;
  label: string;
  icon: string | null;
  route: string | null;
  requiredPermissions: string[];
  sortOrder: number;
  isActive: boolean;
};

export type ManagedMedicalCatalogItem = {
  id: string;
  code: string;
  label: string;
  sortOrder: number;
  isActive: boolean;
};

export type ManagedMedicationCatalogItem = {
  id: string;
  code: string;
  name: string;
  medicationType: string | null;
  sortOrder: number;
  isActive: boolean;
};

export type ManagedTreatmentRule = {
  id: string;
  ruleCode: string;
  injuryTypeCode: string | null;
  bodyPartCode: string | null;
  severity: string | null;
  possibleDiagnosis: string | null;
  recommendedTreatment: string | null;
  recommendedMedicationCode: string | null;
  recommendedTools: string[];
  sortOrder: number;
  isActive: boolean;
};

export type ManagedTenant = {
  id: string;
  code: string;
  label: string;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SpecializationPermissionGroup = {
  specializationId: string;
  specializationCode: string;
  specializationName: string;
  minimumRankCode: string | null;
  permissionCodes: AppPermission[];
};

export type TenantChangeRequest = {
  id: string;
  tenantId: string;
  tenantCode: string | null;
  tenantLabel: string | null;
  requestType: "tenant_update" | "tenant_status_toggle";
  status: "pending" | "approved" | "rejected" | "executed";
  reason: string | null;
  payload: Record<string, unknown>;
  requestedBy: string;
  approvedBy: string | null;
  rejectedBy: string | null;
  executedBy: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  executedAt: string | null;
  executionError: string | null;
  createdAt: string;
  updatedAt: string;
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
      .select("id, full_name, profile_type, call_sign, employment_status, joined_at, rank_id, tenant_id, ranks(code, name)")
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
      tenantId: profile.tenant_id ?? null,
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

export async function getManagedRanks(): Promise<ManagedRank[]> {
  if (shouldUseDemoData() || !hasSupabaseEnv()) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("ranks")
    .select("id, code, name, rank_number, color_hex, description, is_active")
    .order("rank_number", { ascending: true });

  if (error) {
    return [];
  }

  return (data ?? []).map((rank) => ({
    id: rank.id,
    code: rank.code,
    name: rank.name,
    rankNumber: rank.rank_number,
    colorHex: rank.color_hex,
    description: rank.description,
    isActive: rank.is_active,
  }));
}

export async function getSpecializationPermissionGroups(): Promise<SpecializationPermissionGroup[]> {
  if (shouldUseDemoData() || !hasSupabaseEnv()) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const [{ data: specs, error: specsError }, { data: specPermissions, error: permsError }] =
    await Promise.all([
      supabase.from("specializations").select("id, code, name, minimum_rank_id, ranks(code)").order("name"),
      supabase.from("specialization_permissions").select("specialization_id, permissions(code)"),
    ]);

  if (specsError || permsError) {
    return [];
  }

  const permissionMap = new Map<string, AppPermission[]>();
  for (const row of specPermissions ?? []) {
    const existing = permissionMap.get(row.specialization_id) ?? [];
    permissionMap.set(
      row.specialization_id,
      uniquePermissions([...existing, ...flattenPermissionCodes([row])]),
    );
  }

  return (specs ?? []).map((item) => {
    const rankRelation = item.ranks as { code?: string } | { code?: string }[] | null;
    const rank = Array.isArray(rankRelation) ? rankRelation[0] : rankRelation;
    return {
      specializationId: item.id,
      specializationCode: item.code,
      specializationName: item.name,
      minimumRankCode: rank?.code ?? null,
      permissionCodes: permissionMap.get(item.id) ?? [],
    } satisfies SpecializationPermissionGroup;
  });
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

export async function getManagedHospitalConfig(): Promise<ManagedHospitalConfig[]> {
  if (shouldUseDemoData() || !hasSupabaseEnv()) return [];

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("hospital_config")
    .select("id, code, hospital_name, short_name, city, country, timezone")
    .order("created_at", { ascending: true });

  if (error) return [];

  return (data ?? []).map((item) => ({
    id: item.id,
    code: item.code,
    hospitalName: item.hospital_name,
    shortName: item.short_name,
    city: item.city,
    country: item.country,
    timezone: item.timezone,
  }));
}

export async function getManagedFeatureFlags(): Promise<ManagedFeatureFlag[]> {
  if (shouldUseDemoData() || !hasSupabaseEnv()) return [];

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("feature_flags")
    .select("id, code, label, description, is_enabled")
    .order("code", { ascending: true });

  if (error) return [];

  return (data ?? []).map((item) => ({
    id: item.id,
    code: item.code,
    label: item.label,
    description: item.description,
    isEnabled: item.is_enabled,
  }));
}

export async function getManagedNavigationItems(): Promise<ManagedNavigationItem[]> {
  if (shouldUseDemoData() || !hasSupabaseEnv()) return [];

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("navigation_items")
    .select("id, item_key, parent_item_key, label, icon, route, required_permissions, sort_order, is_active")
    .order("sort_order", { ascending: true });

  if (error) return [];

  return (data ?? []).map((item) => ({
    id: item.id,
    itemKey: item.item_key,
    parentItemKey: item.parent_item_key,
    label: item.label,
    icon: item.icon,
    route: item.route,
    requiredPermissions: Array.isArray(item.required_permissions)
      ? item.required_permissions.filter((entry): entry is string => typeof entry === "string")
      : [],
    sortOrder: item.sort_order,
    isActive: item.is_active,
  }));
}

export async function getManagedInjuryTypes(): Promise<ManagedMedicalCatalogItem[]> {
  if (shouldUseDemoData() || !hasSupabaseEnv()) return [];
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("medical_catalog_injury_types")
    .select("id, code, label, sort_order, is_active")
    .order("sort_order", { ascending: true });
  if (error) return [];
  return (data ?? []).map((item) => ({
    id: item.id,
    code: item.code,
    label: item.label,
    sortOrder: item.sort_order,
    isActive: item.is_active,
  }));
}

export async function getManagedBodyParts(): Promise<ManagedMedicalCatalogItem[]> {
  if (shouldUseDemoData() || !hasSupabaseEnv()) return [];
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("medical_catalog_body_parts")
    .select("id, code, label, sort_order, is_active")
    .order("sort_order", { ascending: true });
  if (error) return [];
  return (data ?? []).map((item) => ({
    id: item.id,
    code: item.code,
    label: item.label,
    sortOrder: item.sort_order,
    isActive: item.is_active,
  }));
}

export async function getManagedMedicationCatalog(): Promise<ManagedMedicationCatalogItem[]> {
  if (shouldUseDemoData() || !hasSupabaseEnv()) return [];
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("medication_catalog")
    .select("id, code, name, medication_type, sort_order, is_active")
    .order("sort_order", { ascending: true });
  if (error) return [];
  return (data ?? []).map((item) => ({
    id: item.id,
    code: item.code,
    name: item.name,
    medicationType: item.medication_type,
    sortOrder: item.sort_order,
    isActive: item.is_active,
  }));
}

export async function getManagedTreatmentRules(): Promise<ManagedTreatmentRule[]> {
  if (shouldUseDemoData() || !hasSupabaseEnv()) return [];
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("treatment_rules")
    .select(
      "id, rule_code, injury_type_code, body_part_code, severity, possible_diagnosis, recommended_treatment, recommended_medication_code, recommended_tools, sort_order, is_active",
    )
    .order("sort_order", { ascending: true });
  if (error) return [];
  return (data ?? []).map((item) => ({
    id: item.id,
    ruleCode: item.rule_code,
    injuryTypeCode: item.injury_type_code,
    bodyPartCode: item.body_part_code,
    severity: item.severity,
    possibleDiagnosis: item.possible_diagnosis,
    recommendedTreatment: item.recommended_treatment,
    recommendedMedicationCode: item.recommended_medication_code,
    recommendedTools: Array.isArray(item.recommended_tools)
      ? item.recommended_tools.filter((entry): entry is string => typeof entry === "string")
      : [],
    sortOrder: item.sort_order,
    isActive: item.is_active,
  }));
}

export async function getManagedFormTemplates(): Promise<ManagedFormTemplate[]> {
  if (shouldUseDemoData() || !hasSupabaseEnv()) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const [{ data: templates, error: templatesError }, { data: fields, error: fieldsError }] =
    await Promise.all([
      supabase
        .from("form_templates")
        .select("id, code, label, template_kind, description, report_type_code, is_active, is_system, updated_at")
        .order("code", { ascending: true }),
      supabase.from("form_template_fields").select("template_id, is_active"),
    ]);

  if (templatesError || fieldsError) {
    return [];
  }

  const fieldCountMap = new Map<string, number>();
  for (const field of fields ?? []) {
    if (!field.is_active) continue;
    const current = fieldCountMap.get(field.template_id) ?? 0;
    fieldCountMap.set(field.template_id, current + 1);
  }

  return (templates ?? []).map((template) => ({
    id: template.id,
    code: template.code,
    label: template.label,
    templateKind: (template.template_kind ?? "form") as ManagedFormTemplate["templateKind"],
    description: template.description,
    reportTypeCode: template.report_type_code,
    isActive: template.is_active,
    isSystem: template.is_system,
    fieldCount: fieldCountMap.get(template.id) ?? 0,
    updatedAt: template.updated_at,
  }));
}

export async function getManagedFormFields(): Promise<ManagedFormField[]> {
  if (shouldUseDemoData() || !hasSupabaseEnv()) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("form_template_fields")
    .select(
      "id, template_id, section_key, field_key, label, field_type, placeholder, help_text, binding_source, binding_column, validation_rules, conditional_logic, options, is_required, sort_order, is_active",
    )
    .order("sort_order", { ascending: true });

  if (error) {
    return [];
  }

  return (data ?? []).map((field) => ({
    id: field.id,
    templateId: field.template_id,
    sectionKey: field.section_key ?? "general",
    fieldKey: field.field_key,
    label: field.label,
    fieldType: field.field_type as ManagedFormField["fieldType"],
    placeholder: field.placeholder,
    helpText: field.help_text,
    bindingSource: (field.binding_source ?? "custom") as ManagedFormField["bindingSource"],
    bindingColumn: field.binding_column ?? null,
    validationRules:
      field.validation_rules && typeof field.validation_rules === "object"
        ? (field.validation_rules as Record<string, unknown>)
        : {},
    conditionalLogic:
      field.conditional_logic && typeof field.conditional_logic === "object"
        ? (field.conditional_logic as Record<string, unknown>)
        : {},
    options: Array.isArray(field.options)
      ? field.options.filter((entry): entry is string => typeof entry === "string")
      : [],
    isRequired: field.is_required,
    sortOrder: field.sort_order,
    isActive: field.is_active,
  }));
}

export async function getManagedTenants(): Promise<ManagedTenant[]> {
  if (shouldUseDemoData() || !hasSupabaseEnv()) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("tenants")
    .select("id, code, label, is_active, is_default, created_at, updated_at")
    .order("is_default", { ascending: false })
    .order("code", { ascending: true });

  if (error) {
    return [];
  }

  return (data ?? []).map((tenant) => ({
    id: tenant.id,
    code: tenant.code,
    label: tenant.label,
    isActive: tenant.is_active,
    isDefault: tenant.is_default,
    createdAt: tenant.created_at,
    updatedAt: tenant.updated_at,
  }));
}

export async function getTenantChangeRequests(): Promise<TenantChangeRequest[]> {
  if (shouldUseDemoData() || !hasSupabaseEnv()) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("tenant_change_requests")
    .select(
      "id, tenant_id, request_type, status, reason, payload, requested_by, approved_by, rejected_by, executed_by, approved_at, rejected_at, executed_at, execution_error, created_at, updated_at, tenants(code, label)",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return [];
  }

  return (data ?? []).map((row) => {
    const tenantRelation = row.tenants as
      | { code?: string; label?: string }
      | { code?: string; label?: string }[]
      | null;
    const tenant = Array.isArray(tenantRelation) ? tenantRelation[0] : tenantRelation;
    return {
      id: row.id,
      tenantId: row.tenant_id,
      tenantCode: tenant?.code ?? null,
      tenantLabel: tenant?.label ?? null,
      requestType: row.request_type as TenantChangeRequest["requestType"],
      status: row.status as TenantChangeRequest["status"],
      reason: row.reason ?? null,
      payload:
        row.payload && typeof row.payload === "object" && !Array.isArray(row.payload)
          ? (row.payload as Record<string, unknown>)
          : {},
      requestedBy: row.requested_by,
      approvedBy: row.approved_by ?? null,
      rejectedBy: row.rejected_by ?? null,
      executedBy: row.executed_by ?? null,
      approvedAt: row.approved_at ?? null,
      rejectedAt: row.rejected_at ?? null,
      executedAt: row.executed_at ?? null,
      executionError: row.execution_error ?? null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    } satisfies TenantChangeRequest;
  });
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

export async function getAdminAuditLogs(): Promise<AdminAuditLogRow[]> {
  if (shouldUseDemoData() || !hasSupabaseEnv()) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const [{ data: logs, error: logsError }, { data: profiles, error: profilesError }] =
    await Promise.all([
      supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("profiles").select("id, full_name"),
    ]);

  if (logsError || profilesError) {
    return [];
  }

  const actorMap = new Map((profiles ?? []).map((profile) => [profile.id, profile.full_name]));
  const patientIds = [
    ...new Set(
      (logs ?? [])
        .filter((log) => log.target_type === "patient" && log.target_id)
        .map((log) => log.target_id as string),
    ),
  ];
  const patientCaseIds = [
    ...new Set(
      (logs ?? [])
        .filter((log) => log.target_type === "patient_case" && log.target_id)
        .map((log) => log.target_id as string),
    ),
  ];
  const reportIds = [
    ...new Set(
      (logs ?? [])
        .filter((log) => log.target_type === "medical_report" && log.target_id)
        .map((log) => log.target_id as string),
    ),
  ];

  const [
    { data: patients },
    { data: patientCases },
    { data: reports },
  ] = await Promise.all([
    patientIds.length
      ? supabase.from("patients").select("id, full_name, citizenid").in("id", patientIds)
      : Promise.resolve({ data: [] as Array<{ id: string; full_name: string; citizenid: string }> }),
    patientCaseIds.length
      ? supabase.from("patient_cases").select("id, title").in("id", patientCaseIds)
      : Promise.resolve({ data: [] as Array<{ id: string; title: string }> }),
    reportIds.length
      ? supabase.from("medical_reports").select("id, title").in("id", reportIds)
      : Promise.resolve({ data: [] as Array<{ id: string; title: string }> }),
  ]);

  const patientMap = new Map((patients ?? []).map((item) => [item.id, `${item.full_name} · ${item.citizenid}`]));
  const caseMap = new Map((patientCases ?? []).map((item) => [item.id, item.title]));
  const reportMap = new Map((reports ?? []).map((item) => [item.id, item.title]));

  return (logs ?? []).map((log) => ({
    id: log.id,
    action: log.action,
    summary: log.summary,
    targetType: log.target_type,
    targetId: log.target_id ?? null,
    actorProfileId: log.actor_profile_id ?? null,
    actorName: log.actor_profile_id ? actorMap.get(log.actor_profile_id) ?? null : null,
    targetLabel:
      log.target_type === "patient"
        ? patientMap.get(log.target_id ?? "") ?? null
        : log.target_type === "patient_case"
          ? caseMap.get(log.target_id ?? "") ?? null
          : log.target_type === "medical_report"
            ? reportMap.get(log.target_id ?? "") ?? null
            : null,
    createdAt: log.created_at,
  }));
}

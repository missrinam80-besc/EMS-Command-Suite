"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { hasPermission, requireAnyPermission, requirePermission, type AppSession } from "@/lib/auth";
import { buildFeedbackUrl } from "@/lib/feedback";
import { writeAuditLog } from "@/lib/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";

const userSchema = z.object({
  userId: z.string().trim().optional(),
  fullName: z.string().trim().min(3, "Naam is verplicht."),
  email: z.string().trim().email("E-mailadres is ongeldig."),
  password: z.preprocess(
    (value) => {
      if (typeof value !== "string") return value;
      const trimmed = value.trim();
      return trimmed.length === 0 ? undefined : trimmed;
    },
    z.string().min(8, "Wachtwoord moet minstens 8 tekens bevatten.").optional(),
  ),
  citizenId: z.string().trim().min(1, "Citizenid is verplicht."),
  profileType: z.enum(["medical_staff", "administratie", "directie_assistent"]),
  rankId: z.string().trim().optional(),
  callSign: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  employmentStatus: z.string().trim().min(1, "Status is verplicht."),
  joinedAt: z.string().trim().optional(),
  tenantId: z.string().trim().optional(),
});

const permissionsSchema = z.object({
  profileId: z.string().trim().min(1, "Profiel ontbreekt."),
  permissionIds: z.array(z.string().trim()).default([]),
});

const rankPermissionSchema = z.object({
  rankId: z.string().trim().min(1, "Rang ontbreekt."),
  permissionIds: z.array(z.string().trim()).default([]),
});

const reportTypeCreateSchema = z.object({
  code: z.string().trim().min(2, "Code is verplicht."),
  label: z.string().trim().min(2, "Label is verplicht."),
  description: z.string().trim().optional(),
  colorHex: z.string().trim().optional(),
  sortOrder: z.coerce.number().int().min(0).default(100),
  isActive: z.boolean().default(true),
});

const reportTypeUpdateSchema = z.object({
  id: z.string().trim().min(1),
  label: z.string().trim().min(2, "Label is verplicht."),
  description: z.string().trim().optional(),
  colorHex: z.string().trim().optional(),
  sortOrder: z.coerce.number().int().min(0).default(100),
  isActive: z.boolean().default(true),
});

const badgeCreateSchema = z.object({
  code: z.string().trim().min(2, "Code is verplicht."),
  label: z.string().trim().min(2, "Label is verplicht."),
  colorHex: z.string().trim().optional(),
  sortOrder: z.coerce.number().int().min(0).default(100),
  isActive: z.boolean().default(true),
});

const badgeUpdateSchema = z.object({
  id: z.string().trim().min(1),
  label: z.string().trim().min(2, "Label is verplicht."),
  colorHex: z.string().trim().optional(),
  sortOrder: z.coerce.number().int().min(0).default(100),
  isActive: z.boolean().default(true),
});

const patientStatusCreateSchema = z.object({
  code: z.string().trim().min(2, "Code is verplicht."),
  label: z.string().trim().min(2, "Label is verplicht."),
  colorHex: z.string().trim().optional(),
  sortOrder: z.coerce.number().int().min(0).default(100),
  isActive: z.boolean().default(true),
});

const patientStatusUpdateSchema = z.object({
  id: z.string().trim().min(1),
  label: z.string().trim().min(2, "Label is verplicht."),
  colorHex: z.string().trim().optional(),
  sortOrder: z.coerce.number().int().min(0).default(100),
  isActive: z.boolean().default(true),
});

const rankCreateSchema = z.object({
  code: z.string().trim().min(3, "Code is verplicht."),
  name: z.string().trim().min(3, "Naam is verplicht."),
  rankNumber: z.coerce.number().int().min(1, "Rangnummer moet minimaal 1 zijn."),
  colorHex: z.string().trim().optional(),
  description: z.string().trim().optional(),
  isActive: z.boolean().default(true),
});

const formTemplateCreateSchema = z.object({
  code: z.string().trim().min(2, "Code is verplicht."),
  label: z.string().trim().min(2, "Label is verplicht."),
  templateKind: z.enum(["form", "report"]).default("form"),
  description: z.string().trim().optional(),
  reportTypeCode: z.string().trim().optional(),
  isActive: z.boolean().default(true),
});

const formTemplateUpdateSchema = z.object({
  id: z.string().trim().min(1, "Formulier ontbreekt."),
  label: z.string().trim().min(2, "Label is verplicht."),
  templateKind: z.enum(["form", "report"]).default("form"),
  description: z.string().trim().optional(),
  reportTypeCode: z.string().trim().optional(),
  isActive: z.boolean().default(true),
});

const formFieldCreateSchema = z.object({
  templateId: z.string().trim().min(1, "Formulier ontbreekt."),
  fieldKey: z.string().trim().min(2, "Field key is verplicht."),
  label: z.string().trim().min(2, "Label is verplicht."),
  fieldType: z.enum([
    "text",
    "textarea",
    "number",
    "date",
    "datetime",
    "select",
    "multiselect",
    "checkbox",
    "radio",
  ]),
  placeholder: z.string().trim().optional(),
  helpText: z.string().trim().optional(),
  sectionKey: z.string().trim().min(1).default("general"),
  bindingSource: z.enum(["custom", "medical_reports", "patients", "patient_cases"]).default("custom"),
  bindingColumn: z.string().trim().optional(),
  validationRules: z.string().trim().optional(),
  conditionalLogic: z.string().trim().optional(),
  options: z.string().trim().optional(),
  isRequired: z.boolean().default(false),
  sortOrder: z.coerce.number().int().min(0).default(100),
  isActive: z.boolean().default(true),
});

const formFieldUpdateSchema = z.object({
  id: z.string().trim().min(1, "Veld ontbreekt."),
  label: z.string().trim().min(2, "Label is verplicht."),
  fieldType: z.enum([
    "text",
    "textarea",
    "number",
    "date",
    "datetime",
    "select",
    "multiselect",
    "checkbox",
    "radio",
  ]),
  placeholder: z.string().trim().optional(),
  helpText: z.string().trim().optional(),
  sectionKey: z.string().trim().min(1).default("general"),
  bindingSource: z.enum(["custom", "medical_reports", "patients", "patient_cases"]).default("custom"),
  bindingColumn: z.string().trim().optional(),
  validationRules: z.string().trim().optional(),
  conditionalLogic: z.string().trim().optional(),
  options: z.string().trim().optional(),
  isRequired: z.boolean().default(false),
  sortOrder: z.coerce.number().int().min(0).default(100),
  isActive: z.boolean().default(true),
});

const formFieldReorderSchema = z.object({
  fieldId: z.string().trim().min(1, "Veld ontbreekt."),
  direction: z.enum(["up", "down"]),
});

const formSectionRenameSchema = z.object({
  templateId: z.string().trim().min(1, "Template ontbreekt."),
  fromSectionKey: z.string().trim().min(1, "Bronsectie ontbreekt."),
  toSectionKey: z.string().trim().min(1, "Doelsectie ontbreekt."),
});

const formSectionDeleteSchema = z.object({
  templateId: z.string().trim().min(1, "Template ontbreekt."),
  sectionKey: z.string().trim().min(1, "Sectie ontbreekt."),
  targetSectionKey: z.string().trim().min(1, "Doelsectie ontbreekt."),
});

const tenantCreateSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, "Tenant code is verplicht.")
    .regex(/^[a-z0-9_]+$/, "Gebruik enkel kleine letters, cijfers en underscore."),
  label: z.string().trim().min(2, "Tenant label is verplicht."),
});

const tenantToggleSchema = z.object({
  tenantId: z.string().trim().min(1, "Tenant ontbreekt."),
  nextActive: z.boolean(),
  reason: z.string().trim().max(500).optional(),
});

const tenantUpdateSchema = z.object({
  tenantId: z.string().trim().min(1, "Tenant ontbreekt."),
  code: z
    .string()
    .trim()
    .min(2, "Tenant code is verplicht.")
    .regex(/^[a-z0-9_]+$/, "Gebruik enkel kleine letters, cijfers en underscore."),
  label: z.string().trim().min(2, "Tenant label is verplicht."),
  reason: z.string().trim().max(500).optional(),
});

const tenantApprovalSchema = z.object({
  requestId: z.string().trim().min(1, "Request ontbreekt."),
  reason: z.string().trim().max(500).optional(),
});

const tenantRejectSchema = z.object({
  requestId: z.string().trim().min(1, "Request ontbreekt."),
  reason: z.string().trim().min(3, "Reden is verplicht bij afwijzen.").max(500),
});

function checkboxToBoolean(value: FormDataEntryValue | null) {
  return value === "on" || value === "true" || value === "1";
}

async function waitForProfileRow(
  adminClient: ReturnType<typeof createAdminClient>,
  userId: string,
) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const { data } = await adminClient
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (data?.id) {
      return true;
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  return false;
}

function cleanOptional(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function parseOptionsList(raw?: string) {
  return String(raw ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function parseJsonObject(raw?: string) {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed) return {};
  const parsed = JSON.parse(trimmed);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("JSON moet een object zijn.");
  }
  return parsed as Record<string, unknown>;
}

async function writeAdminAudit(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  params: {
    targetType: string;
    targetId?: string | null;
    action: string;
    summary: string;
    beforeState?: Record<string, unknown> | null;
    afterState?: Record<string, unknown> | null;
    changedFields?: string[];
    adminArea: string;
    updatedBy: string;
  },
) {
  await writeAuditLog(supabase, {
    targetType: params.targetType,
    targetId: params.targetId ?? null,
    action: params.action,
    summary: params.summary,
    beforeState: params.beforeState ?? null,
    afterState: params.afterState ?? null,
    changedFields: params.changedFields ?? [],
    context: { admin_area: params.adminArea, updated_by: params.updatedBy },
  });
}

async function ensureUniqueUserFields(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  input: {
    userId?: string;
    email: string;
    citizenId: string;
    callSign?: string;
    phone?: string;
  },
) {
  const normalizedCallSign = cleanOptional(input.callSign);
  const normalizedPhone = cleanOptional(input.phone);

  const [
    { data: emailRows },
    { data: citizenRows },
    { data: callSignRows },
    { data: phoneRows },
  ] = await Promise.all([
    supabase.from("profile_private_details").select("profile_id").eq("email", input.email),
    supabase.from("profile_private_details").select("profile_id").eq("citizenid", input.citizenId),
    normalizedCallSign
      ? supabase.from("profiles").select("id").eq("call_sign", normalizedCallSign)
      : Promise.resolve({ data: [] as Array<{ id: string }> }),
    normalizedPhone
      ? supabase.from("profile_private_details").select("profile_id").eq("phone", normalizedPhone)
      : Promise.resolve({ data: [] as Array<{ profile_id: string }> }),
  ]);

  const currentUserId = input.userId ?? null;
  if ((emailRows ?? []).some((row) => row.profile_id !== currentUserId)) {
    throw new Error("Dit e-mailadres is al in gebruik.");
  }
  if ((citizenRows ?? []).some((row) => row.profile_id !== currentUserId)) {
    throw new Error("Deze citizenid is al in gebruik.");
  }
  if ((callSignRows ?? []).some((row) => row.id !== currentUserId)) {
    throw new Error("Dit roepnummer is al in gebruik.");
  }
  if ((phoneRows ?? []).some((row) => row.profile_id !== currentUserId)) {
    throw new Error("Dit telefoonnummer is al in gebruik.");
  }
}

async function resolveActiveTenantId(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  requestedTenantId?: string | null,
) {
  const normalizedTenantId = cleanOptional(requestedTenantId ?? undefined);
  const fallbackTenantId = (await supabase.rpc("get_default_tenant_id")).data;
  const tenantId = normalizedTenantId ?? fallbackTenantId;
  if (!tenantId) {
    throw new Error("Geen geldige tenant gevonden.");
  }

  const { data: tenant, error } = await supabase
    .from("tenants")
    .select("id, label, is_active")
    .eq("id", tenantId)
    .single();
  if (error || !tenant) {
    throw new Error("Gekozen tenant bestaat niet.");
  }
  if (!tenant.is_active) {
    throw new Error(`Tenant ${tenant.label} is inactief en kan niet gekozen worden.`);
  }

  return tenant.id;
}

async function getProfileTenantId(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  profileId: string,
) {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", profileId)
    .single();

  if (error || !profile?.tenant_id) {
    throw new Error("Tenantcontext ontbreekt voor deze gebruiker.");
  }

  return profile.tenant_id;
}

function isGlobalConfigAdmin(session: AppSession) {
  return hasPermission(session, "config.database.read");
}

async function assertTenantScopedAccess(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  session: AppSession,
  targetTenantId: string,
) {
  if (isGlobalConfigAdmin(session)) {
    return;
  }

  const actorTenantId = await getProfileTenantId(supabase, session.userId);
  if (actorTenantId !== targetTenantId) {
    throw new Error("Geen toegang: deze beheeractie is alleen toegestaan binnen je eigen tenant.");
  }
}

async function requireUserAdminSession() {
  return requireAnyPermission(["config.database.read", "config.users.manage"]);
}

async function requireTenantAdminSession() {
  return requireAnyPermission(["config.database.read", "config.tenants.manage"]);
}

async function requireTenantApprovalSession() {
  return requireAnyPermission(["config.database.read", "config.tenant_approvals.manage"]);
}

async function createTenantChangeRequest(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  params: {
    session: AppSession;
    tenantId: string;
    requestType: "tenant_update" | "tenant_status_toggle";
    reason?: string | null;
    payload: Record<string, unknown>;
  },
) {
  const { data: inserted, error } = await supabase
    .from("tenant_change_requests")
    .insert({
      tenant_id: params.tenantId,
      request_type: params.requestType,
      status: "pending",
      reason: cleanOptional(params.reason ?? undefined),
      payload: params.payload,
      requested_by: params.session.userId,
    })
    .select("id")
    .single();
  if (error) {
    throw new Error(error.message);
  }

  await writeAdminAudit(supabase, {
    targetType: "tenant_change_request",
    targetId: inserted?.id ?? null,
    action: "tenant_change_requested",
    summary: `Tenantwijzigingsverzoek aangemaakt (${params.requestType}).`,
    afterState: {
      tenantId: params.tenantId,
      requestType: params.requestType,
      reason: cleanOptional(params.reason ?? undefined),
      payload: params.payload,
    },
    changedFields: ["status", "reason", "payload"],
    adminArea: "tenant_approvals",
    updatedBy: params.session.userId,
  });
}

function parseUserPayload(formData: FormData) {
  return userSchema.parse({
    userId: String(formData.get("userId") ?? ""),
    fullName: String(formData.get("fullName") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    citizenId: String(formData.get("citizenId") ?? ""),
    profileType: String(formData.get("profileType") ?? "medical_staff"),
    rankId: String(formData.get("rankId") ?? ""),
    callSign: String(formData.get("callSign") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    employmentStatus: String(formData.get("employmentStatus") ?? "actief"),
    joinedAt: String(formData.get("joinedAt") ?? ""),
    tenantId: String(formData.get("tenantId") ?? ""),
  });
}

export async function createManagedUserAction(formData: FormData) {
  try {
    const session = await requireUserAdminSession();
    const parsed = parseUserPayload(formData);
    const supabase = await createSupabaseServerClient();

    if (!parsed.password) {
      throw new Error("Een wachtwoord is verplicht bij het aanmaken van een gebruiker.");
    }

    await ensureUniqueUserFields(supabase, {
      email: parsed.email,
      citizenId: parsed.citizenId,
      callSign: parsed.callSign,
      phone: parsed.phone,
    });

    const adminClient = createAdminClient();
    const tenantId = await resolveActiveTenantId(supabase, parsed.tenantId);
    await assertTenantScopedAccess(supabase, session, tenantId);
    const { data: createdUser, error: createError } = await adminClient.auth.admin.createUser({
      email: parsed.email,
      password: parsed.password,
      email_confirm: true,
      user_metadata: {
        full_name: parsed.fullName,
        profile_type: parsed.profileType,
        citizenid: parsed.citizenId,
      },
    });

    if (createError || !createdUser.user) {
      throw new Error(createError?.message ?? "Gebruiker kon niet worden aangemaakt.");
    }

    const profileReady = await waitForProfileRow(adminClient, createdUser.user.id);
    if (!profileReady) {
      throw new Error("Authenticatiegebruiker is aangemaakt, maar het profielrecord werd niet op tijd aangemaakt.");
    }

    const { error: profileError } = await adminClient
      .from("profiles")
      .update({
        full_name: parsed.fullName,
        profile_type: parsed.profileType,
        call_sign: cleanOptional(parsed.callSign),
        rank_id:
          parsed.profileType === "medical_staff" && parsed.rankId && parsed.rankId !== "none"
            ? parsed.rankId
            : null,
        employment_status: parsed.employmentStatus,
        joined_at: cleanOptional(parsed.joinedAt) ?? new Date().toISOString().slice(0, 10),
        tenant_id: tenantId,
        created_by: session.userId,
        updated_by: session.userId,
      })
      .eq("id", createdUser.user.id);

    if (profileError) {
      throw new Error(profileError.message);
    }

    const { error: privateDetailsError } = await adminClient
      .from("profile_private_details")
      .update({
        email: parsed.email,
        citizenid: parsed.citizenId,
        phone: cleanOptional(parsed.phone),
      })
      .eq("profile_id", createdUser.user.id);

    if (privateDetailsError) {
      throw new Error(privateDetailsError.message);
    }

    await writeAuditLog(supabase, {
      targetType: "profile",
      targetId: createdUser.user.id,
      action: "profile_created",
      summary: `Gebruiker aangemaakt: ${parsed.fullName}`,
      afterState: {
        fullName: parsed.fullName,
        email: parsed.email,
        citizenId: parsed.citizenId,
        profileType: parsed.profileType,
        rankId:
          parsed.profileType === "medical_staff" && parsed.rankId && parsed.rankId !== "none"
            ? parsed.rankId
            : null,
        employmentStatus: parsed.employmentStatus,
        tenantId,
      },
      changedFields: [
        "full_name",
        "email",
        "citizenid",
        "profile_type",
        "rank_id",
        "employment_status",
        "tenant_id",
      ],
      context: { admin_area: "user_management" },
    });

    redirect(buildFeedbackUrl("/beheer", "success", "Gebruiker aangemaakt."));
  } catch (error) {
    redirect(
      buildFeedbackUrl(
        "/beheer",
        "error",
        error instanceof Error ? error.message : "Gebruiker kon niet worden aangemaakt.",
      ),
    );
  }
}

export async function updateManagedUserAction(formData: FormData) {
  try {
    const session = await requireUserAdminSession();
    const parsed = parseUserPayload(formData);
    const supabase = await createSupabaseServerClient();

    if (!parsed.userId) {
      throw new Error("Gebruiker ontbreekt.");
    }

    await ensureUniqueUserFields(supabase, {
      userId: parsed.userId,
      email: parsed.email,
      citizenId: parsed.citizenId,
      callSign: parsed.callSign,
      phone: parsed.phone,
    });

    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id, full_name, profile_type, call_sign, rank_id, employment_status, joined_at, tenant_id")
      .eq("id", parsed.userId)
      .single();
    const { data: existingPrivateDetails } = await supabase
      .from("profile_private_details")
      .select("email, citizenid, phone")
      .eq("profile_id", parsed.userId)
      .single();

    const adminClient = createAdminClient();
    const tenantId = await resolveActiveTenantId(supabase, parsed.tenantId);
    await assertTenantScopedAccess(supabase, session, tenantId);
    const authUpdatePayload: {
      email?: string;
      password?: string;
      user_metadata?: Record<string, string>;
    } = {
      email: parsed.email,
      user_metadata: {
        full_name: parsed.fullName,
        profile_type: parsed.profileType,
        citizenid: parsed.citizenId,
      },
    };

    if (parsed.password) {
      authUpdatePayload.password = parsed.password;
    }

    const { error: authError } = await adminClient.auth.admin.updateUserById(
      parsed.userId,
      authUpdatePayload,
    );

    if (authError) {
      throw new Error(authError.message);
    }

    const { error: profileError } = await adminClient
      .from("profiles")
      .update({
        full_name: parsed.fullName,
        profile_type: parsed.profileType,
        call_sign: cleanOptional(parsed.callSign),
        rank_id:
          parsed.profileType === "medical_staff" && parsed.rankId && parsed.rankId !== "none"
            ? parsed.rankId
            : null,
        employment_status: parsed.employmentStatus,
        joined_at: cleanOptional(parsed.joinedAt),
        tenant_id: tenantId,
        updated_by: session.userId,
      })
      .eq("id", parsed.userId);

    if (profileError) {
      throw new Error(profileError.message);
    }

    const { error: privateDetailsError } = await adminClient
      .from("profile_private_details")
      .update({
        email: parsed.email,
        citizenid: parsed.citizenId,
        phone: cleanOptional(parsed.phone),
      })
      .eq("profile_id", parsed.userId);

    if (privateDetailsError) {
      throw new Error(privateDetailsError.message);
    }

    await writeAuditLog(supabase, {
      targetType: "profile",
      targetId: parsed.userId,
      action: "profile_updated",
      summary: `Gebruiker bijgewerkt: ${parsed.fullName}`,
      beforeState: {
        ...(existingProfile ?? {}),
        ...(existingPrivateDetails ?? {}),
      },
      afterState: {
        fullName: parsed.fullName,
        email: parsed.email,
        citizenId: parsed.citizenId,
        profileType: parsed.profileType,
        rankId:
          parsed.profileType === "medical_staff" && parsed.rankId && parsed.rankId !== "none"
            ? parsed.rankId
            : null,
        callSign: cleanOptional(parsed.callSign),
        phone: cleanOptional(parsed.phone),
        employmentStatus: parsed.employmentStatus,
        joinedAt: cleanOptional(parsed.joinedAt),
        tenantId,
        passwordChanged: Boolean(parsed.password),
      },
      changedFields: [
        "full_name",
        "email",
        "citizenid",
        "profile_type",
        "rank_id",
        "call_sign",
        "phone",
        "employment_status",
        "joined_at",
        "tenant_id",
        ...(parsed.password ? ["password"] : []),
      ],
      context: { admin_area: "user_management", updated_by: session.userId },
    });

    redirect(buildFeedbackUrl("/beheer", "success", "Gebruiker bijgewerkt."));
  } catch (error) {
    redirect(
      buildFeedbackUrl(
        "/beheer",
        "error",
        error instanceof Error ? error.message : "Gebruiker kon niet worden bijgewerkt.",
      ),
    );
  }
}

export async function updateManagedUserPermissionsAction(formData: FormData) {
  try {
    const session = await requireUserAdminSession();
    const parsed = permissionsSchema.parse({
      profileId: String(formData.get("profileId") ?? ""),
      permissionIds: formData.getAll("permissionIds").map(String),
    });

    const supabase = await createSupabaseServerClient();
    const targetTenantId = await getProfileTenantId(supabase, parsed.profileId);
    await assertTenantScopedAccess(supabase, session, targetTenantId);
    const { data: currentPermissions } = await supabase
      .from("profile_permissions")
      .select("permission_id")
      .eq("profile_id", parsed.profileId);
    await supabase.from("profile_permissions").delete().eq("profile_id", parsed.profileId);

    if (parsed.permissionIds.length) {
      const { error } = await supabase.from("profile_permissions").insert(
        parsed.permissionIds.map((permissionId) => ({
          profile_id: parsed.profileId,
          permission_id: permissionId,
        })),
      );

      if (error) {
        throw new Error(error.message);
      }
    }

    await writeAuditLog(supabase, {
      targetType: "profile_permissions",
      targetId: parsed.profileId,
      action: "profile_permissions_updated",
      summary: "Directe gebruikersrechten bijgewerkt.",
      beforeState: {
        permissionIds: (currentPermissions ?? []).map((item) => item.permission_id),
      },
      afterState: { permissionIds: parsed.permissionIds },
      changedFields: ["profile_permissions"],
      context: { admin_area: "permissions", updated_by: session.userId },
    });

    redirect(buildFeedbackUrl("/beheer", "success", "Gebruikersrechten bijgewerkt."));
  } catch (error) {
    redirect(
      buildFeedbackUrl(
        "/beheer",
        "error",
        error instanceof Error ? error.message : "Gebruikersrechten konden niet worden bijgewerkt.",
      ),
    );
  }
}

export async function updateRankPermissionGroupAction(formData: FormData) {
  try {
    const session = await requirePermission("config.database.read");
    const parsed = rankPermissionSchema.parse({
      rankId: String(formData.get("rankId") ?? ""),
      permissionIds: formData.getAll("permissionIds").map(String),
    });

    const supabase = await createSupabaseServerClient();
    const { data: currentPermissions } = await supabase
      .from("rank_permissions")
      .select("permission_id")
      .eq("rank_id", parsed.rankId);
    await supabase.from("rank_permissions").delete().eq("rank_id", parsed.rankId);

    if (parsed.permissionIds.length) {
      const { error } = await supabase.from("rank_permissions").insert(
        parsed.permissionIds.map((permissionId) => ({
          rank_id: parsed.rankId,
          permission_id: permissionId,
        })),
      );

      if (error) {
        throw new Error(error.message);
      }
    }

    await writeAuditLog(supabase, {
      targetType: "rank_permissions",
      targetId: parsed.rankId,
      action: "rank_permissions_updated",
      summary: "Rangrechtengroep bijgewerkt.",
      beforeState: {
        permissionIds: (currentPermissions ?? []).map((item) => item.permission_id),
      },
      afterState: { permissionIds: parsed.permissionIds },
      changedFields: ["rank_permissions"],
      context: { admin_area: "permissions", updated_by: session.userId },
    });

    redirect(buildFeedbackUrl("/beheer", "success", "Rechtengroep bijgewerkt."));
  } catch (error) {
    redirect(
      buildFeedbackUrl(
        "/beheer",
        "error",
        error instanceof Error ? error.message : "Rechtengroep kon niet worden bijgewerkt.",
      ),
    );
  }
}

export async function createReportTypeAction(formData: FormData) {
  try {
    const session = await requirePermission("config.report_types.manage");
    const parsed = reportTypeCreateSchema.parse({
      code: String(formData.get("code") ?? ""),
      label: String(formData.get("label") ?? ""),
      description: String(formData.get("description") ?? ""),
      colorHex: String(formData.get("colorHex") ?? ""),
      sortOrder: Number(formData.get("sortOrder") ?? 100),
      isActive: checkboxToBoolean(formData.get("isActive")),
    });

    const supabase = await createSupabaseServerClient();
    const { data: inserted, error } = await supabase
      .from("report_types")
      .insert({
        code: parsed.code,
        label: parsed.label,
        description: cleanOptional(parsed.description),
        color_hex: cleanOptional(parsed.colorHex),
        sort_order: parsed.sortOrder,
        is_active: parsed.isActive,
        is_system: false,
      })
      .select("id")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    await writeAdminAudit(supabase, {
      targetType: "report_type",
      targetId: inserted?.id ?? null,
      action: "report_type_created",
      summary: `Rapporttype aangemaakt: ${parsed.label}`,
      afterState: parsed,
      changedFields: ["code", "label", "description", "color_hex", "sort_order", "is_active"],
      adminArea: "report_types",
      updatedBy: session.userId,
    });

    redirect(buildFeedbackUrl("/beheer/rapporten-formulieren", "success", "Rapporttype aangemaakt."));
  } catch (error) {
    redirect(
      buildFeedbackUrl(
        "/beheer/rapporten-formulieren",
        "error",
        error instanceof Error ? error.message : "Rapporttype kon niet worden aangemaakt.",
      ),
    );
  }
}

export async function updateReportTypeAction(formData: FormData) {
  try {
    const session = await requirePermission("config.report_types.manage");
    const parsed = reportTypeUpdateSchema.parse({
      id: String(formData.get("id") ?? ""),
      label: String(formData.get("label") ?? ""),
      description: String(formData.get("description") ?? ""),
      colorHex: String(formData.get("colorHex") ?? ""),
      sortOrder: Number(formData.get("sortOrder") ?? 100),
      isActive: checkboxToBoolean(formData.get("isActive")),
    });

    const supabase = await createSupabaseServerClient();
    const { data: current } = await supabase
      .from("report_types")
      .select("id, label, description, color_hex, sort_order, is_active")
      .eq("id", parsed.id)
      .single();
    const { error } = await supabase
      .from("report_types")
      .update({
        label: parsed.label,
        description: cleanOptional(parsed.description),
        color_hex: cleanOptional(parsed.colorHex),
        sort_order: parsed.sortOrder,
        is_active: parsed.isActive,
      })
      .eq("id", parsed.id);

    if (error) {
      throw new Error(error.message);
    }

    await writeAdminAudit(supabase, {
      targetType: "report_type",
      targetId: parsed.id,
      action: "report_type_updated",
      summary: `Rapporttype bijgewerkt: ${parsed.label}`,
      beforeState: current ?? null,
      afterState: parsed,
      changedFields: ["label", "description", "color_hex", "sort_order", "is_active"],
      adminArea: "report_types",
      updatedBy: session.userId,
    });

    redirect(buildFeedbackUrl("/beheer/rapporten-formulieren", "success", "Rapporttype bijgewerkt."));
  } catch (error) {
    redirect(
      buildFeedbackUrl(
        "/beheer/rapporten-formulieren",
        "error",
        error instanceof Error ? error.message : "Rapporttype kon niet worden bijgewerkt.",
      ),
    );
  }
}

export async function deleteReportTypeAction(formData: FormData) {
  try {
    const session = await requirePermission("config.report_types.manage");
    const reportTypeId = String(formData.get("id") ?? "");
    if (!reportTypeId) throw new Error("Rapporttype ontbreekt.");

    const supabase = await createSupabaseServerClient();
    const { data: current } = await supabase
      .from("report_types")
      .select("id, label, is_system")
      .eq("id", reportTypeId)
      .single();

    if (!current) {
      throw new Error("Rapporttype niet gevonden.");
    }

    if (current.is_system) {
      throw new Error("Systeemrapporttypes kunnen niet verwijderd worden.");
    }

    const { error } = await supabase.from("report_types").delete().eq("id", reportTypeId);
    if (error) {
      throw new Error(error.message);
    }

    await writeAdminAudit(supabase, {
      targetType: "report_type",
      targetId: reportTypeId,
      action: "report_type_deleted",
      summary: `Rapporttype verwijderd: ${current.label}`,
      beforeState: current,
      changedFields: ["id"],
      adminArea: "report_types",
      updatedBy: session.userId,
    });

    redirect(buildFeedbackUrl("/beheer/rapporten-formulieren", "success", "Rapporttype verwijderd."));
  } catch (error) {
    redirect(
      buildFeedbackUrl(
        "/beheer/rapporten-formulieren",
        "error",
        error instanceof Error ? error.message : "Rapporttype kon niet worden verwijderd.",
      ),
    );
  }
}

export async function createWarningBadgeAction(formData: FormData) {
  try {
    const session = await requirePermission("config.badges.manage");
    const parsed = badgeCreateSchema.parse({
      code: String(formData.get("code") ?? ""),
      label: String(formData.get("label") ?? ""),
      colorHex: String(formData.get("colorHex") ?? ""),
      sortOrder: Number(formData.get("sortOrder") ?? 100),
      isActive: checkboxToBoolean(formData.get("isActive")),
    });

    const supabase = await createSupabaseServerClient();
    const { data: inserted, error } = await supabase
      .from("warning_badges")
      .insert({
        code: parsed.code,
        label: parsed.label,
        color_hex: cleanOptional(parsed.colorHex),
        sort_order: parsed.sortOrder,
        is_active: parsed.isActive,
        is_system: false,
      })
      .select("id")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    await writeAdminAudit(supabase, {
      targetType: "warning_badge",
      targetId: inserted?.id ?? null,
      action: "warning_badge_created",
      summary: `Badge aangemaakt: ${parsed.label}`,
      afterState: parsed,
      changedFields: ["code", "label", "color_hex", "sort_order", "is_active"],
      adminArea: "badges",
      updatedBy: session.userId,
    });

    redirect(buildFeedbackUrl("/beheer", "success", "Badge aangemaakt."));
  } catch (error) {
    redirect(
      buildFeedbackUrl(
        "/beheer",
        "error",
        error instanceof Error ? error.message : "Badge kon niet worden aangemaakt.",
      ),
    );
  }
}

export async function updateWarningBadgeAction(formData: FormData) {
  try {
    const session = await requirePermission("config.badges.manage");
    const parsed = badgeUpdateSchema.parse({
      id: String(formData.get("id") ?? ""),
      label: String(formData.get("label") ?? ""),
      colorHex: String(formData.get("colorHex") ?? ""),
      sortOrder: Number(formData.get("sortOrder") ?? 100),
      isActive: checkboxToBoolean(formData.get("isActive")),
    });

    const supabase = await createSupabaseServerClient();
    const { data: current } = await supabase
      .from("warning_badges")
      .select("id, label, color_hex, sort_order, is_active")
      .eq("id", parsed.id)
      .single();
    const { error } = await supabase
      .from("warning_badges")
      .update({
        label: parsed.label,
        color_hex: cleanOptional(parsed.colorHex),
        sort_order: parsed.sortOrder,
        is_active: parsed.isActive,
      })
      .eq("id", parsed.id);

    if (error) {
      throw new Error(error.message);
    }

    await writeAdminAudit(supabase, {
      targetType: "warning_badge",
      targetId: parsed.id,
      action: "warning_badge_updated",
      summary: `Badge bijgewerkt: ${parsed.label}`,
      beforeState: current ?? null,
      afterState: parsed,
      changedFields: ["label", "color_hex", "sort_order", "is_active"],
      adminArea: "badges",
      updatedBy: session.userId,
    });

    redirect(buildFeedbackUrl("/beheer", "success", "Badge bijgewerkt."));
  } catch (error) {
    redirect(
      buildFeedbackUrl(
        "/beheer",
        "error",
        error instanceof Error ? error.message : "Badge kon niet worden bijgewerkt.",
      ),
    );
  }
}

export async function createPatientStatusAction(formData: FormData) {
  try {
    const session = await requirePermission("config.patient_statuses.manage");
    const parsed = patientStatusCreateSchema.parse({
      code: String(formData.get("code") ?? ""),
      label: String(formData.get("label") ?? ""),
      colorHex: String(formData.get("colorHex") ?? ""),
      sortOrder: Number(formData.get("sortOrder") ?? 100),
      isActive: checkboxToBoolean(formData.get("isActive")),
    });

    const supabase = await createSupabaseServerClient();
    const { data: inserted, error } = await supabase
      .from("patient_statuses")
      .insert({
        code: parsed.code,
        label: parsed.label,
        color_hex: cleanOptional(parsed.colorHex),
        sort_order: parsed.sortOrder,
        is_active: parsed.isActive,
        is_system: false,
      })
      .select("id")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    await writeAdminAudit(supabase, {
      targetType: "patient_status",
      targetId: inserted?.id ?? null,
      action: "patient_status_created",
      summary: `Patientstatus aangemaakt: ${parsed.label}`,
      afterState: parsed,
      changedFields: ["code", "label", "color_hex", "sort_order", "is_active"],
      adminArea: "patient_statuses",
      updatedBy: session.userId,
    });

    redirect(buildFeedbackUrl("/beheer", "success", "Patientstatus aangemaakt."));
  } catch (error) {
    redirect(
      buildFeedbackUrl(
        "/beheer",
        "error",
        error instanceof Error ? error.message : "Patientstatus kon niet worden aangemaakt.",
      ),
    );
  }
}

export async function updatePatientStatusAction(formData: FormData) {
  try {
    const session = await requirePermission("config.patient_statuses.manage");
    const parsed = patientStatusUpdateSchema.parse({
      id: String(formData.get("id") ?? ""),
      label: String(formData.get("label") ?? ""),
      colorHex: String(formData.get("colorHex") ?? ""),
      sortOrder: Number(formData.get("sortOrder") ?? 100),
      isActive: checkboxToBoolean(formData.get("isActive")),
    });

    const supabase = await createSupabaseServerClient();
    const { data: current } = await supabase
      .from("patient_statuses")
      .select("id, label, color_hex, sort_order, is_active")
      .eq("id", parsed.id)
      .single();
    const { error } = await supabase
      .from("patient_statuses")
      .update({
        label: parsed.label,
        color_hex: cleanOptional(parsed.colorHex),
        sort_order: parsed.sortOrder,
        is_active: parsed.isActive,
      })
      .eq("id", parsed.id);

    if (error) {
      throw new Error(error.message);
    }

    await writeAdminAudit(supabase, {
      targetType: "patient_status",
      targetId: parsed.id,
      action: "patient_status_updated",
      summary: `Patientstatus bijgewerkt: ${parsed.label}`,
      beforeState: current ?? null,
      afterState: parsed,
      changedFields: ["label", "color_hex", "sort_order", "is_active"],
      adminArea: "patient_statuses",
      updatedBy: session.userId,
    });

    redirect(buildFeedbackUrl("/beheer", "success", "Patientstatus bijgewerkt."));
  } catch (error) {
    redirect(
      buildFeedbackUrl(
        "/beheer",
        "error",
        error instanceof Error ? error.message : "Patientstatus kon niet worden bijgewerkt.",
      ),
    );
  }
}

export async function createRankAction(formData: FormData) {
  try {
    const session = await requirePermission("config.ranks.manage");
    const parsed = rankCreateSchema.parse({
      code: String(formData.get("code") ?? ""),
      name: String(formData.get("name") ?? ""),
      rankNumber: Number(formData.get("rankNumber") ?? 0),
      colorHex: String(formData.get("colorHex") ?? ""),
      description: String(formData.get("description") ?? ""),
      isActive: checkboxToBoolean(formData.get("isActive")),
    });

    const supabase = await createSupabaseServerClient();
    const { data: inserted, error } = await supabase
      .from("ranks")
      .insert({
        code: parsed.code,
        name: parsed.name,
        rank_number: parsed.rankNumber,
        color_hex: cleanOptional(parsed.colorHex),
        description: cleanOptional(parsed.description),
        is_active: parsed.isActive,
      })
      .select("id")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    await writeAdminAudit(supabase, {
      targetType: "rank",
      targetId: inserted?.id ?? null,
      action: "rank_created",
      summary: `Rang aangemaakt: ${parsed.name}`,
      afterState: parsed,
      changedFields: ["code", "name", "rank_number", "color_hex", "description", "is_active"],
      adminArea: "ranks",
      updatedBy: session.userId,
    });

    redirect(buildFeedbackUrl("/beheer", "success", "Rang aangemaakt."));
  } catch (error) {
    redirect(
      buildFeedbackUrl(
        "/beheer",
        "error",
        error instanceof Error ? error.message : "Rang kon niet worden aangemaakt.",
      ),
    );
  }
}

export async function createFormTemplateAction(formData: FormData) {
  try {
    const session = await requirePermission("config.forms.manage");
    const parsed = formTemplateCreateSchema.parse({
      code: String(formData.get("code") ?? ""),
      label: String(formData.get("label") ?? ""),
      templateKind: String(formData.get("templateKind") ?? "form"),
      description: String(formData.get("description") ?? ""),
      reportTypeCode: String(formData.get("reportTypeCode") ?? ""),
      isActive: checkboxToBoolean(formData.get("isActive")),
    });

    const supabase = await createSupabaseServerClient();
    const { data: inserted, error } = await supabase
      .from("form_templates")
      .insert({
        code: parsed.code,
        label: parsed.label,
        template_kind: parsed.templateKind,
        description: cleanOptional(parsed.description),
        report_type_code: cleanOptional(parsed.reportTypeCode),
        is_active: parsed.isActive,
        is_system: false,
      })
      .select("id")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    await writeAdminAudit(supabase, {
      targetType: "form_template",
      targetId: inserted?.id ?? null,
      action: "form_template_created",
      summary: `Formulier aangemaakt: ${parsed.label}`,
      afterState: parsed,
      changedFields: ["code", "label", "template_kind", "description", "report_type_code", "is_active"],
      adminArea: "forms",
      updatedBy: session.userId,
    });

    redirect(buildFeedbackUrl("/beheer/rapporten-formulieren", "success", "Formulier aangemaakt."));
  } catch (error) {
    redirect(
      buildFeedbackUrl(
        "/beheer/rapporten-formulieren",
        "error",
        error instanceof Error ? error.message : "Formulier kon niet worden aangemaakt.",
      ),
    );
  }
}

export async function updateFormTemplateAction(formData: FormData) {
  try {
    const session = await requirePermission("config.forms.manage");
    const parsed = formTemplateUpdateSchema.parse({
      id: String(formData.get("id") ?? ""),
      label: String(formData.get("label") ?? ""),
      templateKind: String(formData.get("templateKind") ?? "form"),
      description: String(formData.get("description") ?? ""),
      reportTypeCode: String(formData.get("reportTypeCode") ?? ""),
      isActive: checkboxToBoolean(formData.get("isActive")),
    });

    const supabase = await createSupabaseServerClient();
    const { data: current } = await supabase
      .from("form_templates")
      .select("id, label, template_kind, description, report_type_code, is_active")
      .eq("id", parsed.id)
      .single();

    const { error } = await supabase
      .from("form_templates")
      .update({
        label: parsed.label,
        template_kind: parsed.templateKind,
        description: cleanOptional(parsed.description),
        report_type_code: cleanOptional(parsed.reportTypeCode),
        is_active: parsed.isActive,
      })
      .eq("id", parsed.id);

    if (error) {
      throw new Error(error.message);
    }

    await writeAdminAudit(supabase, {
      targetType: "form_template",
      targetId: parsed.id,
      action: "form_template_updated",
      summary: `Formulier bijgewerkt: ${parsed.label}`,
      beforeState: current ?? null,
      afterState: parsed,
      changedFields: ["label", "template_kind", "description", "report_type_code", "is_active"],
      adminArea: "forms",
      updatedBy: session.userId,
    });

    redirect(buildFeedbackUrl("/beheer/rapporten-formulieren", "success", "Formulier bijgewerkt."));
  } catch (error) {
    redirect(
      buildFeedbackUrl(
        "/beheer/rapporten-formulieren",
        "error",
        error instanceof Error ? error.message : "Formulier kon niet worden bijgewerkt.",
      ),
    );
  }
}

export async function deleteFormTemplateAction(formData: FormData) {
  try {
    const session = await requirePermission("config.forms.manage");
    const templateId = String(formData.get("id") ?? "");
    if (!templateId) throw new Error("Formulier ontbreekt.");

    const supabase = await createSupabaseServerClient();
    const { data: current } = await supabase
      .from("form_templates")
      .select("id, label, is_system")
      .eq("id", templateId)
      .single();

    if (!current) {
      throw new Error("Formulier niet gevonden.");
    }

    if (current.is_system) {
      throw new Error("Systeemformulieren kunnen niet verwijderd worden.");
    }

    const { error } = await supabase.from("form_templates").delete().eq("id", templateId);
    if (error) {
      throw new Error(error.message);
    }

    await writeAdminAudit(supabase, {
      targetType: "form_template",
      targetId: templateId,
      action: "form_template_deleted",
      summary: `Formulier verwijderd: ${current.label}`,
      beforeState: current,
      changedFields: ["id"],
      adminArea: "forms",
      updatedBy: session.userId,
    });

    redirect(buildFeedbackUrl("/beheer/rapporten-formulieren", "success", "Formulier verwijderd."));
  } catch (error) {
    redirect(
      buildFeedbackUrl(
        "/beheer/rapporten-formulieren",
        "error",
        error instanceof Error ? error.message : "Formulier kon niet worden verwijderd.",
      ),
    );
  }
}

export async function createFormFieldAction(formData: FormData) {
  try {
    const session = await requirePermission("config.forms.manage");
    const parsed = formFieldCreateSchema.parse({
      templateId: String(formData.get("templateId") ?? ""),
      fieldKey: String(formData.get("fieldKey") ?? ""),
      label: String(formData.get("label") ?? ""),
      fieldType: String(formData.get("fieldType") ?? "text"),
      placeholder: String(formData.get("placeholder") ?? ""),
      helpText: String(formData.get("helpText") ?? ""),
      sectionKey: String(formData.get("sectionKey") ?? "general"),
      bindingSource: String(formData.get("bindingSource") ?? "custom"),
      bindingColumn: String(formData.get("bindingColumn") ?? ""),
      validationRules: String(formData.get("validationRules") ?? ""),
      conditionalLogic: String(formData.get("conditionalLogic") ?? ""),
      options: String(formData.get("options") ?? ""),
      isRequired: checkboxToBoolean(formData.get("isRequired")),
      sortOrder: Number(formData.get("sortOrder") ?? 100),
      isActive: checkboxToBoolean(formData.get("isActive")),
    });

    const optionList = parseOptionsList(parsed.options);
    const validationRules = parseJsonObject(parsed.validationRules);
    const conditionalLogic = parseJsonObject(parsed.conditionalLogic);

    const supabase = await createSupabaseServerClient();
    const { data: inserted, error } = await supabase
      .from("form_template_fields")
      .insert({
        template_id: parsed.templateId,
        field_key: parsed.fieldKey,
        label: parsed.label,
        field_type: parsed.fieldType,
        placeholder: cleanOptional(parsed.placeholder),
        help_text: cleanOptional(parsed.helpText),
        section_key: parsed.sectionKey,
        binding_source: parsed.bindingSource,
        binding_column: cleanOptional(parsed.bindingColumn),
        validation_rules: validationRules,
        conditional_logic: conditionalLogic,
        options: optionList,
        is_required: parsed.isRequired,
        sort_order: parsed.sortOrder,
        is_active: parsed.isActive,
      })
      .select("id")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    await writeAdminAudit(supabase, {
      targetType: "form_template_field",
      targetId: inserted?.id ?? null,
      action: "form_field_created",
      summary: `Formulierveld aangemaakt: ${parsed.label}`,
      afterState: { ...parsed, options: optionList, validationRules, conditionalLogic },
      changedFields: [
        "template_id",
        "field_key",
        "label",
        "field_type",
        "placeholder",
        "help_text",
        "section_key",
        "binding_source",
        "binding_column",
        "validation_rules",
        "conditional_logic",
        "options",
        "is_required",
        "sort_order",
        "is_active",
      ],
      adminArea: "forms",
      updatedBy: session.userId,
    });

    redirect(buildFeedbackUrl("/beheer/rapporten-formulieren", "success", "Formulierveld aangemaakt."));
  } catch (error) {
    redirect(
      buildFeedbackUrl(
        "/beheer/rapporten-formulieren",
        "error",
        error instanceof Error ? error.message : "Formulierveld kon niet worden aangemaakt.",
      ),
    );
  }
}

export async function updateFormFieldAction(formData: FormData) {
  try {
    const session = await requirePermission("config.forms.manage");
    const parsed = formFieldUpdateSchema.parse({
      id: String(formData.get("id") ?? ""),
      label: String(formData.get("label") ?? ""),
      fieldType: String(formData.get("fieldType") ?? "text"),
      placeholder: String(formData.get("placeholder") ?? ""),
      helpText: String(formData.get("helpText") ?? ""),
      sectionKey: String(formData.get("sectionKey") ?? "general"),
      bindingSource: String(formData.get("bindingSource") ?? "custom"),
      bindingColumn: String(formData.get("bindingColumn") ?? ""),
      validationRules: String(formData.get("validationRules") ?? ""),
      conditionalLogic: String(formData.get("conditionalLogic") ?? ""),
      options: String(formData.get("options") ?? ""),
      isRequired: checkboxToBoolean(formData.get("isRequired")),
      sortOrder: Number(formData.get("sortOrder") ?? 100),
      isActive: checkboxToBoolean(formData.get("isActive")),
    });

    const optionList = parseOptionsList(parsed.options);
    const validationRules = parseJsonObject(parsed.validationRules);
    const conditionalLogic = parseJsonObject(parsed.conditionalLogic);
    const supabase = await createSupabaseServerClient();
    const { data: current } = await supabase
      .from("form_template_fields")
      .select("id, label, field_type, placeholder, help_text, section_key, binding_source, binding_column, validation_rules, conditional_logic, options, is_required, sort_order, is_active")
      .eq("id", parsed.id)
      .single();

    const { error } = await supabase
      .from("form_template_fields")
      .update({
        label: parsed.label,
        field_type: parsed.fieldType,
        placeholder: cleanOptional(parsed.placeholder),
        help_text: cleanOptional(parsed.helpText),
        section_key: parsed.sectionKey,
        binding_source: parsed.bindingSource,
        binding_column: cleanOptional(parsed.bindingColumn),
        validation_rules: validationRules,
        conditional_logic: conditionalLogic,
        options: optionList,
        is_required: parsed.isRequired,
        sort_order: parsed.sortOrder,
        is_active: parsed.isActive,
      })
      .eq("id", parsed.id);

    if (error) {
      throw new Error(error.message);
    }

    await writeAdminAudit(supabase, {
      targetType: "form_template_field",
      targetId: parsed.id,
      action: "form_field_updated",
      summary: `Formulierveld bijgewerkt: ${parsed.label}`,
      beforeState: current ?? null,
      afterState: { ...parsed, options: optionList, validationRules, conditionalLogic },
      changedFields: [
        "label",
        "field_type",
        "placeholder",
        "help_text",
        "section_key",
        "binding_source",
        "binding_column",
        "validation_rules",
        "conditional_logic",
        "options",
        "is_required",
        "sort_order",
        "is_active",
      ],
      adminArea: "forms",
      updatedBy: session.userId,
    });

    redirect(buildFeedbackUrl("/beheer/rapporten-formulieren", "success", "Formulierveld bijgewerkt."));
  } catch (error) {
    redirect(
      buildFeedbackUrl(
        "/beheer/rapporten-formulieren",
        "error",
        error instanceof Error ? error.message : "Formulierveld kon niet worden bijgewerkt.",
      ),
    );
  }
}

export async function deleteFormFieldAction(formData: FormData) {
  try {
    const session = await requirePermission("config.forms.manage");
    const fieldId = String(formData.get("id") ?? "");
    if (!fieldId) throw new Error("Veld ontbreekt.");

    const supabase = await createSupabaseServerClient();
    const { data: current } = await supabase
      .from("form_template_fields")
      .select("id, label")
      .eq("id", fieldId)
      .single();

    if (!current) {
      throw new Error("Veld niet gevonden.");
    }

    const { error } = await supabase.from("form_template_fields").delete().eq("id", fieldId);
    if (error) {
      throw new Error(error.message);
    }

    await writeAdminAudit(supabase, {
      targetType: "form_template_field",
      targetId: fieldId,
      action: "form_field_deleted",
      summary: `Formulierveld verwijderd: ${current.label}`,
      beforeState: current,
      changedFields: ["id"],
      adminArea: "forms",
      updatedBy: session.userId,
    });

    redirect(buildFeedbackUrl("/beheer/rapporten-formulieren", "success", "Formulierveld verwijderd."));
  } catch (error) {
    redirect(
      buildFeedbackUrl(
        "/beheer/rapporten-formulieren",
        "error",
        error instanceof Error ? error.message : "Formulierveld kon niet worden aangemaakt.",
      ),
    );
  }
}

export async function moveFormFieldAction(formData: FormData) {
  try {
    const session = await requirePermission("config.forms.manage");
    const parsed = formFieldReorderSchema.parse({
      fieldId: String(formData.get("fieldId") ?? ""),
      direction: String(formData.get("direction") ?? "up"),
    });
    const supabase = await createSupabaseServerClient();

    const { data: current, error: currentError } = await supabase
      .from("form_template_fields")
      .select("id, template_id, section_key, sort_order, label")
      .eq("id", parsed.fieldId)
      .single();
    if (currentError || !current) throw new Error("Veld niet gevonden.");

    const orderAscending = parsed.direction !== "up";
    const neighborQueryBase = supabase
      .from("form_template_fields")
      .select("id, sort_order, label")
      .eq("template_id", current.template_id)
      .eq("section_key", current.section_key);
    const neighborQuery =
      parsed.direction === "up"
        ? neighborQueryBase.lt("sort_order", current.sort_order)
        : neighborQueryBase.gt("sort_order", current.sort_order);
    const { data: neighbor, error: neighborError } = await neighborQuery
      .order("sort_order", { ascending: orderAscending })
      .limit(1)
      .maybeSingle();
    if (neighborError) throw new Error(neighborError.message);
    if (!neighbor) {
      redirect(buildFeedbackUrl("/beheer/rapporten-formulieren", "success", "Geen verschuiving nodig."));
    }

    const { error: swapA } = await supabase
      .from("form_template_fields")
      .update({ sort_order: neighbor.sort_order })
      .eq("id", current.id);
    if (swapA) throw new Error(swapA.message);
    const { error: swapB } = await supabase
      .from("form_template_fields")
      .update({ sort_order: current.sort_order })
      .eq("id", neighbor.id);
    if (swapB) throw new Error(swapB.message);

    await writeAdminAudit(supabase, {
      targetType: "form_template_field",
      targetId: current.id,
      action: "form_field_reordered",
      summary: `Formulierveld verschoven (${parsed.direction}): ${current.label}`,
      beforeState: { fieldId: current.id, sortOrder: current.sort_order },
      afterState: { fieldId: current.id, sortOrder: neighbor.sort_order },
      changedFields: ["sort_order"],
      adminArea: "forms",
      updatedBy: session.userId,
    });

    redirect(buildFeedbackUrl("/beheer/rapporten-formulieren", "success", "Veldvolgorde aangepast."));
  } catch (error) {
    redirect(
      buildFeedbackUrl(
        "/beheer/rapporten-formulieren",
        "error",
        error instanceof Error ? error.message : "Veldvolgorde kon niet worden aangepast.",
      ),
    );
  }
}

export async function renameFormSectionAction(formData: FormData) {
  try {
    const session = await requirePermission("config.forms.manage");
    const parsed = formSectionRenameSchema.parse({
      templateId: String(formData.get("templateId") ?? ""),
      fromSectionKey: String(formData.get("fromSectionKey") ?? ""),
      toSectionKey: String(formData.get("toSectionKey") ?? ""),
    });
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("form_template_fields")
      .update({ section_key: parsed.toSectionKey })
      .eq("template_id", parsed.templateId)
      .eq("section_key", parsed.fromSectionKey);
    if (error) throw new Error(error.message);

    await writeAdminAudit(supabase, {
      targetType: "form_template",
      targetId: parsed.templateId,
      action: "form_section_renamed",
      summary: `Sectie hernoemd: ${parsed.fromSectionKey} -> ${parsed.toSectionKey}`,
      afterState: parsed,
      changedFields: ["section_key"],
      adminArea: "forms",
      updatedBy: session.userId,
    });
    redirect(buildFeedbackUrl("/beheer/rapporten-formulieren", "success", "Sectie hernoemd."));
  } catch (error) {
    redirect(
      buildFeedbackUrl(
        "/beheer/rapporten-formulieren",
        "error",
        error instanceof Error ? error.message : "Sectie kon niet worden hernoemd.",
      ),
    );
  }
}

export async function deleteFormSectionAction(formData: FormData) {
  try {
    const session = await requirePermission("config.forms.manage");
    const parsed = formSectionDeleteSchema.parse({
      templateId: String(formData.get("templateId") ?? ""),
      sectionKey: String(formData.get("sectionKey") ?? ""),
      targetSectionKey: String(formData.get("targetSectionKey") ?? "general"),
    });
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("form_template_fields")
      .update({ section_key: parsed.targetSectionKey })
      .eq("template_id", parsed.templateId)
      .eq("section_key", parsed.sectionKey);
    if (error) throw new Error(error.message);

    await writeAdminAudit(supabase, {
      targetType: "form_template",
      targetId: parsed.templateId,
      action: "form_section_deleted",
      summary: `Sectie samengevoegd: ${parsed.sectionKey} -> ${parsed.targetSectionKey}`,
      afterState: parsed,
      changedFields: ["section_key"],
      adminArea: "forms",
      updatedBy: session.userId,
    });
    redirect(buildFeedbackUrl("/beheer/rapporten-formulieren", "success", "Sectie verwerkt."));
  } catch (error) {
    redirect(
      buildFeedbackUrl(
        "/beheer/rapporten-formulieren",
        "error",
        error instanceof Error ? error.message : "Sectie kon niet verwerkt worden.",
      ),
    );
  }
}

export async function createManagedTenantAction(formData: FormData) {
  try {
    const session = await requireTenantAdminSession();
    if (!isGlobalConfigAdmin(session)) {
      throw new Error("Alleen globale beheerders kunnen nieuwe tenants aanmaken.");
    }
    const parsed = tenantCreateSchema.parse({
      code: String(formData.get("code") ?? ""),
      label: String(formData.get("label") ?? ""),
    });
    const supabase = await createSupabaseServerClient();

    const { data: inserted, error } = await supabase
      .from("tenants")
      .insert({
        code: parsed.code,
        label: parsed.label,
        is_active: true,
        is_default: false,
      })
      .select("id, code, label, is_active, is_default")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    await writeAdminAudit(supabase, {
      targetType: "tenant",
      targetId: inserted?.id ?? null,
      action: "tenant_created",
      summary: `Tenant aangemaakt: ${parsed.label}`,
      afterState: inserted ?? parsed,
      changedFields: ["code", "label", "is_active", "is_default"],
      adminArea: "tenant_operations",
      updatedBy: session.userId,
    });

    redirect(buildFeedbackUrl("/beheer", "success", "Tenant aangemaakt."));
  } catch (error) {
    redirect(
      buildFeedbackUrl(
        "/beheer",
        "error",
        error instanceof Error ? error.message : "Tenant kon niet worden aangemaakt.",
      ),
    );
  }
}

export async function toggleManagedTenantActiveAction(formData: FormData) {
  try {
    const session = await requireTenantAdminSession();
    const parsed = tenantToggleSchema.parse({
      tenantId: String(formData.get("tenantId") ?? ""),
      nextActive: checkboxToBoolean(formData.get("nextActive")),
      reason: String(formData.get("reason") ?? ""),
    });
    const supabase = await createSupabaseServerClient();

    const { data: current, error: currentError } = await supabase
      .from("tenants")
      .select("id, code, label, is_active, is_default")
      .eq("id", parsed.tenantId)
      .single();
    if (currentError || !current) {
      throw new Error("Tenant niet gevonden.");
    }
    await assertTenantScopedAccess(supabase, session, current.id);
    if (current.is_default && !parsed.nextActive) {
      throw new Error("Default tenant kan niet gedeactiveerd worden.");
    }

    if (!isGlobalConfigAdmin(session)) {
      await createTenantChangeRequest(supabase, {
        session,
        tenantId: parsed.tenantId,
        requestType: "tenant_status_toggle",
        reason: parsed.reason ?? null,
        payload: {
          tenantId: parsed.tenantId,
          nextActive: parsed.nextActive,
          before: current,
        },
      });
      redirect(buildFeedbackUrl("/beheer", "success", "Tenantstatus wijziging ter goedkeuring ingediend."));
    }

    const { data: updated, error } = await supabase
      .from("tenants")
      .update({ is_active: parsed.nextActive })
      .eq("id", parsed.tenantId)
      .select("id, code, label, is_active, is_default")
      .single();
    if (error) {
      throw new Error(error.message);
    }

    await writeAdminAudit(supabase, {
      targetType: "tenant",
      targetId: parsed.tenantId,
      action: "tenant_status_updated",
      summary: `Tenant ${updated?.label ?? current.label} ${parsed.nextActive ? "geactiveerd" : "gedeactiveerd"}.`,
      beforeState: current,
      afterState: updated ?? { ...current, is_active: parsed.nextActive },
      changedFields: ["is_active"],
      adminArea: "tenant_operations",
      updatedBy: session.userId,
    });

    redirect(buildFeedbackUrl("/beheer", "success", "Tenantstatus bijgewerkt."));
  } catch (error) {
    redirect(
      buildFeedbackUrl(
        "/beheer",
        "error",
        error instanceof Error ? error.message : "Tenantstatus kon niet worden bijgewerkt.",
      ),
    );
  }
}

export async function updateManagedTenantAction(formData: FormData) {
  try {
    const session = await requireTenantAdminSession();
    const parsed = tenantUpdateSchema.parse({
      tenantId: String(formData.get("tenantId") ?? ""),
      code: String(formData.get("code") ?? ""),
      label: String(formData.get("label") ?? ""),
      reason: String(formData.get("reason") ?? ""),
    });
    const supabase = await createSupabaseServerClient();

    const { data: current, error: currentError } = await supabase
      .from("tenants")
      .select("id, code, label, is_active, is_default")
      .eq("id", parsed.tenantId)
      .single();
    if (currentError || !current) {
      throw new Error("Tenant niet gevonden.");
    }
    await assertTenantScopedAccess(supabase, session, current.id);
    if (current.is_default && parsed.code !== current.code) {
      throw new Error("Default tenant code kan niet aangepast worden.");
    }

    if (!isGlobalConfigAdmin(session)) {
      await createTenantChangeRequest(supabase, {
        session,
        tenantId: parsed.tenantId,
        requestType: "tenant_update",
        reason: parsed.reason ?? null,
        payload: {
          tenantId: parsed.tenantId,
          code: parsed.code,
          label: parsed.label,
          before: current,
        },
      });
      redirect(buildFeedbackUrl("/beheer", "success", "Tenant update ter goedkeuring ingediend."));
    }

    const { data: updated, error } = await supabase
      .from("tenants")
      .update({ code: parsed.code, label: parsed.label })
      .eq("id", parsed.tenantId)
      .select("id, code, label, is_active, is_default")
      .single();
    if (error) {
      throw new Error(error.message);
    }

    await writeAdminAudit(supabase, {
      targetType: "tenant",
      targetId: parsed.tenantId,
      action: "tenant_updated",
      summary: `Tenant bijgewerkt: ${updated?.label ?? parsed.label}`,
      beforeState: current,
      afterState: updated ?? parsed,
      changedFields: ["code", "label"],
      adminArea: "tenant_operations",
      updatedBy: session.userId,
    });

    redirect(buildFeedbackUrl("/beheer", "success", "Tenant bijgewerkt."));
  } catch (error) {
    redirect(
      buildFeedbackUrl(
        "/beheer",
        "error",
        error instanceof Error ? error.message : "Tenant kon niet worden bijgewerkt.",
      ),
    );
  }
}

export async function approveTenantChangeRequestAction(formData: FormData) {
  try {
    const session = await requireTenantApprovalSession();
    const parsed = tenantApprovalSchema.parse({
      requestId: String(formData.get("requestId") ?? ""),
      reason: String(formData.get("reason") ?? ""),
    });
    const supabase = await createSupabaseServerClient();
    const { data: request, error: requestError } = await supabase
      .from("tenant_change_requests")
      .select("id, tenant_id, request_type, status, payload, requested_by")
      .eq("id", parsed.requestId)
      .single();
    if (requestError || !request) throw new Error("Approval request niet gevonden.");
    if (request.status !== "pending") throw new Error("Alleen pending requests kunnen goedgekeurd worden.");
    if (request.requested_by === session.userId) {
      throw new Error("Eigen aanvraag kan niet door dezelfde gebruiker goedgekeurd worden.");
    }

    const payload =
      request.payload && typeof request.payload === "object" && !Array.isArray(request.payload)
        ? (request.payload as Record<string, unknown>)
        : {};

    if (request.request_type === "tenant_status_toggle") {
      const nextActive = Boolean(payload.nextActive);
      const { error } = await supabase
        .from("tenants")
        .update({ is_active: nextActive })
        .eq("id", request.tenant_id);
      if (error) throw new Error(error.message);
    } else if (request.request_type === "tenant_update") {
      const code = String(payload.code ?? "");
      const label = String(payload.label ?? "");
      if (!code || !label) throw new Error("Ongeldige tenant update payload.");
      const { error } = await supabase
        .from("tenants")
        .update({ code, label })
        .eq("id", request.tenant_id);
      if (error) throw new Error(error.message);
    }

    const { error: updateError } = await supabase
      .from("tenant_change_requests")
      .update({
        status: "executed",
        approved_by: session.userId,
        approved_at: new Date().toISOString(),
        executed_by: session.userId,
        executed_at: new Date().toISOString(),
        execution_error: null,
        reason: cleanOptional(parsed.reason) ?? null,
      })
      .eq("id", request.id);
    if (updateError) throw new Error(updateError.message);

    await writeAdminAudit(supabase, {
      targetType: "tenant_change_request",
      targetId: request.id,
      action: "tenant_change_approved_executed",
      summary: `Tenantwijzigingsverzoek goedgekeurd en uitgevoerd (${request.request_type}).`,
      afterState: {
        requestType: request.request_type,
        tenantId: request.tenant_id,
        approvalReason: cleanOptional(parsed.reason),
      },
      changedFields: ["status", "approved_by", "approved_at", "executed_by", "executed_at"],
      adminArea: "tenant_approvals",
      updatedBy: session.userId,
    });

    redirect(buildFeedbackUrl("/beheer", "success", "Tenantwijzigingsverzoek goedgekeurd en uitgevoerd."));
  } catch (error) {
    redirect(
      buildFeedbackUrl(
        "/beheer",
        "error",
        error instanceof Error ? error.message : "Tenantwijzigingsverzoek kon niet worden goedgekeurd.",
      ),
    );
  }
}

export async function rejectTenantChangeRequestAction(formData: FormData) {
  try {
    const session = await requireTenantApprovalSession();
    const parsed = tenantRejectSchema.parse({
      requestId: String(formData.get("requestId") ?? ""),
      reason: String(formData.get("reason") ?? ""),
    });
    const supabase = await createSupabaseServerClient();
    const { data: request, error: requestError } = await supabase
      .from("tenant_change_requests")
      .select("id, request_type, status, requested_by")
      .eq("id", parsed.requestId)
      .single();
    if (requestError || !request) throw new Error("Approval request niet gevonden.");
    if (request.status !== "pending") throw new Error("Alleen pending requests kunnen afgewezen worden.");
    if (request.requested_by === session.userId) {
      throw new Error("Eigen aanvraag kan niet door dezelfde gebruiker afgewezen worden.");
    }

    const { error } = await supabase
      .from("tenant_change_requests")
      .update({
        status: "rejected",
        rejected_by: session.userId,
        rejected_at: new Date().toISOString(),
        reason: parsed.reason,
      })
      .eq("id", request.id);
    if (error) throw new Error(error.message);

    await writeAdminAudit(supabase, {
      targetType: "tenant_change_request",
      targetId: request.id,
      action: "tenant_change_rejected",
      summary: `Tenantwijzigingsverzoek afgewezen (${request.request_type}).`,
      afterState: { reason: parsed.reason },
      changedFields: ["status", "rejected_by", "rejected_at", "reason"],
      adminArea: "tenant_approvals",
      updatedBy: session.userId,
    });

    redirect(buildFeedbackUrl("/beheer", "success", "Tenantwijzigingsverzoek afgewezen."));
  } catch (error) {
    redirect(
      buildFeedbackUrl(
        "/beheer",
        "error",
        error instanceof Error ? error.message : "Tenantwijzigingsverzoek kon niet worden afgewezen.",
      ),
    );
  }
}

export async function requestDatabaseRestartAction() {
  try {
    const session = await requirePermission("config.database.restart");
    const supabase = await createSupabaseServerClient();
    const healthProbe = await supabase
      .from("audit_logs")
      .select("id", { head: true, count: "exact" });

    await writeAdminAudit(supabase, {
      targetType: "database_control",
      action: "database_restart_requested",
      summary: "Database herstartverzoek geregistreerd via beheerpagina.",
      afterState: {
        probeOk: !healthProbe.error,
        probeMessage: healthProbe.error?.message ?? "health-check geslaagd",
      },
      changedFields: ["database_restart_requested"],
      adminArea: "infrastructure",
      updatedBy: session.userId,
    });

    redirect(
      buildFeedbackUrl(
        "/beheer",
        "success",
        "Herstartverzoek gelogd. Volledige Supabase herstart gebeurt extern; app-healthcheck is vernieuwd.",
      ),
    );
  } catch (error) {
    redirect(
      buildFeedbackUrl(
        "/beheer",
        "error",
        error instanceof Error ? error.message : "Herstartverzoek kon niet worden geregistreerd.",
      ),
    );
  }
}

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { hasSupabaseEnv, isDemoAuthEnabled } from "@/lib/env";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";

export const ALL_PERMISSION_CODES = [
  "patients.read",
  "patients.create",
  "patients.update",
  "patients.soft_delete",
  "patients.read_deleted",
  "cases.read",
  "cases.create",
  "cases.update",
  "cases.status.update",
  "reports.read",
  "reports.create",
  "reports.update",
  "reports.update_own",
  "reports.trauma.manage",
  "reports.opname.manage",
  "meetings.read",
  "meetings.create",
  "meetings.update",
  "minutes.read",
  "minutes.update",
  "handbook.read",
  "handbook.manage",
  "audit.read",
  "staff.read_basic",
  "staff.read_sensitive",
  "staff.update",
  "config.panel.read",
  "config.ranks.manage",
  "config.report_types.manage",
  "config.forms.manage",
  "config.badges.manage",
  "config.patient_statuses.manage",
  "config.users.manage",
  "config.tenants.manage",
  "config.tenant_approvals.manage",
  "config.database.read",
  "config.database.restart",
] as const;

export type AppPermission = (typeof ALL_PERMISSION_CODES)[number];

export type AppSession = {
  mode: "demo" | "supabase";
  userId: string;
  email: string;
  fullName: string;
  citizenId: string;
  rankLabel: string;
  rankCode?: string | null;
  profileType?: string;
  specializationCodes?: string[];
  permissions: AppPermission[];
};

const DEMO_COOKIE = "ems_demo_auth";
export const PROFILE_ACTIVATION_ERROR =
  "Je profiel is nog niet geactiveerd. Contacteer de directie of administratie.";

function isActivatedCitizenId(citizenId: string) {
  const normalized = citizenId.trim().toLowerCase();
  if (!normalized) return false;
  if (normalized === "onbekend") return false;
  if (normalized.startsWith("pending-")) return false;
  return true;
}

export async function getAppSession(): Promise<AppSession | null> {
  const cookieStore = await cookies();

  if (isDemoAuthEnabled()) {
    const demoCookie = cookieStore.get(DEMO_COOKIE)?.value;
    if (demoCookie === "1") {
      return {
        mode: "demo",
        userId: "demo-user",
        email: "demo@ems.local",
        fullName: "Demo EMS gebruiker",
        citizenId: "EMS-001",
        rankLabel: "Leiding",
        rankCode: "rank_1",
        profileType: "medical_staff",
        specializationCodes: [],
        permissions: [...ALL_PERMISSION_CODES],
      };
    }
    return null;
  }

  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [
    { data: profile },
    { data: privateDetails },
    { data: directPermissions },
    { data: profileSpecializations },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, profile_type, rank_id, ranks(code, name)")
      .eq("id", user.id)
      .single(),
    supabase
      .from("profile_private_details")
      .select("email, citizenid")
      .eq("profile_id", user.id)
      .single(),
    supabase
      .from("profile_permissions")
      .select("permissions(code)")
      .eq("profile_id", user.id),
    supabase
      .from("profile_specializations")
      .select("specialization_id, level, specializations(code)")
      .eq("profile_id", user.id),
  ]);

  const specializationIds = (profileSpecializations ?? [])
    .map((entry) => entry.specialization_id)
    .filter((value): value is string => Boolean(value));
  const { data: specializationPermissions } = specializationIds.length
    ? await supabase
        .from("specialization_permissions")
        .select("specialization_id, minimum_level, permissions(code)")
        .in("specialization_id", specializationIds)
    : {
        data: [] as Array<{
          specialization_id: string;
          minimum_level: "geen" | "basisbevoegd" | "bevoegd" | "instructeur";
          permissions: { code?: string } | { code?: string }[] | null;
        }>,
      };

  const rankId = profile?.rank_id ?? null;
  const { data: rankPermissions } = rankId
    ? await supabase
        .from("rank_permissions")
        .select("permissions(code)")
        .eq("rank_id", rankId)
    : { data: [] as Array<{ permissions: { code: string } | { code: string }[] | null }> };

  const permissionCodes = new Set<string>();
  const profileRecord = profile as
    | {
        full_name?: string;
        profile_type?: string;
        ranks?: { code?: string; name?: string } | { code?: string; name?: string }[] | null;
      }
    | null;
  const rankRelation = profileRecord?.ranks;
  const rankRecord = Array.isArray(rankRelation) ? rankRelation[0] : rankRelation;

  for (const entry of directPermissions ?? []) {
    const permission = entry.permissions as { code?: string } | { code?: string }[] | null;
    if (Array.isArray(permission)) {
      if (permission[0]?.code) {
        permissionCodes.add(permission[0].code);
      }
    } else if (permission?.code) {
      permissionCodes.add(permission.code);
    }
  }

  for (const entry of rankPermissions ?? []) {
    const permission = entry.permissions as { code?: string } | { code?: string }[] | null;
    if (Array.isArray(permission)) {
      if (permission[0]?.code) {
        permissionCodes.add(permission[0].code);
      }
    } else if (permission?.code) {
      permissionCodes.add(permission.code);
    }
  }

  const levelValue: Record<string, number> = {
    geen: 0,
    basisbevoegd: 1,
    bevoegd: 2,
    instructeur: 3,
  };
  const specializationLevelById = new Map<string, number>();
  for (const entry of profileSpecializations ?? []) {
    const level = String(entry.level ?? "geen");
    specializationLevelById.set(entry.specialization_id, levelValue[level] ?? 0);
  }
  for (const entry of specializationPermissions ?? []) {
    const actorLevel = specializationLevelById.get(entry.specialization_id) ?? 0;
    const minimumLevel = levelValue[String(entry.minimum_level ?? "instructeur")] ?? 99;
    if (actorLevel < minimumLevel) {
      continue;
    }
    const permission = entry.permissions as { code?: string } | { code?: string }[] | null;
    if (Array.isArray(permission)) {
      if (permission[0]?.code) {
        permissionCodes.add(permission[0].code);
      }
    } else if (permission?.code) {
      permissionCodes.add(permission.code);
    }
  }

  const resolvedCitizenId =
    privateDetails?.citizenid ?? (user.user_metadata.citizenid as string | undefined) ?? "";
  const hasActivatedProfile = Boolean(
    profileRecord?.full_name && isActivatedCitizenId(resolvedCitizenId),
  );
  if (!hasActivatedProfile) {
    return null;
  }

  return {
    mode: "supabase",
    userId: user.id,
    email: privateDetails?.email ?? user.email ?? "",
    fullName:
      profileRecord?.full_name ??
      (user.user_metadata.full_name as string | undefined) ??
      "EMS gebruiker",
    citizenId: resolvedCitizenId,
    rankLabel: rankRecord?.name ?? (user.user_metadata.rank_label as string | undefined) ?? "EMS",
    rankCode: rankRecord?.code ?? null,
    profileType: profileRecord?.profile_type ?? "medical_staff",
    specializationCodes: (profileSpecializations ?? [])
      .map((entry) => {
        const relation = entry.specializations as { code?: string } | { code?: string }[] | null;
        const item = Array.isArray(relation) ? relation[0] : relation;
        return item?.code ?? "";
      })
      .filter(Boolean),
    permissions: [...permissionCodes].filter((code): code is AppPermission =>
      ALL_PERMISSION_CODES.includes(code as AppPermission),
    ),
  };
}

export async function requireAppSession() {
  const session = await getAppSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

export function hasPermission(session: AppSession, permission: AppPermission) {
  return session.permissions.includes(permission);
}

export function hasAnyPermission(session: AppSession, permissions: AppPermission[]) {
  return permissions.some((permission) => hasPermission(session, permission));
}

export async function requirePermission(permission: AppPermission) {
  const session = await requireAppSession();
  if (!hasPermission(session, permission)) {
    redirect("/");
  }
  return session;
}

export async function requireAnyPermission(permissions: AppPermission[]) {
  const session = await requireAppSession();
  if (!hasAnyPermission(session, permissions)) {
    redirect("/");
  }
  return session;
}

export async function requireReportEditAccess(params: {
  patientId: string;
  reportId: string;
  reportType: "trauma" | "opname";
  forbiddenRedirectPath: string;
}) {
  const session = await requireAnyPermission(["reports.update", "reports.update_own"]);
  const specializationPermission =
    params.reportType === "trauma" ? "reports.trauma.manage" : "reports.opname.manage";
  if (!hasPermission(session, specializationPermission) && !hasPermission(session, "config.database.read")) {
    redirect(params.forbiddenRedirectPath);
  }
  if (hasPermission(session, "reports.update")) {
    return session;
  }

  const supabase = await createSupabaseServerClient();
  const { data: report, error } = await supabase
    .from("medical_reports")
    .select("author_profile_id")
    .eq("id", params.reportId)
    .eq("patient_id", params.patientId)
    .eq("report_type_code", params.reportType)
    .single();

  if (error || !report || report.author_profile_id !== session.userId) {
    redirect(params.forbiddenRedirectPath);
  }

  return session;
}

export async function requireStaffDetailAccess(profileId: string) {
  const session = await requireAppSession();
  if (session.userId === profileId) {
    return session;
  }

  if (!hasPermission(session, "staff.read_sensitive")) {
    redirect("/personeel");
  }

  return session;
}

export async function createDemoSession() {
  const cookieStore = await cookies();
  cookieStore.set(DEMO_COOKIE, "1", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearDemoSession() {
  const cookieStore = await cookies();
  cookieStore.set(DEMO_COOKIE, "", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  });
}

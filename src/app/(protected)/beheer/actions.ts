"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import { buildFeedbackUrl } from "@/lib/feedback";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";

const userSchema = z.object({
  userId: z.string().trim().optional(),
  fullName: z.string().trim().min(3, "Naam is verplicht."),
  email: z.string().trim().email("E-mailadres is ongeldig."),
  password: z.string().trim().min(8, "Wachtwoord moet minstens 8 tekens bevatten.").optional(),
  citizenId: z.string().trim().min(1, "Citizenid is verplicht."),
  profileType: z.enum(["medical_staff", "administratie", "directie_assistent"]),
  rankId: z.string().trim().optional(),
  callSign: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  employmentStatus: z.string().trim().min(1, "Status is verplicht."),
  joinedAt: z.string().trim().optional(),
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
  });
}

export async function createManagedUserAction(formData: FormData) {
  try {
    const session = await requirePermission("config.database.read");
    const parsed = parseUserPayload(formData);

    if (!parsed.password) {
      throw new Error("Een wachtwoord is verplicht bij het aanmaken van een gebruiker.");
    }

    const adminClient = createAdminClient();
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
        joined_at: cleanOptional(parsed.joinedAt),
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
    const session = await requirePermission("config.database.read");
    const parsed = parseUserPayload(formData);

    if (!parsed.userId) {
      throw new Error("Gebruiker ontbreekt.");
    }

    const adminClient = createAdminClient();
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
    await requirePermission("config.database.read");
    const parsed = permissionsSchema.parse({
      profileId: String(formData.get("profileId") ?? ""),
      permissionIds: formData.getAll("permissionIds").map(String),
    });

    const supabase = await createSupabaseServerClient();
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
    await requirePermission("config.database.read");
    const parsed = rankPermissionSchema.parse({
      rankId: String(formData.get("rankId") ?? ""),
      permissionIds: formData.getAll("permissionIds").map(String),
    });

    const supabase = await createSupabaseServerClient();
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
    await requirePermission("config.report_types.manage");
    const parsed = reportTypeCreateSchema.parse({
      code: String(formData.get("code") ?? ""),
      label: String(formData.get("label") ?? ""),
      description: String(formData.get("description") ?? ""),
      colorHex: String(formData.get("colorHex") ?? ""),
      sortOrder: Number(formData.get("sortOrder") ?? 100),
      isActive: checkboxToBoolean(formData.get("isActive")),
    });

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("report_types").insert({
      code: parsed.code,
      label: parsed.label,
      description: cleanOptional(parsed.description),
      color_hex: cleanOptional(parsed.colorHex),
      sort_order: parsed.sortOrder,
      is_active: parsed.isActive,
      is_system: false,
    });

    if (error) {
      throw new Error(error.message);
    }

    redirect(buildFeedbackUrl("/beheer", "success", "Rapporttype aangemaakt."));
  } catch (error) {
    redirect(buildFeedbackUrl("/beheer", "error", error instanceof Error ? error.message : "Rapporttype kon niet worden aangemaakt."));
  }
}

export async function updateReportTypeAction(formData: FormData) {
  try {
    await requirePermission("config.report_types.manage");
    const parsed = reportTypeUpdateSchema.parse({
      id: String(formData.get("id") ?? ""),
      label: String(formData.get("label") ?? ""),
      description: String(formData.get("description") ?? ""),
      colorHex: String(formData.get("colorHex") ?? ""),
      sortOrder: Number(formData.get("sortOrder") ?? 100),
      isActive: checkboxToBoolean(formData.get("isActive")),
    });

    const supabase = await createSupabaseServerClient();
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

    redirect(buildFeedbackUrl("/beheer", "success", "Rapporttype bijgewerkt."));
  } catch (error) {
    redirect(buildFeedbackUrl("/beheer", "error", error instanceof Error ? error.message : "Rapporttype kon niet worden bijgewerkt."));
  }
}

export async function createWarningBadgeAction(formData: FormData) {
  try {
    await requirePermission("config.badges.manage");
    const parsed = badgeCreateSchema.parse({
      code: String(formData.get("code") ?? ""),
      label: String(formData.get("label") ?? ""),
      colorHex: String(formData.get("colorHex") ?? ""),
      sortOrder: Number(formData.get("sortOrder") ?? 100),
      isActive: checkboxToBoolean(formData.get("isActive")),
    });

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("warning_badges").insert({
      code: parsed.code,
      label: parsed.label,
      color_hex: cleanOptional(parsed.colorHex),
      sort_order: parsed.sortOrder,
      is_active: parsed.isActive,
      is_system: false,
    });

    if (error) {
      throw new Error(error.message);
    }

    redirect(buildFeedbackUrl("/beheer", "success", "Badge aangemaakt."));
  } catch (error) {
    redirect(buildFeedbackUrl("/beheer", "error", error instanceof Error ? error.message : "Badge kon niet worden aangemaakt."));
  }
}

export async function updateWarningBadgeAction(formData: FormData) {
  try {
    await requirePermission("config.badges.manage");
    const parsed = badgeUpdateSchema.parse({
      id: String(formData.get("id") ?? ""),
      label: String(formData.get("label") ?? ""),
      colorHex: String(formData.get("colorHex") ?? ""),
      sortOrder: Number(formData.get("sortOrder") ?? 100),
      isActive: checkboxToBoolean(formData.get("isActive")),
    });

    const supabase = await createSupabaseServerClient();
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

    redirect(buildFeedbackUrl("/beheer", "success", "Badge bijgewerkt."));
  } catch (error) {
    redirect(buildFeedbackUrl("/beheer", "error", error instanceof Error ? error.message : "Badge kon niet worden bijgewerkt."));
  }
}

export async function createPatientStatusAction(formData: FormData) {
  try {
    await requirePermission("config.patient_statuses.manage");
    const parsed = patientStatusCreateSchema.parse({
      code: String(formData.get("code") ?? ""),
      label: String(formData.get("label") ?? ""),
      colorHex: String(formData.get("colorHex") ?? ""),
      sortOrder: Number(formData.get("sortOrder") ?? 100),
      isActive: checkboxToBoolean(formData.get("isActive")),
    });

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("patient_statuses").insert({
      code: parsed.code,
      label: parsed.label,
      color_hex: cleanOptional(parsed.colorHex),
      sort_order: parsed.sortOrder,
      is_active: parsed.isActive,
      is_system: false,
    });

    if (error) {
      throw new Error(error.message);
    }

    redirect(buildFeedbackUrl("/beheer", "success", "Patiëntstatus aangemaakt."));
  } catch (error) {
    redirect(buildFeedbackUrl("/beheer", "error", error instanceof Error ? error.message : "Patiëntstatus kon niet worden aangemaakt."));
  }
}

export async function updatePatientStatusAction(formData: FormData) {
  try {
    await requirePermission("config.patient_statuses.manage");
    const parsed = patientStatusUpdateSchema.parse({
      id: String(formData.get("id") ?? ""),
      label: String(formData.get("label") ?? ""),
      colorHex: String(formData.get("colorHex") ?? ""),
      sortOrder: Number(formData.get("sortOrder") ?? 100),
      isActive: checkboxToBoolean(formData.get("isActive")),
    });

    const supabase = await createSupabaseServerClient();
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

    redirect(buildFeedbackUrl("/beheer", "success", "Patiëntstatus bijgewerkt."));
  } catch (error) {
    redirect(buildFeedbackUrl("/beheer", "error", error instanceof Error ? error.message : "Patiëntstatus kon niet worden bijgewerkt."));
  }
}

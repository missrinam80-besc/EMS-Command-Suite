import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  addDemoCase,
  addDemoPatient,
  addDemoPatientAuditLog,
  getDemoPatientAuditLogs,
  getDemoPatients,
  removeDemoPatient,
  updateDemoCase,
  updateDemoPatient,
} from "@/lib/demo-store";
import { writeAuditLog } from "@/lib/audit";
import { shouldUseDemoData } from "@/lib/env";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import type { Patient, PatientAuditLog, PatientCase } from "@/types/domain";

export type PatientWorkspaceRow = Patient & {
  reportCount: number;
  latestReportAt: string | null;
};

export type PatientDetail = PatientWorkspaceRow & {
  cases: PatientCase[];
};

export type PatientAuditLogRow = PatientAuditLog & {
  patientName: string;
  patientCitizenId: string;
};

export type PatientManagementSnapshot = {
  patients: Patient[];
  cases: PatientCase[];
};

export const patientCaseProfileSchema = z.object({
  patientId: z.string().trim().min(1, "Patient ontbreekt."),
  caseId: z.string().trim().min(1, "Case ontbreekt."),
  title: z.string().trim().min(3, "Case-titel moet minstens 3 tekens bevatten."),
  summary: z.string().trim().optional(),
  status: z.enum(["open", "afgesloten", "gearchiveerd", "in_onderzoek", "in_wacht"]),
});

export async function getPatientAuditLogs(patientId: string): Promise<PatientAuditLog[]> {
  if (shouldUseDemoData()) {
    return getDemoPatientAuditLogs()
      .filter((entry) => entry.patientId === patientId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  const rows = await getAllPatientAuditLogs();
  return rows
    .filter((entry) => entry.patientId === patientId)
    .map((entry) => ({
      id: entry.id,
      patientId: entry.patientId,
      action: entry.action,
      actorProfileId: entry.actorProfileId,
      actorName: entry.actorName,
      summary: entry.summary,
      createdAt: entry.createdAt,
      details: entry.details,
    }));
}

export async function getAllPatientAuditLogs(): Promise<PatientAuditLogRow[]> {
  if (shouldUseDemoData()) {
    const patients = getDemoPatients();
    return getDemoPatientAuditLogs()
      .map((entry) => {
        const patient = patients.find((item) => item.id === entry.patientId);
        return {
          ...entry,
          patientName: patient?.fullName ?? "Onbekende patiënt",
          patientCitizenId: patient?.citizenId ?? "Onbekend",
        };
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  const supabase = await createSupabaseServerClient();
  const [
    { data: logs, error: logsError },
    { data: patients, error: patientsError },
    { data: profiles, error: profilesError },
  ] = await Promise.all([
    supabase.from("audit_logs").select("*").order("created_at", { ascending: false }),
    supabase.from("patients").select("id, full_name, citizenid"),
    supabase.from("profiles").select("id, full_name"),
  ]);

  if (logsError || patientsError || profilesError) {
    return [];
  }

  const patientMap = new Map((patients ?? []).map((patient) => [patient.id, patient]));
  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

  const mappedLogs = (logs ?? []).reduce<PatientAuditLogRow[]>((accumulator, entry) => {
      const context = (entry.context ?? {}) as Record<string, unknown>;
      const patientId =
        entry.target_type === "patient"
          ? (entry.target_id as string | null)
          : (context.patient_id as string | undefined) ?? null;

      if (!patientId) return accumulator;

      const patient = patientMap.get(patientId);
      accumulator.push({
        id: entry.id,
        patientId,
        action: entry.action as PatientAuditLog["action"],
        actorProfileId: entry.actor_profile_id ?? "",
        actorName: entry.actor_profile_id
          ? profileMap.get(entry.actor_profile_id)?.full_name ?? null
          : null,
        summary: entry.summary,
        createdAt: entry.created_at,
        details: {
          before: entry.before_state,
          after: entry.after_state,
          changedFields: entry.changed_fields,
          ...context,
        },
        patientName: patient?.full_name ?? "Onbekende patiënt",
        patientCitizenId: patient?.citizenid ?? "Onbekend",
      } satisfies PatientAuditLogRow);
      return accumulator;
    }, []);

  return mappedLogs;
}

export async function getPatientManagementSnapshot(): Promise<PatientManagementSnapshot> {
  if (shouldUseDemoData()) {
    return {
      patients: [],
      cases: [],
    };
  }

  const supabase = await createSupabaseServerClient();
  const [{ data: patients, error: patientsError }, { data: cases, error: casesError }] =
    await Promise.all([
      supabase
        .from("patients")
        .select("*")
        .is("deleted_at", null)
        .order("full_name", { ascending: true }),
      supabase.from("patient_cases").select("*").order("opened_at", { ascending: false }),
    ]);

  if (patientsError || casesError) {
    return {
      patients: [],
      cases: [],
    };
  }

  return {
    patients: (patients ?? []).map((patient) => mapPatientRecord(patient)),
    cases: (cases ?? []).map((patientCase) => ({
      id: patientCase.id,
      patientId: patientCase.patient_id,
      title: patientCase.title,
      summary: patientCase.summary,
      status: patientCase.status,
      openedAt: patientCase.opened_at,
      closedAt: patientCase.closed_at,
    })),
  };
}

export const patientSchema = z.object({
  fullName: z.string().trim().min(3, "Naam moet minstens 3 tekens bevatten."),
  citizenId: z
    .string()
    .trim()
    .min(1, "Citizenid is verplicht.")
    .max(32, "Citizenid is te lang."),
  birthDate: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export const caseSchema = z.object({
  patientId: z.string().trim().min(1, "Patient ontbreekt."),
  title: z.string().trim().min(3, "Case-titel moet minstens 3 tekens bevatten."),
  summary: z.string().trim().optional(),
});

export const patientProfileSchema = z.object({
  patientId: z.string().trim().min(1, "Patient ontbreekt."),
  fullName: z.string().trim().min(3, "Naam moet minstens 3 tekens bevatten."),
  citizenId: z.string().trim().min(1, "Citizenid is verplicht.").max(32, "Citizenid is te lang."),
  birthDate: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  emergencyContactName: z.string().trim().optional(),
  emergencyContactPhone: z.string().trim().optional(),
  bloodType: z.string().trim().optional(),
  allergies: z.array(z.string().trim()).optional(),
  medications: z.array(z.string().trim()).optional(),
  chronicConditions: z.array(z.string().trim()).optional(),
  medicalWarnings: z.array(z.string().trim()).optional(),
  warningBadges: z.array(z.string().trim()).optional(),
  status: z
    .enum([
      "actief_in_behandeling",
      "opgenomen",
      "observatie",
      "stabiel_ontslagen",
      "overleden",
      "forensisch_politie",
    ])
    .optional(),
});

function mapPatientRecord(
  patient: {
    id: string;
    citizenid: string;
    full_name: string;
    birth_date: string | null;
    phone: string | null;
    emergency_contact_name?: string | null;
    emergency_contact_phone?: string | null;
    blood_type?: string | null;
    allergies?: string[] | null;
    medications?: string[] | null;
    chronic_conditions?: string[] | null;
    medical_warnings?: string[] | null;
    status_code?: string | null;
    notes?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
  },
  options?: {
    warningBadges?: string[];
    createdBy?: string | null;
    updatedBy?: string | null;
  },
): Patient {
  return {
    id: patient.id,
    citizenId: patient.citizenid,
    fullName: patient.full_name,
    birthDate: patient.birth_date,
    phone: patient.phone,
    emergencyContactName: patient.emergency_contact_name ?? null,
    emergencyContactPhone: patient.emergency_contact_phone ?? null,
    bloodType: patient.blood_type ?? null,
    allergies: patient.allergies ?? [],
    medications: patient.medications ?? [],
    chronicConditions: patient.chronic_conditions ?? [],
    medicalWarnings: patient.medical_warnings ?? [],
    warningBadges: options?.warningBadges ?? [],
    status: (patient.status_code as Patient["status"]) ?? null,
    createdBy: options?.createdBy ?? null,
    createdAt: patient.created_at ?? null,
    updatedBy: options?.updatedBy ?? null,
    updatedAt: patient.updated_at ?? null,
    notes: patient.notes ?? null,
  };
}

export async function getPatientWorkspaceRows(): Promise<PatientWorkspaceRow[]> {
  if (shouldUseDemoData()) {
    return [];
  }

  const supabase = await createSupabaseServerClient();

  const [{ data: patients, error: patientsError }, { data: reports, error: reportsError }] =
    await Promise.all([
      supabase
        .from("patients")
        .select("*")
        .is("deleted_at", null)
        .order("full_name", { ascending: true }),
      supabase
        .from("medical_reports")
        .select("id, patient_id, created_at")
        .order("created_at", { ascending: false }),
    ]);

  if (patientsError || reportsError) {
    return [];
  }

  const normalizedPatients: Patient[] = (patients ?? []).map((patient) => mapPatientRecord(patient));

  const normalizedReports = (reports ?? []).map((report) => ({
    id: report.id,
    patientId: report.patient_id,
    createdAt: report.created_at,
  }));

  return buildWorkspaceRows(normalizedPatients, normalizedReports);
}

export async function getPatientDetail(patientId: string): Promise<PatientDetail | null> {
  if (!shouldUseDemoData()) {
    const supabase = await createSupabaseServerClient();
    const [
      { data: patient, error: patientError },
      { data: reports, error: reportsError },
      { data: badges, error: badgesError },
      { data: cases, error: casesError },
    ] = await Promise.all([
      supabase.from("patients").select("*").eq("id", patientId).is("deleted_at", null).single(),
      supabase
        .from("medical_reports")
        .select("id, created_at")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false }),
      supabase.from("patient_badges").select("warning_badges(label)").eq("patient_id", patientId),
      supabase
        .from("patient_cases")
        .select("*")
        .eq("patient_id", patientId)
        .order("opened_at", { ascending: false }),
    ]);

    if (patientError || !patient || reportsError || badgesError || casesError) {
      return null;
    }

    const profileIds = [patient.created_by, patient.updated_by].filter(Boolean) as string[];
    const { data: profiles } = profileIds.length
      ? await supabase.from("profiles").select("id, full_name").in("id", profileIds)
      : { data: [] as Array<{ id: string; full_name: string }> };

    const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile.full_name]));
    const warningBadges = (badges ?? [])
      .map((row) => {
        const relation = row.warning_badges as { label?: string } | { label?: string }[] | null;
        if (Array.isArray(relation)) return relation[0]?.label ?? null;
        return relation?.label ?? null;
      })
      .filter((label): label is string => Boolean(label));

    return {
      ...mapPatientRecord(patient, {
        warningBadges,
        createdBy: patient.created_by ? profileMap.get(patient.created_by) ?? patient.created_by : null,
        updatedBy: patient.updated_by ? profileMap.get(patient.updated_by) ?? patient.updated_by : null,
      }),
      reportCount: (reports ?? []).length,
      latestReportAt: reports?.[0]?.created_at ?? null,
      cases: (cases ?? []).map((patientCase) => ({
        id: patientCase.id,
        patientId: patientCase.patient_id,
        title: patientCase.title,
        summary: patientCase.summary,
        status: patientCase.status,
        openedAt: patientCase.opened_at,
        closedAt: patientCase.closed_at,
      })),
    };
  }

  const rows = await getPatientWorkspaceRows();
  const patientRow = rows.find((patient) => patient.id === patientId);

  if (!patientRow) return null;

  const allCases = await getPatientCases(patientId);

  return {
    ...patientRow,
    cases: allCases.sort((a, b) => b.openedAt.localeCompare(a.openedAt)),
  };
}

export async function getPatientCases(patientId: string): Promise<PatientCase[]> {
  if (shouldUseDemoData()) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("patient_cases")
    .select("*")
    .eq("patient_id", patientId)
    .order("opened_at", { ascending: false });

  if (error) {
    return [];
  }

  return (data ?? []).map((patientCase) => ({
    id: patientCase.id,
    patientId: patientCase.patient_id,
    title: patientCase.title,
    summary: patientCase.summary,
    status: patientCase.status,
    openedAt: patientCase.opened_at,
    closedAt: patientCase.closed_at,
  }));
}

export async function getPatientCaseDetail(
  patientId: string,
  caseId: string,
): Promise<PatientCase | null> {
  const cases = await getPatientCases(patientId);
  return cases.find((patientCase) => patientCase.id === caseId) ?? null;
}

export async function createPatientRecord(input: z.infer<typeof patientSchema>) {
  const parsed = patientSchema.parse(input);

  if (shouldUseDemoData()) {
    const patientId = randomUUID();
    const now = new Date().toISOString();
    addDemoPatient({
      id: patientId,
      fullName: parsed.fullName,
      citizenId: parsed.citizenId,
      birthDate: parsed.birthDate || null,
      phone: parsed.phone || null,
      emergencyContactName: null,
      emergencyContactPhone: null,
      bloodType: null,
      allergies: [],
      medications: [],
      chronicConditions: [],
      medicalWarnings: [],
      warningBadges: [],
      status: "observatie",
      createdBy: "demo-user",
      createdAt: now,
      updatedBy: "demo-user",
      updatedAt: now,
      notes: parsed.notes || null,
    });
    addDemoPatientAuditLog({
      id: randomUUID(),
      patientId,
      action: "patient_created",
      actorProfileId: "demo-user",
      actorName: "Demo EMS gebruiker",
      summary: "Patiëntenfiche aangemaakt.",
      createdAt: now,
      details: null,
    });
    revalidatePath("/zorg");
    revalidatePath("/zorg/patienten");
    return patientId;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("patients")
    .insert({
      full_name: parsed.fullName,
      citizenid: parsed.citizenId,
      birth_date: parsed.birthDate || null,
      phone: parsed.phone || null,
      notes: parsed.notes || null,
      created_by: user?.id ?? null,
      updated_by: user?.id ?? null,
      status_code: "observatie",
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Patient kon niet worden aangemaakt.");
  }

  await writeAuditLog(supabase, {
    targetType: "patient",
    targetId: data.id,
    patientId: data.id,
    action: "patient_created",
    summary: "Patiëntenfiche aangemaakt.",
    afterState: {
      fullName: parsed.fullName,
      citizenId: parsed.citizenId,
      birthDate: parsed.birthDate || null,
      phone: parsed.phone || null,
      notes: parsed.notes || null,
    },
    changedFields: ["full_name", "citizenid", "birth_date", "phone", "notes", "status_code"],
  });

  revalidatePath("/zorg");
  revalidatePath("/zorg/patienten");
  return data.id as string;
}

export async function updatePatientNotes(patientId: string, notes: string) {
  const trimmedNotes = notes.trim();

  if (shouldUseDemoData()) {
    const now = new Date().toISOString();
    updateDemoPatient(patientId, {
      notes: trimmedNotes || null,
      updatedBy: "demo-user",
      updatedAt: now,
    });
    addDemoPatientAuditLog({
      id: randomUUID(),
      patientId,
      action: "notes_updated",
      actorProfileId: "demo-user",
      actorName: "Demo EMS gebruiker",
      summary: "Patiëntnotities bijgewerkt.",
      createdAt: now,
      details: { hasNotes: Boolean(trimmedNotes) },
    });
    revalidatePath(`/zorg/patienten/${patientId}`);
    revalidatePath("/zorg/patienten");
    return;
  }

  const supabase = await createSupabaseServerClient();
  const { data: existing } = await supabase.from("patients").select("notes").eq("id", patientId).single();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("patients")
    .update({ notes: trimmedNotes || null, updated_by: user?.id ?? null })
    .eq("id", patientId);

  if (error) {
    throw new Error(error.message);
  }

  await writeAuditLog(supabase, {
    targetType: "patient",
    targetId: patientId,
    patientId,
    action: "notes_updated",
    summary: "Patiëntnotities bijgewerkt.",
    beforeState: { notes: existing?.notes ?? null },
    afterState: { notes: trimmedNotes || null },
    changedFields: ["notes", "updated_by"],
  });

  revalidatePath(`/zorg/patienten/${patientId}`);
  revalidatePath("/zorg/patienten");
}

export async function updatePatientProfile(input: z.infer<typeof patientProfileSchema>) {
  const parsed = patientProfileSchema.parse(input);
  const now = new Date().toISOString();

  if (shouldUseDemoData()) {
    updateDemoPatient(parsed.patientId, {
      fullName: parsed.fullName,
      citizenId: parsed.citizenId,
      birthDate: parsed.birthDate || null,
      phone: parsed.phone || null,
      emergencyContactName: parsed.emergencyContactName || null,
      emergencyContactPhone: parsed.emergencyContactPhone || null,
      bloodType: parsed.bloodType || null,
      allergies: cleanStringArray(parsed.allergies),
      medications: cleanStringArray(parsed.medications),
      chronicConditions: cleanStringArray(parsed.chronicConditions),
      medicalWarnings: cleanStringArray(parsed.medicalWarnings),
      warningBadges: cleanStringArray(parsed.warningBadges),
      status: parsed.status || null,
      updatedBy: "demo-user",
      updatedAt: now,
    });
    addDemoPatientAuditLog({
      id: randomUUID(),
      patientId: parsed.patientId,
      action: "patient_updated",
      actorProfileId: "demo-user",
      actorName: "Demo EMS gebruiker",
      summary: "Patiëntgegevens bijgewerkt.",
      createdAt: now,
      details: {
        fullName: parsed.fullName,
        status: parsed.status || null,
      },
    });
    revalidatePath("/zorg/patienten");
    revalidatePath(`/zorg/patienten/${parsed.patientId}`);
    return;
  }

  const supabase = await createSupabaseServerClient();
  const requestedBadges = cleanStringArray(parsed.warningBadges);
  const { data: existing } = await supabase.from("patients").select("*").eq("id", parsed.patientId).single();
  const { error } = await supabase
    .from("patients")
    .update({
      full_name: parsed.fullName,
      citizenid: parsed.citizenId,
      birth_date: parsed.birthDate || null,
      phone: parsed.phone || null,
      emergency_contact_name: parsed.emergencyContactName || null,
      emergency_contact_phone: parsed.emergencyContactPhone || null,
      blood_type: parsed.bloodType || null,
      allergies: cleanStringArray(parsed.allergies),
      medications: cleanStringArray(parsed.medications),
      chronic_conditions: cleanStringArray(parsed.chronicConditions),
      medical_warnings: cleanStringArray(parsed.medicalWarnings),
      status_code: parsed.status || null,
      updated_by: (await supabase.auth.getUser()).data.user?.id ?? null,
    })
    .eq("id", parsed.patientId);

  if (error) {
    throw new Error(error.message);
  }

  const { data: availableBadges, error: badgeLookupError } = await supabase
    .from("warning_badges")
    .select("id, code, label");

  if (badgeLookupError) {
    throw new Error(badgeLookupError.message);
  }

  const requestedBadgeKeys = new Set(requestedBadges.map((value) => value.trim().toUpperCase()));
  const nextBadgeIds = (availableBadges ?? [])
    .filter((badge) => {
      const code = badge.code.trim().toUpperCase();
      const label = badge.label.trim().toUpperCase();
      return requestedBadgeKeys.has(code) || requestedBadgeKeys.has(label);
    })
    .map((badge) => badge.id);

  const { data: existingBadges, error: existingBadgesError } = await supabase
    .from("patient_badges")
    .select("badge_id")
    .eq("patient_id", parsed.patientId);

  if (existingBadgesError) {
    throw new Error(existingBadgesError.message);
  }

  const existingBadgeIds = new Set((existingBadges ?? []).map((badge) => badge.badge_id));
  const nextBadgeSet = new Set(nextBadgeIds);
  const badgeIdsToDelete = [...existingBadgeIds].filter((badgeId) => !nextBadgeSet.has(badgeId));
  const badgeIdsToInsert = nextBadgeIds.filter((badgeId) => !existingBadgeIds.has(badgeId));
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (badgeIdsToDelete.length) {
    const { error: deleteBadgesError } = await supabase
      .from("patient_badges")
      .delete()
      .eq("patient_id", parsed.patientId)
      .in("badge_id", badgeIdsToDelete);

    if (deleteBadgesError) {
      throw new Error(deleteBadgesError.message);
    }
  }

  if (badgeIdsToInsert.length) {
    const { error: insertBadgesError } = await supabase.from("patient_badges").insert(
      badgeIdsToInsert.map((badgeId) => ({
        patient_id: parsed.patientId,
        badge_id: badgeId,
        assigned_by: user?.id ?? null,
      })),
    );

    if (insertBadgesError) {
      throw new Error(insertBadgesError.message);
    }
  }

  await writeAuditLog(supabase, {
    targetType: "patient",
    targetId: parsed.patientId,
    patientId: parsed.patientId,
    action: "patient_updated",
    summary: "Patiëntgegevens bijgewerkt.",
    beforeState: existing ?? null,
    afterState: {
      fullName: parsed.fullName,
      citizenId: parsed.citizenId,
      birthDate: parsed.birthDate || null,
      phone: parsed.phone || null,
      emergencyContactName: parsed.emergencyContactName || null,
      emergencyContactPhone: parsed.emergencyContactPhone || null,
      bloodType: parsed.bloodType || null,
      allergies: cleanStringArray(parsed.allergies),
      medications: cleanStringArray(parsed.medications),
      chronicConditions: cleanStringArray(parsed.chronicConditions),
      medicalWarnings: cleanStringArray(parsed.medicalWarnings),
      warningBadges: requestedBadges,
      status: parsed.status || null,
    },
    changedFields: [
      "full_name",
      "citizenid",
      "birth_date",
      "phone",
      "emergency_contact_name",
      "emergency_contact_phone",
      "blood_type",
      "allergies",
      "medications",
      "chronic_conditions",
      "medical_warnings",
      "patient_badges",
      "status_code",
    ],
  });

  revalidatePath("/zorg/patienten");
  revalidatePath(`/zorg/patienten/${parsed.patientId}`);
}

export async function deletePatientRecord(patientId: string) {
  const now = new Date().toISOString();

  if (shouldUseDemoData()) {
    addDemoPatientAuditLog({
      id: randomUUID(),
      patientId,
      action: "patient_updated",
      actorProfileId: "demo-user",
      actorName: "Demo EMS gebruiker",
      summary: "Patiëntenfiche verwijderd.",
      createdAt: now,
      details: { deleted: true },
    });
    removeDemoPatient(patientId);
    revalidatePath("/zorg/patienten");
    return;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: existing } = await supabase.from("patients").select("*").eq("id", patientId).single();
  const { error } = await supabase
    .from("patients")
    .update({
      deleted_at: now,
      deleted_by: user?.id ?? null,
      updated_by: user?.id ?? null,
    })
    .eq("id", patientId);

  if (error) {
    throw new Error(error.message);
  }

  await writeAuditLog(supabase, {
    targetType: "patient",
    targetId: patientId,
    patientId,
    action: "patient_deleted",
    summary: "Patiëntenfiche soft deleted.",
    beforeState: existing ?? null,
    afterState: { deletedAt: now, deletedBy: user?.id ?? null },
    changedFields: ["deleted_at", "deleted_by"],
  });

  revalidatePath("/zorg/patienten");
}

export async function createCaseRecord(input: z.infer<typeof caseSchema>) {
  const parsed = caseSchema.parse(input);

  if (shouldUseDemoData()) {
    const now = new Date().toISOString();
    addDemoCase({
      id: randomUUID(),
      patientId: parsed.patientId,
      title: parsed.title,
      summary: parsed.summary || null,
      status: "open",
      openedAt: now,
      closedAt: null,
    });
    addDemoPatientAuditLog({
      id: randomUUID(),
      patientId: parsed.patientId,
      action: "case_created",
      actorProfileId: "demo-user",
      actorName: "Demo EMS gebruiker",
      summary: `Case toegevoegd: ${parsed.title}`,
      createdAt: now,
      details: { title: parsed.title },
    });
    revalidatePath("/zorg");
    revalidatePath("/zorg/patienten");
    revalidatePath(`/zorg/patienten/${parsed.patientId}`);
    return;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data, error } = await supabase.from("patient_cases").insert({
    patient_id: parsed.patientId,
    title: parsed.title,
    summary: parsed.summary || null,
    status: "open",
    opened_by: user?.id ?? null,
    updated_by: user?.id ?? null,
  }).select("id").single();

  if (error || !data) {
    throw new Error(error.message);
  }

  await writeAuditLog(supabase, {
    targetType: "patient_case",
    targetId: data.id,
    patientId: parsed.patientId,
    action: "case_created",
    summary: `Case toegevoegd: ${parsed.title}`,
    afterState: {
      title: parsed.title,
      summary: parsed.summary || null,
      status: "open",
    },
    changedFields: ["title", "summary", "status"],
  });

  revalidatePath("/zorg");
  revalidatePath("/zorg/patienten");
  revalidatePath(`/zorg/patienten/${parsed.patientId}`);
}

export async function updatePatientCaseRecord(
  input: z.infer<typeof patientCaseProfileSchema>,
) {
  const parsed = patientCaseProfileSchema.parse(input);
  const now = new Date().toISOString();

  if (shouldUseDemoData()) {
    updateDemoCase(parsed.caseId, {
      title: parsed.title,
      summary: parsed.summary || null,
      status: parsed.status,
      closedAt: parsed.status === "afgesloten" ? now : null,
    });
    addDemoPatientAuditLog({
      id: randomUUID(),
      patientId: parsed.patientId,
      action: "patient_updated",
      actorProfileId: "demo-user",
      actorName: "Demo EMS gebruiker",
      summary: `Case bijgewerkt: ${parsed.title}`,
      createdAt: now,
      details: { caseId: parsed.caseId, status: parsed.status },
    });
    revalidatePath(`/zorg/patienten/${parsed.patientId}`);
    revalidatePath(`/zorg/patienten/${parsed.patientId}/cases/${parsed.caseId}`);
    revalidatePath(`/zorg/patienten/${parsed.patientId}/cases/${parsed.caseId}/bewerken`);
    return;
  }

  const supabase = await createSupabaseServerClient();
  const { data: existing } = await supabase.from("patient_cases").select("*").eq("id", parsed.caseId).single();
  const { error } = await supabase
    .from("patient_cases")
    .update({
      title: parsed.title,
      summary: parsed.summary || null,
      status: parsed.status,
      closed_at: parsed.status === "afgesloten" ? now : null,
      updated_by: (await supabase.auth.getUser()).data.user?.id ?? null,
    })
    .eq("id", parsed.caseId)
    .eq("patient_id", parsed.patientId);

  if (error) {
    throw new Error(error.message);
  }

  await writeAuditLog(supabase, {
    targetType: "patient_case",
    targetId: parsed.caseId,
    patientId: parsed.patientId,
    action: "case_updated",
    summary: `Case bijgewerkt: ${parsed.title}`,
    beforeState: existing ?? null,
    afterState: {
      title: parsed.title,
      summary: parsed.summary || null,
      status: parsed.status,
      closedAt: parsed.status === "afgesloten" ? now : null,
    },
    changedFields: ["title", "summary", "status", "closed_at"],
  });

  revalidatePath(`/zorg/patienten/${parsed.patientId}`);
  revalidatePath(`/zorg/patienten/${parsed.patientId}/cases/${parsed.caseId}`);
  revalidatePath(`/zorg/patienten/${parsed.patientId}/cases/${parsed.caseId}/bewerken`);
}

function buildWorkspaceRows(
  patients: Patient[],
  reports: Array<{ patientId: string; createdAt: string }>,
): PatientWorkspaceRow[] {
  return patients.map((patient) => {
    const patientReports = reports.filter((report) => report.patientId === patient.id);
    const sortedReports = [...patientReports].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );

    return {
      ...patient,
      reportCount: patientReports.length,
      latestReportAt: sortedReports[0]?.createdAt ?? null,
    };
  }).sort((a, b) => a.fullName.localeCompare(b.fullName, "nl-BE"));
}

function cleanStringArray(values?: string[]) {
  return (values ?? []).map((value) => value.trim()).filter(Boolean);
}






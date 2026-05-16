import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  addDemoStaffSpecialization,
  addDemoStaffAbsence,
  addDemoStaffEvaluation,
  addDemoStaffReward,
  addDemoStaffStrikepointEntry,
  getDemoStaffAbsences,
  getDemoStaffEvaluations,
  getDemoStaffProfiles,
  getDemoStaffRewards,
  getDemoStaffStrikepointEntries,
  removeDemoStaffSpecialization,
  resolveDemoStaffStrikepointEntry,
  updateDemoStaffProfile,
} from "@/lib/demo-store";
import { mockRanks, mockSpecializations } from "@/lib/mock-data";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  Profile,
  Rank,
  Specialization,
  StaffAbsence,
  StaffEvaluation,
  StaffEvaluationContent,
  StaffProfile,
  StaffReward,
  StaffStrikepointEntry,
} from "@/types/domain";

export type StaffWorkspaceRow = StaffProfile & {
  latestEvaluationTitle: string | null;
  latestEvaluationAt: string | null;
  activeAbsenceCount: number;
};

export type StaffDetail = StaffWorkspaceRow & {
  evaluations: StaffEvaluation[];
  absences: StaffAbsence[];
  rewards: StaffReward[];
  strikepointEntries: StaffStrikepointEntry[];
  availableRanks: Rank[];
  availableSpecializations: Specialization[];
};

export const staffEvaluationSchema = z.object({
  employeeProfileId: z.string().trim().min(1, "Medewerker ontbreekt."),
  title: z.string().trim().min(3, "Titel is verplicht."),
  summary: z.string().trim().min(3, "Samenvatting is te kort."),
  evaluationPeriod: z.string().trim().optional(),
  strengths: z.string().trim().optional(),
  attentionPoints: z.string().trim().optional(),
  developmentPlan: z.string().trim().optional(),
  outcome: z.string().trim().optional(),
});

export const staffAbsenceSchema = z.object({
  profileId: z.string().trim().min(1, "Medewerker ontbreekt."),
  absenceType: z.string().trim().min(3, "Type afwezigheid is verplicht."),
  startDate: z.string().trim().min(1, "Startdatum is verplicht."),
  endDate: z.string().trim().min(1, "Einddatum is verplicht."),
  reason: z.string().trim().optional(),
  status: z.string().trim().min(1, "Status is verplicht."),
});

export const staffRewardSchema = z.object({
  profileId: z.string().trim().min(1, "Medewerker ontbreekt."),
  title: z.string().trim().min(3, "Titel is verplicht."),
  description: z.string().trim().optional(),
  amount: z.coerce.number().min(0, "Bedrag moet positief zijn.").optional(),
});

export const staffStrikepointSchema = z.object({
  profileId: z.string().trim().min(1, "Medewerker ontbreekt."),
  amount: z.coerce.number().int().min(1, "Minstens 1 strikepoint toevoegen."),
  reason: z.string().trim().min(5, "Reden is verplicht."),
});

export const staffStrikepointRemovalSchema = z.object({
  profileId: z.string().trim().min(1, "Medewerker ontbreekt."),
  entryId: z.string().trim().min(1, "Strikepoint ontbreekt."),
  reason: z.string().trim().min(5, "Reden is verplicht."),
});

export const staffProfileUpdateSchema = z.object({
  profileId: z.string().trim().min(1, "Medewerker ontbreekt."),
  callSign: z.string().trim().min(3, "Roepnummer is verplicht."),
  rankId: z.string().trim().min(1, "Rang is verplicht."),
  phone: z.string().trim().optional(),
  status: z.enum(["actief", "afwezig", "non-actief"]),
});

export const staffSpecializationsSchema = z.object({
  profileId: z.string().trim().min(1, "Medewerker ontbreekt."),
  specializationIds: z.array(z.string()),
});

function getRankBaseSalary(rankId: string, ranks: Rank[]) {
  return ranks.find((rank) => rank.id === rankId)?.baseSalary ?? 0;
}

function getSpecializationBonusTotal(specializationIds: string[], specializations: Specialization[]) {
  return specializationIds.reduce((total, specializationId) => {
    const specialization = specializations.find((item) => item.id === specializationId);
    return total + (specialization?.salaryBonus ?? 0);
  }, 0);
}

function calculateSalary(profile: Pick<StaffProfile, "rankId" | "specializationIds">, ranks: Rank[], specializations: Specialization[]) {
  return getRankBaseSalary(profile.rankId, ranks) +
    getSpecializationBonusTotal(profile.specializationIds, specializations);
}

function isActiveAbsence(absence: StaffAbsence) {
  return absence.status !== "geweigerd" && absence.status !== "afgesloten";
}

export function resolveStaffStatus(
  profile: Pick<StaffProfile, "active" | "statusOverride">,
  activeAbsenceCount: number,
) {
  if (profile.statusOverride) return profile.statusOverride;
  if (!profile.active) return "non-actief";
  if (activeAbsenceCount > 0) return "afwezig";
  return "actief";
}

function buildWorkspaceRows(
  profiles: StaffProfile[],
  evaluations: StaffEvaluation[],
  absences: StaffAbsence[],
): StaffWorkspaceRow[] {
  return profiles
    .map((profile) => {
      const profileEvaluations = evaluations
        .filter((evaluation) => evaluation.employeeProfileId === profile.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

      const profileAbsences = absences.filter((absence) => absence.profileId === profile.id);

      return {
        ...profile,
        salaryMonthly: calculateSalary(profile, mockRanks, mockSpecializations),
        latestEvaluationTitle: profileEvaluations[0]?.title ?? null,
        latestEvaluationAt: profileEvaluations[0]?.createdAt ?? null,
        activeAbsenceCount: profileAbsences.filter(isActiveAbsence).length,
      };
    })
    .sort((a, b) => a.fullName.localeCompare(b.fullName, "nl-BE"));
}

function mapEmploymentStatusToWorkspaceStatus(
  employmentStatus: string,
): "actief" | "afwezig" | "non-actief" | null {
  if (employmentStatus === "verlof") return "afwezig";
  if (["inactief", "geschorst", "ontslagen"].includes(employmentStatus)) return "non-actief";
  return "actief";
}

function normalizeProfiles(
  profiles: Array<{
    id: string;
    full_name: string;
    call_sign: string | null;
    rank_id: string | null;
    employment_status: string;
    joined_at: string | null;
    updated_at: string | null;
  }>,
  privateDetailsByProfileId: Map<
    string,
    { email: string; citizenid: string; phone: string | null }
  >,
  ranks: Rank[],
  specializationsByProfileId: Map<string, Specialization[]>,
  strikePointsByProfileId: Map<string, number>,
): StaffProfile[] {
  return profiles.map((profile) => {
    const rank = ranks.find((item) => item.id === profile.rank_id);
    const profileSpecializations = specializationsByProfileId.get(profile.id) ?? [];
    const privateDetails = privateDetailsByProfileId.get(profile.id);

    return {
      id: profile.id,
      email: privateDetails?.email ?? "",
      fullName: profile.full_name,
      citizenId: privateDetails?.citizenid ?? "",
      callSign: profile.call_sign ?? privateDetails?.citizenid ?? "",
      rankId: profile.rank_id ?? "",
      rankName: rank?.name ?? "Ongekend",
      active: !["inactief", "geschorst", "ontslagen"].includes(profile.employment_status),
      statusOverride: mapEmploymentStatusToWorkspaceStatus(profile.employment_status),
      specializationIds: profileSpecializations.map((item) => item.id),
      specializationNames: profileSpecializations.map((item) => item.name),
      toolPassword: null,
      phone: privateDetails?.phone ?? null,
      joinedAt: profile.joined_at,
      lastModifiedAt: profile.updated_at,
      salaryMonthly: null,
      strikePoints: strikePointsByProfileId.get(profile.id) ?? 0,
    };
  });
}

function normalizeEvaluation(evaluation: {
  id: string;
  employee_profile_id: string;
  evaluator_profile_id: string;
  title: string;
  summary: string | null;
  content: unknown;
  created_at: string;
  updated_at: string | null;
}): StaffEvaluation {
  return {
    id: evaluation.id,
    employeeProfileId: evaluation.employee_profile_id,
    evaluatorProfileId: evaluation.evaluator_profile_id,
    title: evaluation.title,
    summary: evaluation.summary ?? "",
    content: (evaluation.content as StaffEvaluationContent) ?? {},
    createdAt: evaluation.created_at,
    updatedAt: evaluation.updated_at,
  };
}

function normalizeAbsence(absence: {
  id: string;
  profile_id: string;
  absence_type: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: string;
  decided_by: string | null;
  created_at: string;
}): StaffAbsence {
  return {
    id: absence.id,
    profileId: absence.profile_id,
    absenceType: absence.absence_type,
    startDate: absence.start_date,
    endDate: absence.end_date,
    reason: absence.reason,
    status: absence.status,
    decidedBy: absence.decided_by,
    createdAt: absence.created_at,
  };
}

export async function getStaffWorkspaceRows(): Promise<StaffWorkspaceRow[]> {
  if (!hasSupabaseEnv()) {
    return buildWorkspaceRows(
      getDemoStaffProfiles(),
      getDemoStaffEvaluations(),
      getDemoStaffAbsences(),
    );
  }

  const supabase = await createSupabaseServerClient();
  const [
    { data: profiles, error: profilesError },
    { data: privateDetails, error: privateDetailsError },
    { data: ranks, error: ranksError },
    { data: profileSpecializations, error: profileSpecializationsError },
    { data: evaluations, error: evaluationsError },
    { data: absences, error: absencesError },
    { data: strikepointEntries, error: strikepointEntriesError },
  ] = await Promise.all([
    supabase.from("profiles").select("*").order("full_name", { ascending: true }),
    supabase.from("profile_private_details").select("*"),
    supabase.from("ranks").select("*").order("rank_number", { ascending: true }),
    supabase
      .from("profile_specializations")
      .select("profile_id, specialization_id, specializations(id, code, name)"),
    supabase.from("staff_evaluations").select("*").order("created_at", { ascending: false }),
    supabase.from("staff_absences").select("*").order("start_date", { ascending: false }),
    supabase
      .from("staff_strikepoint_entries")
      .select("*")
      .order("created_at", { ascending: false }),
  ]);

  if (
    profilesError ||
    privateDetailsError ||
    ranksError ||
    profileSpecializationsError ||
    evaluationsError ||
    absencesError ||
    strikepointEntriesError
  ) {
    return buildWorkspaceRows(
      getDemoStaffProfiles(),
      getDemoStaffEvaluations(),
      getDemoStaffAbsences(),
    );
  }

  const normalizedRanks: Rank[] = (ranks ?? []).map((rank) => ({
    id: rank.id,
    code: rank.code,
    name: rank.name,
    weight: rank.rank_number,
  }));

  const privateDetailsByProfileId = new Map(
    (privateDetails ?? []).map((detail) => [
      detail.profile_id,
      { email: detail.email, citizenid: detail.citizenid, phone: detail.phone },
    ]),
  );
  const specializationsByProfileId = new Map<string, Specialization[]>();
  const strikePointsByProfileId = new Map<string, number>();

  for (const entry of strikepointEntries ?? []) {
    if (entry.resolved_at) continue;
    const current = strikePointsByProfileId.get(entry.profile_id) ?? 0;
    strikePointsByProfileId.set(entry.profile_id, Math.max(0, current + entry.delta));
  }

  for (const item of profileSpecializations ?? []) {
    const specializationRecord = Array.isArray(item.specializations)
      ? item.specializations[0]
      : item.specializations;

    if (!specializationRecord) continue;

    const entry = specializationsByProfileId.get(item.profile_id) ?? [];
    entry.push({
      id: specializationRecord.id,
      code: specializationRecord.code,
      name: specializationRecord.name,
    });
    specializationsByProfileId.set(item.profile_id, entry);
  }

  const normalizedProfiles = normalizeProfiles(
    (profiles ?? []) as Array<{
      id: string;
      full_name: string;
      call_sign: string | null;
      rank_id: string | null;
      employment_status: string;
      joined_at: string | null;
      updated_at: string | null;
    }>,
    privateDetailsByProfileId,
    normalizedRanks,
    specializationsByProfileId,
    strikePointsByProfileId,
  );

  const normalizedEvaluations = (evaluations ?? []).map(normalizeEvaluation);
  const normalizedAbsences = (absences ?? []).map(normalizeAbsence);

  return buildWorkspaceRows(normalizedProfiles, normalizedEvaluations, normalizedAbsences);
}

export async function getStaffDetail(profileId: string): Promise<StaffDetail | null> {
  const rows = await getStaffWorkspaceRows();
  const profile = rows.find((item) => item.id === profileId);

  if (!profile) return null;

  const [evaluations, absences, rewards, strikepointEntries] = await Promise.all([
    getStaffEvaluations(profileId),
    getStaffAbsences(profileId),
    getStaffRewards(profileId),
    getStaffStrikepointEntries(profileId),
  ]);

  return {
    ...profile,
    evaluations,
    absences,
    rewards,
    strikepointEntries,
    availableRanks: await getAvailableRanks(),
    availableSpecializations: await getAvailableSpecializations(),
  };
}

export async function getStaffEvaluations(profileId: string): Promise<StaffEvaluation[]> {
  if (!hasSupabaseEnv()) {
    return getDemoStaffEvaluations()
      .filter((evaluation) => evaluation.employeeProfileId === profileId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("staff_evaluations")
    .select("*")
    .eq("employee_profile_id", profileId)
    .order("created_at", { ascending: false });

  if (error) {
    return getDemoStaffEvaluations()
      .filter((evaluation) => evaluation.employeeProfileId === profileId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  return (data ?? []).map(normalizeEvaluation);
}

export async function getStaffAbsences(profileId: string): Promise<StaffAbsence[]> {
  if (!hasSupabaseEnv()) {
    return getDemoStaffAbsences()
      .filter((absence) => absence.profileId === profileId)
      .sort((a, b) => b.startDate.localeCompare(a.startDate));
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("staff_absences")
    .select("*")
    .eq("profile_id", profileId)
    .order("start_date", { ascending: false });

  if (error) {
    return getDemoStaffAbsences()
      .filter((absence) => absence.profileId === profileId)
      .sort((a, b) => b.startDate.localeCompare(a.startDate));
  }

  return (data ?? []).map(normalizeAbsence);
}

export async function getStaffRewards(profileId: string): Promise<StaffReward[]> {
  if (!hasSupabaseEnv()) {
    return getDemoStaffRewards()
      .filter((reward) => reward.profileId === profileId)
      .sort((a, b) => b.grantedAt.localeCompare(a.grantedAt));
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("staff_rewards")
    .select("*")
    .eq("profile_id", profileId)
    .order("granted_at", { ascending: false });

  if (error) {
    return getDemoStaffRewards()
      .filter((reward) => reward.profileId === profileId)
      .sort((a, b) => b.grantedAt.localeCompare(a.grantedAt));
  }

  return (data ?? []).map((reward) => ({
    id: reward.id,
    profileId: reward.profile_id,
    title: reward.title,
    description: reward.description,
    amount: reward.amount,
    grantedBy: reward.granted_by,
    grantedAt: reward.granted_at,
  }));
}

export async function getStaffStrikepointEntries(
  profileId: string,
): Promise<StaffStrikepointEntry[]> {
  if (!hasSupabaseEnv()) {
    return getDemoStaffStrikepointEntries()
      .filter((entry) => entry.profileId === profileId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("staff_strikepoint_entries")
    .select("*")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });

  if (error) {
    return getDemoStaffStrikepointEntries()
      .filter((entry) => entry.profileId === profileId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  return (data ?? []).map((entry) => ({
    id: entry.id,
    profileId: entry.profile_id,
    delta: entry.delta,
    reason: entry.reason,
    createdBy: entry.created_by,
    createdAt: entry.created_at,
    resolvedAt: entry.resolved_at,
    resolvedBy: entry.resolved_by,
    resolvedReason: entry.resolved_reason,
  }));
}

export async function getAvailableRanks(): Promise<Rank[]> {
  if (!hasSupabaseEnv()) {
    return mockRanks;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("ranks")
    .select("*")
    .order("rank_number", { ascending: true });
  if (error) {
    return mockRanks;
  }

  return (data ?? []).map((rank) => ({
    id: rank.id,
    code: rank.code,
    name: rank.name,
    weight: rank.rank_number,
  }));
}

export async function getAvailableSpecializations(): Promise<Specialization[]> {
  if (!hasSupabaseEnv()) {
    return mockSpecializations;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("specializations").select("*").order("name");
  if (error) {
    return mockSpecializations;
  }

  return (data ?? []).map((specialization) => ({
    id: specialization.id,
    code: specialization.code,
    name: specialization.name,
  }));
}

export async function getStaffProfileMap() {
  const profiles = await getStaffWorkspaceRows();

  return new Map<string, StaffWorkspaceRow>(profiles.map((profile) => [profile.id, profile]));
}

export async function createStaffEvaluationRecord(
  input: z.infer<typeof staffEvaluationSchema>,
  evaluatorProfileId: string,
) {
  const parsed = staffEvaluationSchema.parse(input);

  const content: StaffEvaluationContent = {
    evaluationPeriod: parsed.evaluationPeriod,
    strengths: parsed.strengths,
    attentionPoints: parsed.attentionPoints,
    developmentPlan: parsed.developmentPlan,
    outcome: parsed.outcome,
  };

  if (!hasSupabaseEnv()) {
    addDemoStaffEvaluation({
      id: randomUUID(),
      employeeProfileId: parsed.employeeProfileId,
      evaluatorProfileId,
      title: parsed.title,
      summary: parsed.summary,
      content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    updateDemoStaffProfile(parsed.employeeProfileId, {});

    revalidatePath("/personeel");
    revalidatePath(`/personeel/${parsed.employeeProfileId}`);
    return;
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("staff_evaluations").insert({
    employee_profile_id: parsed.employeeProfileId,
    evaluator_profile_id: evaluatorProfileId,
    title: parsed.title,
    summary: parsed.summary,
    content,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/personeel");
  revalidatePath(`/personeel/${parsed.employeeProfileId}`);
}

export async function createStaffAbsenceRecord(input: z.infer<typeof staffAbsenceSchema>) {
  const parsed = staffAbsenceSchema.parse(input);

  if (!hasSupabaseEnv()) {
    addDemoStaffAbsence({
      id: randomUUID(),
      profileId: parsed.profileId,
      absenceType: parsed.absenceType,
      startDate: parsed.startDate,
      endDate: parsed.endDate,
      reason: parsed.reason || null,
      status: parsed.status,
      decidedBy: parsed.status === "aangevraagd" ? null : "demo-user",
      createdAt: new Date().toISOString(),
    });
    updateDemoStaffProfile(parsed.profileId, {});

    revalidatePath("/personeel");
    revalidatePath(`/personeel/${parsed.profileId}`);
    return;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const decidedBy = parsed.status === "aangevraagd" ? null : user?.id ?? null;

  const { error } = await supabase.from("staff_absences").insert({
    profile_id: parsed.profileId,
    absence_type: parsed.absenceType,
    start_date: parsed.startDate,
    end_date: parsed.endDate,
    reason: parsed.reason || null,
    status: parsed.status,
    decided_by: decidedBy,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/personeel");
  revalidatePath(`/personeel/${parsed.profileId}`);
}

export async function createStaffRewardRecord(
  input: z.infer<typeof staffRewardSchema>,
  granterProfileId: string,
) {
  const parsed = staffRewardSchema.parse(input);

  if (!hasSupabaseEnv()) {
    addDemoStaffReward({
      id: randomUUID(),
      profileId: parsed.profileId,
      title: parsed.title,
      description: parsed.description || null,
      amount: parsed.amount ?? null,
      grantedBy: granterProfileId,
      grantedAt: new Date().toISOString(),
    });
    updateDemoStaffProfile(parsed.profileId, {});

    revalidatePath("/personeel");
    revalidatePath(`/personeel/${parsed.profileId}`);
    return;
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("staff_rewards").insert({
    profile_id: parsed.profileId,
    title: parsed.title,
    description: parsed.description || null,
    amount: parsed.amount ?? null,
    granted_by: granterProfileId,
    granted_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/personeel");
  revalidatePath(`/personeel/${parsed.profileId}`);
}

export async function addStaffStrikepointsRecord(
  input: z.infer<typeof staffStrikepointSchema>,
  actorProfileId: string,
) {
  const parsed = staffStrikepointSchema.parse(input);

  if (!hasSupabaseEnv()) {
    const profile = getDemoStaffProfiles().find((item) => item.id === parsed.profileId);
    if (!profile) {
      throw new Error("Medewerker niet gevonden.");
    }

    updateDemoStaffProfile(parsed.profileId, {
      strikePoints: (profile.strikePoints ?? 0) + parsed.amount,
    });
    addDemoStaffStrikepointEntry({
      id: randomUUID(),
      profileId: parsed.profileId,
      delta: parsed.amount,
      reason: String((input as { reason?: string }).reason ?? ""),
      createdBy: actorProfileId,
      createdAt: new Date().toISOString(),
    });
    updateDemoStaffProfile(parsed.profileId, {});

    revalidatePath("/personeel");
    revalidatePath(`/personeel/${parsed.profileId}`);
    return;
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("staff_strikepoint_entries").insert({
    profile_id: parsed.profileId,
    delta: parsed.amount,
    reason: String((input as { reason?: string }).reason ?? ""),
    created_by: actorProfileId,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/personeel");
  revalidatePath(`/personeel/${parsed.profileId}`);
}

export async function removeStaffStrikepointsRecord(
  input: z.infer<typeof staffStrikepointRemovalSchema>,
  actorProfileId: string,
) {
  const parsed = staffStrikepointRemovalSchema.parse(input);

  if (!hasSupabaseEnv()) {
    const profile = getDemoStaffProfiles().find((item) => item.id === parsed.profileId);
    const entry = getDemoStaffStrikepointEntries().find((item) => item.id === parsed.entryId);
    if (!profile) {
      throw new Error("Medewerker niet gevonden.");
    }
    if (!entry || entry.delta <= 0 || entry.resolvedAt) {
      throw new Error("Strikepoint kan niet verwijderd worden.");
    }

    updateDemoStaffProfile(parsed.profileId, {
      strikePoints: Math.max(0, (profile.strikePoints ?? 0) - entry.delta),
    });
    resolveDemoStaffStrikepointEntry(parsed.entryId, {
      resolvedAt: new Date().toISOString(),
      resolvedBy: actorProfileId,
      resolvedReason: parsed.reason,
    });
    updateDemoStaffProfile(parsed.profileId, {});

    revalidatePath("/personeel");
    revalidatePath(`/personeel/${parsed.profileId}`);
    return;
  }

  const supabase = await createSupabaseServerClient();
  await supabase
    .from("staff_strikepoint_entries")
    .update({
      resolved_at: new Date().toISOString(),
      resolved_by: actorProfileId,
      resolved_reason: parsed.reason,
    })
    .eq("id", parsed.entryId);

  revalidatePath("/personeel");
  revalidatePath(`/personeel/${parsed.profileId}`);
}

export async function updateStaffProfileRecord(
  input: z.infer<typeof staffProfileUpdateSchema>,
) {
  const parsed = staffProfileUpdateSchema.parse(input);

  if (!hasSupabaseEnv()) {
    const ranks = await getAvailableRanks();
    const rank = ranks.find((item) => item.id === parsed.rankId);
    updateDemoStaffProfile(parsed.profileId, {
      callSign: parsed.callSign,
      rankId: parsed.rankId,
      rankName: rank?.name ?? "Ongekend",
      active: parsed.status !== "non-actief",
      statusOverride: parsed.status,
      phone: parsed.phone || null,
    });

    revalidatePath("/personeel");
    revalidatePath(`/personeel/${parsed.profileId}`);
    return;
  }

  const supabase = await createSupabaseServerClient();
  const employmentStatus =
    parsed.status === "afwezig"
      ? "verlof"
      : parsed.status === "non-actief"
        ? "inactief"
        : "actief";

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      call_sign: parsed.callSign,
      rank_id: parsed.rankId,
      employment_status: employmentStatus,
    })
    .eq("id", parsed.profileId);

  if (profileError) {
    throw new Error(profileError.message);
  }

  const { error: detailsError } = await supabase
    .from("profile_private_details")
    .update({
      phone: parsed.phone || null,
    })
    .eq("profile_id", parsed.profileId);

  if (detailsError) {
    throw new Error(detailsError.message);
  }

  revalidatePath("/personeel");
  revalidatePath(`/personeel/${parsed.profileId}`);
}

export async function updateStaffSpecializationsRecord(
  input: z.infer<typeof staffSpecializationsSchema>,
) {
  const parsed = staffSpecializationsSchema.parse(input);

  if (!hasSupabaseEnv()) {
    const allSpecializations = await getAvailableSpecializations();
    const profile = getDemoStaffProfiles().find((item) => item.id === parsed.profileId);
    if (!profile) {
      throw new Error("Medewerker niet gevonden.");
    }

    for (const specializationId of [...profile.specializationIds]) {
      if (!parsed.specializationIds.includes(specializationId)) {
        removeDemoStaffSpecialization(parsed.profileId, specializationId);
      }
    }

    for (const specializationId of parsed.specializationIds) {
      const specialization = allSpecializations.find((item) => item.id === specializationId);
      if (specialization) {
        addDemoStaffSpecialization(parsed.profileId, specialization.id, specialization.name);
      }
    }

    const refreshedProfile = getDemoStaffProfiles().find((item) => item.id === parsed.profileId);
    if (refreshedProfile) {
      refreshedProfile.specializationNames = refreshedProfile.specializationIds
        .map((id) => allSpecializations.find((item) => item.id === id)?.name)
        .filter((name): name is string => Boolean(name));
    }
    updateDemoStaffProfile(parsed.profileId, {});

    revalidatePath("/personeel");
    revalidatePath(`/personeel/${parsed.profileId}`);
    return;
  }

  const supabase = await createSupabaseServerClient();
  await supabase.from("profile_specializations").delete().eq("profile_id", parsed.profileId);

  if (parsed.specializationIds.length) {
    const { error } = await supabase.from("profile_specializations").insert(
      parsed.specializationIds.map((specializationId) => ({
        profile_id: parsed.profileId,
        specialization_id: specializationId,
      })),
    );
    if (error) {
      throw new Error(error.message);
    }
  }

  revalidatePath("/personeel");
  revalidatePath(`/personeel/${parsed.profileId}`);
}

export function getActiveStaffCount(staff: StaffWorkspaceRow[]) {
  return staff.filter((profile) => profile.active).length;
}

export function getStaffOnLeaveCount(staff: StaffWorkspaceRow[]) {
  return staff.filter((profile) => profile.activeAbsenceCount > 0).length;
}

export function getLatestEvaluationCount(staff: StaffWorkspaceRow[], sinceIso: string) {
  return staff.filter(
    (profile) => profile.latestEvaluationAt && profile.latestEvaluationAt >= sinceIso,
  ).length;
}

export function getStatusLabel(profile: Pick<Profile, "active">, activeAbsenceCount: number) {
  if (!profile.active) return "inactief";
  if (activeAbsenceCount > 0) return "afwezig";
  return "actief";
}

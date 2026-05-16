"use server";

import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { buildFeedbackUrl } from "@/lib/feedback";
import {
  addStaffStrikepointsRecord,
  createStaffAbsenceRecord,
  createStaffEvaluationRecord,
  createStaffRewardRecord,
  removeStaffStrikepointsRecord,
  updateStaffProfileRecord,
  updateStaffSpecializationsRecord,
} from "@/lib/personnel";

export async function createStaffEvaluationAction(formData: FormData) {
  const employeeProfileId = String(formData.get("employeeProfileId") ?? "");
  try {
    const session = await requirePermission("staff.update");
    await createStaffEvaluationRecord(
      {
        employeeProfileId,
        title: String(formData.get("title") ?? ""),
        summary: String(formData.get("summary") ?? ""),
        evaluationPeriod: String(formData.get("evaluationPeriod") ?? ""),
        strengths: String(formData.get("strengths") ?? ""),
        attentionPoints: String(formData.get("attentionPoints") ?? ""),
        developmentPlan: String(formData.get("developmentPlan") ?? ""),
        outcome: String(formData.get("outcome") ?? ""),
      },
      session.userId,
    );
    redirect(buildFeedbackUrl(`/personeel/${employeeProfileId}`, "success", "Evaluatie opgeslagen."));
  } catch (error) {
    redirect(buildFeedbackUrl(`/personeel/${employeeProfileId}`, "error", error instanceof Error ? error.message : "Evaluatie kon niet worden opgeslagen."));
  }
}

export async function createStaffAbsenceAction(formData: FormData) {
  const profileId = String(formData.get("profileId") ?? "");
  try {
    await requirePermission("staff.update");
    await createStaffAbsenceRecord({
      profileId,
      absenceType: String(formData.get("absenceType") ?? ""),
      startDate: String(formData.get("startDate") ?? ""),
      endDate: String(formData.get("endDate") ?? ""),
      reason: String(formData.get("reason") ?? ""),
      status: String(formData.get("status") ?? ""),
    });
    redirect(buildFeedbackUrl(`/personeel/${profileId}`, "success", "Afwezigheid opgeslagen."));
  } catch (error) {
    redirect(buildFeedbackUrl(`/personeel/${profileId}`, "error", error instanceof Error ? error.message : "Afwezigheid kon niet worden opgeslagen."));
  }
}

export async function updateStaffProfileAction(formData: FormData) {
  const profileId = String(formData.get("profileId") ?? "");
  try {
    await requirePermission("staff.update");
    await updateStaffProfileRecord({
      profileId,
      callSign: String(formData.get("callSign") ?? ""),
      rankId: String(formData.get("rankId") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      status: String(formData.get("status") ?? "actief") as "actief" | "afwezig" | "non-actief",
    });
    redirect(buildFeedbackUrl(`/personeel/${profileId}`, "success", "Profiel bijgewerkt."));
  } catch (error) {
    redirect(buildFeedbackUrl(`/personeel/${profileId}`, "error", error instanceof Error ? error.message : "Profiel kon niet worden bijgewerkt."));
  }
}

export async function createStaffRewardAction(formData: FormData) {
  const profileId = String(formData.get("profileId") ?? "");
  try {
    const session = await requirePermission("staff.update");
    await createStaffRewardRecord(
      {
        profileId,
        title: String(formData.get("title") ?? ""),
        description: String(formData.get("description") ?? ""),
        amount: Number(formData.get("amount") ?? 0),
      },
      session.userId,
    );
    redirect(buildFeedbackUrl(`/personeel/${profileId}`, "success", "Beloning opgeslagen."));
  } catch (error) {
    redirect(buildFeedbackUrl(`/personeel/${profileId}`, "error", error instanceof Error ? error.message : "Beloning kon niet worden opgeslagen."));
  }
}

export async function addStaffStrikepointAction(formData: FormData) {
  const profileId = String(formData.get("profileId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim() || "Geen reden opgegeven";
  try {
    const session = await requirePermission("staff.update");
    await addStaffStrikepointsRecord(
      {
        profileId,
        amount: Number(formData.get("amount") ?? 1),
        reason,
      },
      session.userId,
    );
    redirect(buildFeedbackUrl(`/personeel/${profileId}`, "success", "Strikepoint toegevoegd."));
  } catch (error) {
    redirect(buildFeedbackUrl(`/personeel/${profileId}`, "error", error instanceof Error ? error.message : "Strikepoint kon niet worden toegevoegd."));
  }
}

export async function removeStaffStrikepointAction(formData: FormData) {
  const profileId = String(formData.get("profileId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim() || "Geen reden opgegeven";
  try {
    const session = await requirePermission("staff.update");
    await removeStaffStrikepointsRecord(
      {
        profileId,
        entryId: String(formData.get("entryId") ?? ""),
        reason,
      },
      session.userId,
    );
    redirect(buildFeedbackUrl(`/personeel/${profileId}`, "success", "Strikepoint verwijderd."));
  } catch (error) {
    redirect(buildFeedbackUrl(`/personeel/${profileId}`, "error", error instanceof Error ? error.message : "Strikepoint kon niet worden verwijderd."));
  }
}

export async function updateStaffSpecializationsAction(formData: FormData) {
  const profileId = String(formData.get("profileId") ?? "");
  const specializationIds = formData.getAll("specializationIds").map(String);
  try {
    await requirePermission("staff.update");
    await updateStaffSpecializationsRecord({
      profileId,
      specializationIds,
    });
    redirect(buildFeedbackUrl(`/personeel/${profileId}`, "success", "Specialisaties bijgewerkt."));
  } catch (error) {
    redirect(buildFeedbackUrl(`/personeel/${profileId}`, "error", error instanceof Error ? error.message : "Specialisaties konden niet worden bijgewerkt."));
  }
}

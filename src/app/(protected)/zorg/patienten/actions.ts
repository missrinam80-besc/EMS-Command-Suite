"use server";

import { redirect } from "next/navigation";
import { requireAnyPermission, requirePermission } from "@/lib/auth";
import { buildFeedbackUrl } from "@/lib/feedback";
import {
  createCaseRecord,
  createPatientRecord,
  deletePatientRecord,
  updatePatientCaseRecord,
  updatePatientProfile,
  updatePatientNotes,
} from "@/lib/patients";

export async function createPatientAction(formData: FormData) {
  try {
    await requirePermission("patients.create");

    const patientId = await createPatientRecord({
      fullName: String(formData.get("fullName") ?? ""),
      citizenId: String(formData.get("citizenId") ?? ""),
      birthDate: String(formData.get("birthDate") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      notes: String(formData.get("notes") ?? ""),
    });

    redirect(buildFeedbackUrl(`/zorg/patienten/${patientId}`, "success", "Patiëntendossier aangemaakt."));
  } catch (error) {
    redirect(buildFeedbackUrl("/zorg/patienten", "error", error instanceof Error ? error.message : "Patiënt kon niet worden aangemaakt."));
  }
}

export async function createCaseAction(formData: FormData) {
  const patientId = String(formData.get("patientId") ?? "");
  try {
    await requirePermission("cases.create");

    await createCaseRecord({
      patientId,
      title: String(formData.get("title") ?? ""),
      summary: String(formData.get("summary") ?? ""),
    });

    redirect(buildFeedbackUrl(`/zorg/patienten/${patientId}`, "success", "Case aangemaakt."));
  } catch (error) {
    redirect(buildFeedbackUrl(`/zorg/patienten/${patientId}`, "error", error instanceof Error ? error.message : "Case kon niet worden aangemaakt."));
  }
}

export async function updatePatientCaseAction(formData: FormData) {
  const patientId = String(formData.get("patientId") ?? "");
  const caseId = String(formData.get("caseId") ?? "");
  try {
    await requireAnyPermission(["cases.update", "cases.status.update"]);

    await updatePatientCaseRecord({
      patientId,
      caseId,
      title: String(formData.get("title") ?? ""),
      summary: String(formData.get("summary") ?? ""),
      status: String(formData.get("status") ?? "open") as
        | "open"
        | "afgesloten"
        | "gearchiveerd"
        | "in_onderzoek"
        | "in_wacht",
    });

    redirect(buildFeedbackUrl(`/zorg/patienten/${patientId}/cases/${caseId}`, "success", "Case bijgewerkt."));
  } catch (error) {
    redirect(buildFeedbackUrl(`/zorg/patienten/${patientId}/cases/${caseId}/bewerken`, "error", error instanceof Error ? error.message : "Case kon niet worden bijgewerkt."));
  }
}

export async function updatePatientNotesAction(formData: FormData) {
  const patientId = String(formData.get("patientId") ?? "");
  const notes = String(formData.get("notes") ?? "");
  try {
    await requirePermission("patients.update");
    await updatePatientNotes(patientId, notes);
    redirect(buildFeedbackUrl(`/zorg/patienten/${patientId}`, "success", "Notities opgeslagen."));
  } catch (error) {
    redirect(buildFeedbackUrl(`/zorg/patienten/${patientId}`, "error", error instanceof Error ? error.message : "Notities konden niet worden opgeslagen."));
  }
}

export async function updatePatientProfileAction(formData: FormData) {
  const patientId = String(formData.get("patientId") ?? "");
  const statusValue = String(formData.get("status") ?? "").trim();
  try {
    await requirePermission("patients.update");

    await updatePatientProfile({
      patientId,
      fullName: String(formData.get("fullName") ?? ""),
      citizenId: String(formData.get("citizenId") ?? ""),
      birthDate: String(formData.get("birthDate") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      emergencyContactName: String(formData.get("emergencyContactName") ?? ""),
      emergencyContactPhone: String(formData.get("emergencyContactPhone") ?? ""),
      bloodType: String(formData.get("bloodType") ?? ""),
      allergies: splitTextareaValues(formData.get("allergies")),
      medications: splitTextareaValues(formData.get("medications")),
      chronicConditions: splitTextareaValues(formData.get("chronicConditions")),
      medicalWarnings: splitTextareaValues(formData.get("medicalWarnings")),
      warningBadges: splitTextareaValues(formData.get("warningBadges")),
      status: statusValue
        ? (statusValue as
            | "actief_in_behandeling"
            | "opgenomen"
            | "observatie"
            | "stabiel_ontslagen"
            | "overleden"
            | "forensisch_politie")
        : undefined,
    });

    redirect(buildFeedbackUrl(`/zorg/patienten/${patientId}`, "success", "Patiëntfiche bijgewerkt."));
  } catch (error) {
    redirect(buildFeedbackUrl(`/zorg/patienten/${patientId}`, "error", error instanceof Error ? error.message : "Patiëntfiche kon niet worden bijgewerkt."));
  }
}

export async function deletePatientAction(formData: FormData) {
  const patientId = String(formData.get("patientId") ?? "");
  const confirmDelete = String(formData.get("confirmDelete") ?? "");
  try {
    await requirePermission("patients.soft_delete");
    if (confirmDelete !== "VERWIJDER") {
      throw new Error("Bevestiging ongeldig.");
    }
    await deletePatientRecord(patientId);
    redirect(buildFeedbackUrl("/zorg/patienten", "success", "Patiëntfiche gedeactiveerd."));
  } catch (error) {
    redirect(buildFeedbackUrl(`/zorg/patienten/${patientId}`, "error", error instanceof Error ? error.message : "Patiëntfiche kon niet worden verwijderd."));
  }
}

function splitTextareaValues(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

"use server";

import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { buildFeedbackUrl } from "@/lib/feedback";
import { createTraumaReport } from "@/lib/reports";

export async function createTraumaReportAction(formData: FormData) {
  const patientId = String(formData.get("patientId") ?? "");
  try {
    await requirePermission("reports.create");
    await createTraumaReport({
      patientId,
      caseId: String(formData.get("caseId") ?? ""),
      title: String(formData.get("title") ?? ""),
      summary: String(formData.get("summary") ?? ""),
      incidentLocation: String(formData.get("incidentLocation") ?? ""),
      mechanism: String(formData.get("mechanism") ?? ""),
      triageLevel: String(formData.get("triageLevel") ?? ""),
      consciousness: String(formData.get("consciousness") ?? ""),
      injuriesSummary: String(formData.get("injuriesSummary") ?? ""),
      vitals: String(formData.get("vitals") ?? ""),
      interventions: String(formData.get("interventions") ?? ""),
      transportDecision: String(formData.get("transportDecision") ?? ""),
      followUp: String(formData.get("followUp") ?? ""),
    });
    redirect(buildFeedbackUrl(`/zorg/patienten/${patientId}`, "success", "Traumarapport opgeslagen."));
  } catch (error) {
    redirect(buildFeedbackUrl(`/zorg/patienten/${patientId}/rapporten/trauma/nieuw`, "error", error instanceof Error ? error.message : "Traumarapport kon niet worden opgeslagen."));
  }
}

"use server";

import { redirect } from "next/navigation";
import { requireAnyPermission } from "@/lib/auth";
import { buildFeedbackUrl } from "@/lib/feedback";
import { updateTraumaReport } from "@/lib/reports";

export async function updateTraumaReportAction(formData: FormData) {
  const patientId = String(formData.get("patientId") ?? "");
  const reportId = String(formData.get("reportId") ?? "");
  try {
    await requireAnyPermission(["reports.update", "reports.update_own"]);
    await updateTraumaReport(reportId, {
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
    redirect(buildFeedbackUrl(`/zorg/patienten/${patientId}`, "success", "Traumarapport bijgewerkt."));
  } catch (error) {
    redirect(buildFeedbackUrl(`/zorg/patienten/${patientId}/rapporten/trauma/${reportId}/bewerken`, "error", error instanceof Error ? error.message : "Traumarapport kon niet worden bijgewerkt."));
  }
}

"use server";

import { redirect } from "next/navigation";
import { requireReportEditAccess } from "@/lib/auth";
import { buildFeedbackUrl } from "@/lib/feedback";
import { updateOpnameReport } from "@/lib/reports";

export async function updateOpnameReportAction(formData: FormData) {
  const patientId = String(formData.get("patientId") ?? "");
  const reportId = String(formData.get("reportId") ?? "");
  try {
    await requireReportEditAccess({
      patientId,
      reportId,
      reportType: "opname",
      forbiddenRedirectPath: `/zorg/patienten/${patientId}/rapporten/opname/${reportId}`,
    });
    await updateOpnameReport(reportId, {
      patientId,
      caseId: String(formData.get("caseId") ?? ""),
      title: String(formData.get("title") ?? ""),
      summary: String(formData.get("summary") ?? ""),
      admissionReason: String(formData.get("admissionReason") ?? ""),
      referringUnit: String(formData.get("referringUnit") ?? ""),
      attendingDoctor: String(formData.get("attendingDoctor") ?? ""),
      supportingStaff: String(formData.get("supportingStaff") ?? ""),
      clinicalStatus: String(formData.get("clinicalStatus") ?? ""),
      provisionalDiagnosis: String(formData.get("provisionalDiagnosis") ?? ""),
      startedCare: String(formData.get("startedCare") ?? ""),
      medicationPlan: String(formData.get("medicationPlan") ?? ""),
      admissionPlan: String(formData.get("admissionPlan") ?? ""),
      wardNotes: String(formData.get("wardNotes") ?? ""),
    });
    redirect(buildFeedbackUrl(`/zorg/patienten/${patientId}`, "success", "Opnamerapport bijgewerkt."));
  } catch (error) {
    redirect(buildFeedbackUrl(`/zorg/patienten/${patientId}/rapporten/opname/${reportId}/bewerken`, "error", error instanceof Error ? error.message : "Opnamerapport kon niet worden bijgewerkt."));
  }
}

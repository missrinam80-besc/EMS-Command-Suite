"use server";

import { redirect } from "next/navigation";
import { requireReportEditAccess } from "@/lib/auth";
import { buildFeedbackUrl } from "@/lib/feedback";
import { mapOpnameReportInput } from "@/lib/report-action-input";
import { rethrowIfRedirectError } from "@/lib/redirect-error";
import {
  getActiveRuntimeReportTemplate,
  validateRuntimeFieldValues,
} from "@/lib/report-template-runtime";
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
    const template = await getActiveRuntimeReportTemplate("opname");
    const input = mapOpnameReportInput(formData, template);
    if (template) {
      const validationErrors = validateRuntimeFieldValues(input.dynamicFields ?? {}, template.fields);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors[0]);
      }
    }

    await updateOpnameReport(reportId, input);
    redirect(buildFeedbackUrl(`/zorg/patienten/${patientId}`, "success", "Opnamerapport bijgewerkt."));
  } catch (error) {
    rethrowIfRedirectError(error);
    redirect(buildFeedbackUrl(`/zorg/patienten/${patientId}/rapporten/opname/${reportId}/bewerken`, "error", error instanceof Error ? error.message : "Opnamerapport kon niet worden bijgewerkt."));
  }
}

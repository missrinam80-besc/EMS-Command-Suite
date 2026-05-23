"use server";

import { redirect } from "next/navigation";
import { requireReportEditAccess } from "@/lib/auth";
import { buildFeedbackUrl } from "@/lib/feedback";
import { mapTraumaReportInput } from "@/lib/report-action-input";
import { rethrowIfRedirectError } from "@/lib/redirect-error";
import {
  getActiveRuntimeReportTemplate,
  validateRuntimeFieldValues,
} from "@/lib/report-template-runtime";
import { updateTraumaReport } from "@/lib/reports";

export async function updateTraumaReportAction(formData: FormData) {
  const patientId = String(formData.get("patientId") ?? "");
  const reportId = String(formData.get("reportId") ?? "");
  try {
    await requireReportEditAccess({
      patientId,
      reportId,
      reportType: "trauma",
      forbiddenRedirectPath: `/zorg/patienten/${patientId}/rapporten/trauma/${reportId}`,
    });
    const template = await getActiveRuntimeReportTemplate("trauma");
    const input = mapTraumaReportInput(formData, template);
    if (template) {
      const validationErrors = validateRuntimeFieldValues(input.dynamicFields ?? {}, template.fields);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors[0]);
      }
    }

    await updateTraumaReport(reportId, input);
    redirect(buildFeedbackUrl(`/zorg/patienten/${patientId}`, "success", "Traumarapport bijgewerkt."));
  } catch (error) {
    rethrowIfRedirectError(error);
    redirect(buildFeedbackUrl(`/zorg/patienten/${patientId}/rapporten/trauma/${reportId}/bewerken`, "error", error instanceof Error ? error.message : "Traumarapport kon niet worden bijgewerkt."));
  }
}

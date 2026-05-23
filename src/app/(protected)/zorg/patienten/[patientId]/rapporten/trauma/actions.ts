"use server";

import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { buildFeedbackUrl } from "@/lib/feedback";
import { mapTraumaReportInput } from "@/lib/report-action-input";
import { rethrowIfRedirectError } from "@/lib/redirect-error";
import {
  getActiveRuntimeReportTemplate,
  validateRuntimeFieldValues,
} from "@/lib/report-template-runtime";
import { createTraumaReport } from "@/lib/reports";

export async function createTraumaReportAction(formData: FormData) {
  const patientId = String(formData.get("patientId") ?? "");
  try {
    await requirePermission("reports.create");
    const template = await getActiveRuntimeReportTemplate("trauma");
    const input = mapTraumaReportInput(formData, template);
    if (template) {
      const validationErrors = validateRuntimeFieldValues(input.dynamicFields ?? {}, template.fields);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors[0]);
      }
    }

    await createTraumaReport(input);
    redirect(buildFeedbackUrl(`/zorg/patienten/${patientId}`, "success", "Traumarapport opgeslagen."));
  } catch (error) {
    rethrowIfRedirectError(error);
    redirect(buildFeedbackUrl(`/zorg/patienten/${patientId}/rapporten/trauma/nieuw`, "error", error instanceof Error ? error.message : "Traumarapport kon niet worden opgeslagen."));
  }
}

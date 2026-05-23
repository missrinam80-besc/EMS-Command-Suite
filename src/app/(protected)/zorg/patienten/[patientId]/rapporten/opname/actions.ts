"use server";

import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { buildFeedbackUrl } from "@/lib/feedback";
import { mapOpnameReportInput } from "@/lib/report-action-input";
import { rethrowIfRedirectError } from "@/lib/redirect-error";
import {
  getActiveRuntimeReportTemplate,
  validateRuntimeFieldValues,
} from "@/lib/report-template-runtime";
import { createOpnameReport } from "@/lib/reports";

export async function createOpnameReportAction(formData: FormData) {
  const patientId = String(formData.get("patientId") ?? "");
  try {
    await requirePermission("reports.create");
    const template = await getActiveRuntimeReportTemplate("opname");
    const input = mapOpnameReportInput(formData, template);
    if (template) {
      const validationErrors = validateRuntimeFieldValues(input.dynamicFields ?? {}, template.fields);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors[0]);
      }
    }

    await createOpnameReport(input);
    redirect(buildFeedbackUrl(`/zorg/patienten/${patientId}`, "success", "Opnamerapport opgeslagen."));
  } catch (error) {
    rethrowIfRedirectError(error);
    redirect(buildFeedbackUrl(`/zorg/patienten/${patientId}/rapporten/opname/nieuw`, "error", error instanceof Error ? error.message : "Opnamerapport kon niet worden opgeslagen."));
  }
}

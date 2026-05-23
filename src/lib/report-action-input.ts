import type { z } from "zod";
import {
  extractRuntimeFieldValues,
  type RuntimeReportTemplate,
} from "@/lib/report-template-runtime";
import { opnameReportSchema, traumaReportSchema } from "@/lib/reports";

type TraumaInput = z.infer<typeof traumaReportSchema>;
type OpnameInput = z.infer<typeof opnameReportSchema>;

function readString(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "");
}

export function mapTraumaReportInput(
  formData: FormData,
  template: RuntimeReportTemplate | null,
): TraumaInput {
  return {
    patientId: readString(formData, "patientId"),
    caseId: readString(formData, "caseId"),
    title: readString(formData, "title"),
    summary: readString(formData, "summary"),
    incidentLocation: readString(formData, "incidentLocation"),
    mechanism: readString(formData, "mechanism"),
    triageLevel: readString(formData, "triageLevel"),
    consciousness: readString(formData, "consciousness"),
    injuriesSummary: readString(formData, "injuriesSummary"),
    vitals: readString(formData, "vitals"),
    interventions: readString(formData, "interventions"),
    transportDecision: readString(formData, "transportDecision"),
    followUp: readString(formData, "followUp"),
    dynamicFields: template ? extractRuntimeFieldValues(formData, template.fields) : {},
    templateCode: template?.code ?? "",
  };
}

export function mapOpnameReportInput(
  formData: FormData,
  template: RuntimeReportTemplate | null,
): OpnameInput {
  return {
    patientId: readString(formData, "patientId"),
    caseId: readString(formData, "caseId"),
    title: readString(formData, "title"),
    summary: readString(formData, "summary"),
    admissionReason: readString(formData, "admissionReason"),
    referringUnit: readString(formData, "referringUnit"),
    attendingDoctor: readString(formData, "attendingDoctor"),
    supportingStaff: readString(formData, "supportingStaff"),
    clinicalStatus: readString(formData, "clinicalStatus"),
    provisionalDiagnosis: readString(formData, "provisionalDiagnosis"),
    startedCare: readString(formData, "startedCare"),
    medicationPlan: readString(formData, "medicationPlan"),
    admissionPlan: readString(formData, "admissionPlan"),
    wardNotes: readString(formData, "wardNotes"),
    dynamicFields: template ? extractRuntimeFieldValues(formData, template.fields) : {},
    templateCode: template?.code ?? "",
  };
}

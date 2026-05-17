import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  addDemoPatientAuditLog,
  addDemoReport,
  getDemoReports,
  getDemoStaffProfiles,
  updateDemoReport,
  updateDemoPatient,
} from "@/lib/demo-store";
import { writeAuditLog } from "@/lib/audit";
import { shouldUseDemoData } from "@/lib/env";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  MedicalReport,
  OpnameReportContent,
  TraumaReportContent,
} from "@/types/domain";

export const traumaReportSchema = z.object({
  patientId: z.string().trim().min(1, "Patient ontbreekt."),
  caseId: z.string().trim().optional(),
  title: z.string().trim().min(4, "Titel is verplicht."),
  summary: z.string().trim().min(3, "Samenvatting is te kort."),
  incidentLocation: z.string().trim().optional(),
  mechanism: z.string().trim().optional(),
  triageLevel: z.string().trim().optional(),
  consciousness: z.string().trim().optional(),
  injuriesSummary: z.string().trim().optional(),
  vitals: z.string().trim().optional(),
  interventions: z.string().trim().optional(),
  transportDecision: z.string().trim().optional(),
  followUp: z.string().trim().optional(),
});

export const opnameReportSchema = z.object({
  patientId: z.string().trim().min(1, "Patient ontbreekt."),
  caseId: z.string().trim().optional(),
  title: z.string().trim().min(4, "Titel is verplicht."),
  summary: z.string().trim().min(3, "Samenvatting is te kort."),
  admissionReason: z.string().trim().optional(),
  referringUnit: z.string().trim().optional(),
  attendingDoctor: z.string().trim().optional(),
  supportingStaff: z.string().trim().optional(),
  clinicalStatus: z.string().trim().optional(),
  provisionalDiagnosis: z.string().trim().optional(),
  startedCare: z.string().trim().optional(),
  medicationPlan: z.string().trim().optional(),
  admissionPlan: z.string().trim().optional(),
  wardNotes: z.string().trim().optional(),
});

type ReportType = "trauma" | "opname";

function normalizeReport(report: {
  id: string;
  patient_id: string;
  case_id: string | null;
  report_type_code: string;
  title: string;
  summary: string | null;
  content: unknown;
  author_profile_id: string | null;
  created_at: string;
  updated_at?: string | null;
}): MedicalReport {
  return {
    id: report.id,
    patientId: report.patient_id,
    caseId: report.case_id,
    type: report.report_type_code as MedicalReport["type"],
    title: report.title,
    summary: report.summary ?? "",
    content: (report.content as MedicalReport["content"]) ?? {},
    authorProfileId: report.author_profile_id ?? "",
    createdAt: report.created_at,
    updatedAt: report.updated_at ?? report.created_at,
  };
}

export async function getReportAuthorLabel(authorProfileId: string) {
  if (!authorProfileId) return "Onbekend";

  if (shouldUseDemoData()) {
    const profile = getDemoStaffProfiles().find((item) => item.id === authorProfileId);
    return profile?.fullName ?? authorProfileId;
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", authorProfileId)
    .single();

  return data?.full_name ?? authorProfileId;
}

async function getReportsByPatient(
  patientId: string,
  reportType: ReportType,
): Promise<MedicalReport[]> {
  if (shouldUseDemoData()) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("medical_reports")
    .select("*")
    .eq("patient_id", patientId)
    .eq("report_type_code", reportType)
    .order("created_at", { ascending: false });

  if (error) {
    return [];
  }

  return (data ?? []).map(normalizeReport);
}

export async function getAllMedicalReports(): Promise<MedicalReport[]> {
  if (shouldUseDemoData()) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("medical_reports")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return [];
  }

  return (data ?? []).map(normalizeReport);
}

export async function getReportById(
  patientId: string,
  reportType: ReportType,
  reportId: string,
): Promise<MedicalReport | null> {
  if (shouldUseDemoData()) {
    return (
      getDemoReports().find(
        (report) =>
          report.id === reportId &&
          report.patientId === patientId &&
          report.type === reportType,
      ) ?? null
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("medical_reports")
    .select("*")
    .eq("id", reportId)
    .eq("patient_id", patientId)
    .eq("report_type_code", reportType)
    .single();

  if (error || !data) {
    return null;
  }

  return normalizeReport(data);
}

export async function getTraumaReportsByPatient(patientId: string): Promise<MedicalReport[]> {
  return getReportsByPatient(patientId, "trauma");
}

export async function getOpnameReportsByPatient(patientId: string): Promise<MedicalReport[]> {
  return getReportsByPatient(patientId, "opname");
}

export async function createTraumaReport(input: z.infer<typeof traumaReportSchema>) {
  const parsed = traumaReportSchema.parse(input);

  const content: TraumaReportContent = {
    incidentLocation: parsed.incidentLocation,
    mechanism: parsed.mechanism,
    triageLevel: parsed.triageLevel,
    consciousness: parsed.consciousness,
    injuriesSummary: parsed.injuriesSummary,
    vitals: parsed.vitals,
    interventions: parsed.interventions,
    transportDecision: parsed.transportDecision,
    followUp: parsed.followUp,
  };

  if (shouldUseDemoData()) {
    const now = new Date().toISOString();
    addDemoReport({
      id: randomUUID(),
      patientId: parsed.patientId,
      caseId: parsed.caseId || null,
      type: "trauma",
      title: parsed.title,
      summary: parsed.summary,
      content,
      authorProfileId: "demo-user",
      createdAt: now,
      updatedAt: now,
    });
    updateDemoPatient(parsed.patientId, { updatedBy: "demo-user", updatedAt: now });
    addDemoPatientAuditLog({
      id: randomUUID(),
      patientId: parsed.patientId,
      action: "report_created",
      actorProfileId: "demo-user",
      actorName: "Demo EMS gebruiker",
      summary: `Traumarapport toegevoegd: ${parsed.title}`,
      createdAt: now,
      details: { reportType: "trauma" },
    });

    revalidatePath(`/zorg/patienten/${parsed.patientId}`);
    revalidatePath(`/zorg/patienten/${parsed.patientId}/rapporten/trauma/nieuw`);
    return;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("medical_reports")
    .insert({
      patient_id: parsed.patientId,
      case_id: parsed.caseId || null,
      report_type_code: "trauma",
      title: parsed.title,
      summary: parsed.summary,
      content,
      author_profile_id: user?.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error.message);
  }

  await writeAuditLog(supabase, {
    targetType: "medical_report",
    targetId: data.id,
    patientId: parsed.patientId,
    action: "report_created",
    summary: `Traumarapport toegevoegd: ${parsed.title}`,
    afterState: {
      reportType: "trauma",
      title: parsed.title,
      summary: parsed.summary,
      caseId: parsed.caseId || null,
    },
    changedFields: ["report_type_code", "title", "summary", "case_id", "content"],
    context: { report_type: "trauma" },
  });

  revalidatePath(`/zorg/patienten/${parsed.patientId}`);
  revalidatePath(`/zorg/patienten/${parsed.patientId}/rapporten/trauma/nieuw`);
}

export async function createOpnameReport(input: z.infer<typeof opnameReportSchema>) {
  const parsed = opnameReportSchema.parse(input);

  const content: OpnameReportContent = {
    admissionReason: parsed.admissionReason,
    referringUnit: parsed.referringUnit,
    attendingDoctor: parsed.attendingDoctor,
    supportingStaff: parsed.supportingStaff,
    clinicalStatus: parsed.clinicalStatus,
    provisionalDiagnosis: parsed.provisionalDiagnosis,
    startedCare: parsed.startedCare,
    medicationPlan: parsed.medicationPlan,
    admissionPlan: parsed.admissionPlan,
    wardNotes: parsed.wardNotes,
  };

  if (shouldUseDemoData()) {
    const now = new Date().toISOString();
    addDemoReport({
      id: randomUUID(),
      patientId: parsed.patientId,
      caseId: parsed.caseId || null,
      type: "opname",
      title: parsed.title,
      summary: parsed.summary,
      content,
      authorProfileId: "demo-user",
      createdAt: now,
      updatedAt: now,
    });
    updateDemoPatient(parsed.patientId, { updatedBy: "demo-user", updatedAt: now });
    addDemoPatientAuditLog({
      id: randomUUID(),
      patientId: parsed.patientId,
      action: "report_created",
      actorProfileId: "demo-user",
      actorName: "Demo EMS gebruiker",
      summary: `Opnamerapport toegevoegd: ${parsed.title}`,
      createdAt: now,
      details: { reportType: "opname" },
    });

    revalidatePath(`/zorg/patienten/${parsed.patientId}`);
    revalidatePath(`/zorg/patienten/${parsed.patientId}/rapporten/opname/nieuw`);
    return;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("medical_reports")
    .insert({
      patient_id: parsed.patientId,
      case_id: parsed.caseId || null,
      report_type_code: "opname",
      title: parsed.title,
      summary: parsed.summary,
      content,
      author_profile_id: user?.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error.message);
  }

  await writeAuditLog(supabase, {
    targetType: "medical_report",
    targetId: data.id,
    patientId: parsed.patientId,
    action: "report_created",
    summary: `Opnamerapport toegevoegd: ${parsed.title}`,
    afterState: {
      reportType: "opname",
      title: parsed.title,
      summary: parsed.summary,
      caseId: parsed.caseId || null,
    },
    changedFields: ["report_type_code", "title", "summary", "case_id", "content"],
    context: { report_type: "opname" },
  });

  revalidatePath(`/zorg/patienten/${parsed.patientId}`);
  revalidatePath(`/zorg/patienten/${parsed.patientId}/rapporten/opname/nieuw`);
}

export async function updateTraumaReport(
  reportId: string,
  input: z.infer<typeof traumaReportSchema>,
) {
  const parsed = traumaReportSchema.parse(input);
  const content: TraumaReportContent = {
    incidentLocation: parsed.incidentLocation,
    mechanism: parsed.mechanism,
    triageLevel: parsed.triageLevel,
    consciousness: parsed.consciousness,
    injuriesSummary: parsed.injuriesSummary,
    vitals: parsed.vitals,
    interventions: parsed.interventions,
    transportDecision: parsed.transportDecision,
    followUp: parsed.followUp,
  };

  if (shouldUseDemoData()) {
    const now = new Date().toISOString();
    updateDemoReport(reportId, {
      caseId: parsed.caseId || null,
      title: parsed.title,
      summary: parsed.summary,
      content,
    });
    updateDemoPatient(parsed.patientId, { updatedBy: "demo-user", updatedAt: now });
    addDemoPatientAuditLog({
      id: randomUUID(),
      patientId: parsed.patientId,
      action: "report_updated",
      actorProfileId: "demo-user",
      actorName: "Demo EMS gebruiker",
      summary: `Traumarapport bijgewerkt: ${parsed.title}`,
      createdAt: now,
      details: { reportType: "trauma", reportId },
    });
    revalidatePath(`/zorg/patienten/${parsed.patientId}`);
    revalidatePath(`/zorg/patienten/${parsed.patientId}/rapporten/trauma/${reportId}`);
    revalidatePath(`/zorg/patienten/${parsed.patientId}/rapporten/trauma/${reportId}/bewerken`);
    return;
  }

  const supabase = await createSupabaseServerClient();
  const { data: existing } = await supabase.from("medical_reports").select("*").eq("id", reportId).single();
  const { error } = await supabase
    .from("medical_reports")
    .update({
      case_id: parsed.caseId || null,
      title: parsed.title,
      summary: parsed.summary,
      content,
      updated_by: (await supabase.auth.getUser()).data.user?.id ?? null,
    })
    .eq("id", reportId)
    .eq("patient_id", parsed.patientId)
    .eq("report_type_code", "trauma");

  if (error) {
    throw new Error(error.message);
  }

  await writeAuditLog(supabase, {
    targetType: "medical_report",
    targetId: reportId,
    patientId: parsed.patientId,
    action: "report_updated",
    summary: `Traumarapport bijgewerkt: ${parsed.title}`,
    beforeState: existing ?? null,
    afterState: {
      reportType: "trauma",
      title: parsed.title,
      summary: parsed.summary,
      caseId: parsed.caseId || null,
    },
    changedFields: ["case_id", "title", "summary", "content"],
    context: { report_type: "trauma" },
  });

  revalidatePath(`/zorg/patienten/${parsed.patientId}`);
  revalidatePath(`/zorg/patienten/${parsed.patientId}/rapporten/trauma/${reportId}`);
  revalidatePath(`/zorg/patienten/${parsed.patientId}/rapporten/trauma/${reportId}/bewerken`);
}

export async function updateOpnameReport(
  reportId: string,
  input: z.infer<typeof opnameReportSchema>,
) {
  const parsed = opnameReportSchema.parse(input);
  const content: OpnameReportContent = {
    admissionReason: parsed.admissionReason,
    referringUnit: parsed.referringUnit,
    attendingDoctor: parsed.attendingDoctor,
    supportingStaff: parsed.supportingStaff,
    clinicalStatus: parsed.clinicalStatus,
    provisionalDiagnosis: parsed.provisionalDiagnosis,
    startedCare: parsed.startedCare,
    medicationPlan: parsed.medicationPlan,
    admissionPlan: parsed.admissionPlan,
    wardNotes: parsed.wardNotes,
  };

  if (shouldUseDemoData()) {
    const now = new Date().toISOString();
    updateDemoReport(reportId, {
      caseId: parsed.caseId || null,
      title: parsed.title,
      summary: parsed.summary,
      content,
    });
    updateDemoPatient(parsed.patientId, { updatedBy: "demo-user", updatedAt: now });
    addDemoPatientAuditLog({
      id: randomUUID(),
      patientId: parsed.patientId,
      action: "report_updated",
      actorProfileId: "demo-user",
      actorName: "Demo EMS gebruiker",
      summary: `Opnamerapport bijgewerkt: ${parsed.title}`,
      createdAt: now,
      details: { reportType: "opname", reportId },
    });
    revalidatePath(`/zorg/patienten/${parsed.patientId}`);
    revalidatePath(`/zorg/patienten/${parsed.patientId}/rapporten/opname/${reportId}`);
    revalidatePath(`/zorg/patienten/${parsed.patientId}/rapporten/opname/${reportId}/bewerken`);
    return;
  }

  const supabase = await createSupabaseServerClient();
  const { data: existing } = await supabase.from("medical_reports").select("*").eq("id", reportId).single();
  const { error } = await supabase
    .from("medical_reports")
    .update({
      case_id: parsed.caseId || null,
      title: parsed.title,
      summary: parsed.summary,
      content,
      updated_by: (await supabase.auth.getUser()).data.user?.id ?? null,
    })
    .eq("id", reportId)
    .eq("patient_id", parsed.patientId)
    .eq("report_type_code", "opname");

  if (error) {
    throw new Error(error.message);
  }

  await writeAuditLog(supabase, {
    targetType: "medical_report",
    targetId: reportId,
    patientId: parsed.patientId,
    action: "report_updated",
    summary: `Opnamerapport bijgewerkt: ${parsed.title}`,
    beforeState: existing ?? null,
    afterState: {
      reportType: "opname",
      title: parsed.title,
      summary: parsed.summary,
      caseId: parsed.caseId || null,
    },
    changedFields: ["case_id", "title", "summary", "content"],
    context: { report_type: "opname" },
  });

  revalidatePath(`/zorg/patienten/${parsed.patientId}`);
  revalidatePath(`/zorg/patienten/${parsed.patientId}/rapporten/opname/${reportId}`);
  revalidatePath(`/zorg/patienten/${parsed.patientId}/rapporten/opname/${reportId}/bewerken`);
}




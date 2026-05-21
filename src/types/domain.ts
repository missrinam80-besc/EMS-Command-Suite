export type Rank = {
  id: string;
  code: string;
  name: string;
  weight: number;
  baseSalary?: number;
};

export type Specialization = {
  id: string;
  code: string;
  name: string;
  salaryBonus?: number;
};

export type Profile = {
  id: string;
  email: string;
  fullName: string;
  citizenId: string;
  rankId: string;
  active: boolean;
};

export type StaffProfile = Profile & {
  callSign: string;
  rankName: string;
  specializationIds: string[];
  specializationNames: string[];
  statusOverride?: "actief" | "afwezig" | "non-actief" | null;
  toolPassword?: string | null;
  phone?: string | null;
  joinedAt?: string | null;
  lastModifiedAt?: string | null;
  salaryMonthly?: number | null;
  strikePoints: number;
};

export type StaffEvaluationContent = {
  evaluationPeriod?: string;
  strengths?: string;
  attentionPoints?: string;
  developmentPlan?: string;
  outcome?: string;
};

export type StaffEvaluation = {
  id: string;
  employeeProfileId: string;
  evaluatorProfileId: string;
  title: string;
  summary: string;
  content: StaffEvaluationContent;
  createdAt: string;
  updatedAt?: string | null;
};

export type StaffAbsence = {
  id: string;
  profileId: string;
  absenceType: string;
  startDate: string;
  endDate: string;
  reason?: string | null;
  status: string;
  decidedBy?: string | null;
  createdAt: string;
};

export type StaffReward = {
  id: string;
  profileId: string;
  title: string;
  description?: string | null;
  amount?: number | null;
  grantedBy?: string | null;
  grantedAt: string;
};

export type StaffStrikepointEntry = {
  id: string;
  profileId: string;
  delta: number;
  reason: string;
  createdBy?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
  resolvedBy?: string | null;
  resolvedReason?: string | null;
};

export type MeetingStatus =
  | "aangevraagd"
  | "goedgekeurd"
  | "gepland"
  | "afgerond"
  | "geannuleerd"
  | "geweigerd";

export type MeetingActionStatus =
  | "open"
  | "in_uitvoering"
  | "geblokkeerd"
  | "afgerond";

export type Meeting = {
  id: string;
  title: string;
  purpose?: string | null;
  location?: string | null;
  requestedDate?: string | null;
  participantProfileIds: string[];
  status: MeetingStatus;
  requestedBy?: string | null;
  decidedBy?: string | null;
  decisionNote?: string | null;
  scheduledStart?: string | null;
  scheduledEnd?: string | null;
  minutes?: string | null;
  followUp?: string | null;
  createdAt: string;
  updatedAt?: string | null;
};

export type MeetingActionItem = {
  id: string;
  meetingId: string;
  title: string;
  description?: string | null;
  ownerProfileId?: string | null;
  dueDate?: string | null;
  status: MeetingActionStatus;
  createdBy?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt?: string | null;
};

export type Patient = {
  id: string;
  citizenId: string;
  fullName: string;
  birthDate?: string | null;
  phone?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  bloodType?: string | null;
  allergies?: string[];
  medications?: string[];
  chronicConditions?: string[];
  medicalWarnings?: string[];
  warningBadges?: string[];
  status?: PatientStatus | null;
  createdBy?: string | null;
  createdAt?: string | null;
  updatedBy?: string | null;
  updatedAt?: string | null;
  notes?: string | null;
};

export type PatientStatus =
  | "actief_in_behandeling"
  | "opgenomen"
  | "observatie"
  | "stabiel_ontslagen"
  | "overleden"
  | "forensisch_politie";

export type PatientCase = {
  id: string;
  patientId: string;
  title: string;
  summary?: string | null;
  status: "open" | "afgesloten" | "gearchiveerd" | "in_onderzoek" | "in_wacht";
  openedAt: string;
  closedAt?: string | null;
};

export type PatientTreatmentEntryType = "behandeling" | "medicatie";

export type PatientTreatmentEntry = {
  id: string;
  patientId: string;
  caseId?: string | null;
  entryType: PatientTreatmentEntryType;
  title: string;
  description?: string | null;
  dosage?: string | null;
  quantity: number;
  unitCost: number;
  totalCost: number;
  currency: string;
  isBillable: boolean;
  performedAt: string;
  performedBy?: string | null;
  createdAt: string;
  updatedAt?: string | null;
};

export type MedicalReportType =
  | "trauma"
  | "opname"
  | "evaluatie_medisch"
  | "extern";

export type TraumaReportContent = {
  incidentLocation?: string;
  mechanism?: string;
  triageLevel?: string;
  consciousness?: string;
  injuriesSummary?: string;
  vitals?: string;
  interventions?: string;
  transportDecision?: string;
  followUp?: string;
};

export type OpnameReportContent = {
  admissionReason?: string;
  referringUnit?: string;
  attendingDoctor?: string;
  supportingStaff?: string;
  clinicalStatus?: string;
  provisionalDiagnosis?: string;
  startedCare?: string;
  medicationPlan?: string;
  admissionPlan?: string;
  wardNotes?: string;
};

export type MedicalReport = {
  id: string;
  caseId: string | null;
  patientId: string;
  type: MedicalReportType;
  title: string;
  summary: string;
  content: TraumaReportContent | OpnameReportContent | Record<string, unknown>;
  authorProfileId: string;
  createdAt: string;
  updatedAt?: string | null;
};

export type PatientAuditLog = {
  id: string;
  patientId: string;
  action:
    | "patient_created"
    | "patient_updated"
    | "patient_deleted"
    | "notes_updated"
    | "case_created"
    | "case_updated"
    | "report_created"
    | "report_updated"
    | "treatment_entry_created"
    | "treatment_entry_deleted";
  actorProfileId: string;
  actorName?: string | null;
  summary: string;
  createdAt: string;
  details?: Record<string, unknown> | null;
};

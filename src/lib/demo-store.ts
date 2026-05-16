import {
  mockCases,
  mockPatientAuditLogs,
  mockPatients,
  mockReports,
  mockStaffAbsences,
  mockStaffEvaluations,
  mockStaffProfiles,
  mockStaffRewards,
  mockStaffStrikepointEntries,
} from "@/lib/mock-data";
import type {
  MedicalReport,
  Patient,
  PatientAuditLog,
  PatientCase,
  StaffAbsence,
  StaffEvaluation,
  StaffProfile,
  StaffReward,
  StaffStrikepointEntry,
} from "@/types/domain";

type DemoStore = {
  patients: Patient[];
  cases: PatientCase[];
  reports: MedicalReport[];
  patientAuditLogs: PatientAuditLog[];
  staffProfiles: StaffProfile[];
  staffEvaluations: StaffEvaluation[];
  staffAbsences: StaffAbsence[];
  staffRewards: StaffReward[];
  staffStrikepointEntries: StaffStrikepointEntry[];
};

const globalStore = globalThis as typeof globalThis & {
  __EMS_DEMO_STORE__?: DemoStore;
};

function createStore(): DemoStore {
  return {
    patients: structuredClone(mockPatients),
    cases: structuredClone(mockCases),
    reports: structuredClone(mockReports),
    patientAuditLogs: structuredClone(mockPatientAuditLogs),
    staffProfiles: structuredClone(mockStaffProfiles),
    staffEvaluations: structuredClone(mockStaffEvaluations),
    staffAbsences: structuredClone(mockStaffAbsences),
    staffRewards: structuredClone(mockStaffRewards),
    staffStrikepointEntries: structuredClone(mockStaffStrikepointEntries),
  };
}

function getStore(): DemoStore {
  if (!globalStore.__EMS_DEMO_STORE__) {
    globalStore.__EMS_DEMO_STORE__ = createStore();
  }

  if (!globalStore.__EMS_DEMO_STORE__.reports) {
    globalStore.__EMS_DEMO_STORE__.reports = structuredClone(mockReports);
  }

  if (!globalStore.__EMS_DEMO_STORE__.patientAuditLogs) {
    globalStore.__EMS_DEMO_STORE__.patientAuditLogs = structuredClone(mockPatientAuditLogs);
  }

  globalStore.__EMS_DEMO_STORE__.patients = globalStore.__EMS_DEMO_STORE__.patients.map(
    (patient) => {
      const fallback = mockPatients.find((item) => item.id === patient.id);
      return {
        ...fallback,
        ...patient,
        allergies: patient.allergies ?? fallback?.allergies ?? [],
        medications: patient.medications ?? fallback?.medications ?? [],
        chronicConditions: patient.chronicConditions ?? fallback?.chronicConditions ?? [],
        medicalWarnings: patient.medicalWarnings ?? fallback?.medicalWarnings ?? [],
        warningBadges: patient.warningBadges ?? fallback?.warningBadges ?? [],
        emergencyContactName:
          patient.emergencyContactName ?? fallback?.emergencyContactName ?? null,
        emergencyContactPhone:
          patient.emergencyContactPhone ?? fallback?.emergencyContactPhone ?? null,
        bloodType: patient.bloodType ?? fallback?.bloodType ?? null,
        status: patient.status ?? fallback?.status ?? null,
        createdBy: patient.createdBy ?? fallback?.createdBy ?? null,
        createdAt: patient.createdAt ?? fallback?.createdAt ?? null,
        updatedBy: patient.updatedBy ?? fallback?.updatedBy ?? null,
        updatedAt: patient.updatedAt ?? fallback?.updatedAt ?? null,
      };
    },
  );

  const invalidPatientIds = new Set(
    (globalStore.__EMS_DEMO_STORE__.patients ?? [])
      .filter((patient) => {
        const fullName = patient.fullName.trim().toLowerCase();
        const citizenId = patient.citizenId.trim().toLowerCase();
        return fullName === "test" || citizenId.startsWith("test");
      })
      .map((patient) => patient.id),
  );

  if (invalidPatientIds.size > 0) {
    globalStore.__EMS_DEMO_STORE__.patients = globalStore.__EMS_DEMO_STORE__.patients.filter(
      (patient) => !invalidPatientIds.has(patient.id),
    );
    globalStore.__EMS_DEMO_STORE__.cases = globalStore.__EMS_DEMO_STORE__.cases.filter(
      (patientCase) => !invalidPatientIds.has(patientCase.patientId),
    );
    globalStore.__EMS_DEMO_STORE__.reports = globalStore.__EMS_DEMO_STORE__.reports.filter(
      (report) => !invalidPatientIds.has(report.patientId),
    );
  }

  if (!globalStore.__EMS_DEMO_STORE__.staffProfiles) {
    globalStore.__EMS_DEMO_STORE__.staffProfiles = structuredClone(mockStaffProfiles);
  }
  else {
    globalStore.__EMS_DEMO_STORE__.staffProfiles = globalStore.__EMS_DEMO_STORE__.staffProfiles.map(
      (profile) => {
        const fallback = mockStaffProfiles.find((item) => item.id === profile.id);
        return {
          ...fallback,
          ...profile,
          callSign: profile.callSign ?? fallback?.callSign ?? profile.citizenId,
          toolPassword: profile.toolPassword ?? fallback?.toolPassword ?? "demodemo",
          phone: profile.phone ?? fallback?.phone ?? null,
          joinedAt: profile.joinedAt ?? fallback?.joinedAt ?? null,
          lastModifiedAt: profile.lastModifiedAt ?? fallback?.lastModifiedAt ?? null,
          salaryMonthly: profile.salaryMonthly ?? fallback?.salaryMonthly ?? null,
          strikePoints: profile.strikePoints ?? fallback?.strikePoints ?? 0,
          statusOverride: profile.statusOverride ?? fallback?.statusOverride ?? null,
        };
      },
    );
  }

  if (!globalStore.__EMS_DEMO_STORE__.staffEvaluations) {
    globalStore.__EMS_DEMO_STORE__.staffEvaluations = structuredClone(mockStaffEvaluations);
  }

  if (!globalStore.__EMS_DEMO_STORE__.staffAbsences) {
    globalStore.__EMS_DEMO_STORE__.staffAbsences = structuredClone(mockStaffAbsences);
  }

  if (!globalStore.__EMS_DEMO_STORE__.staffRewards) {
    globalStore.__EMS_DEMO_STORE__.staffRewards = structuredClone(mockStaffRewards);
  }

  if (!globalStore.__EMS_DEMO_STORE__.staffStrikepointEntries) {
    globalStore.__EMS_DEMO_STORE__.staffStrikepointEntries = structuredClone(
      mockStaffStrikepointEntries,
    );
  }

  return globalStore.__EMS_DEMO_STORE__;
}

export function getDemoPatients() {
  return getStore().patients;
}

export function getDemoCases() {
  return getStore().cases;
}

export function getDemoReports() {
  return getStore().reports;
}

export function getDemoPatientAuditLogs() {
  return getStore().patientAuditLogs;
}

export function getDemoStaffProfiles() {
  return getStore().staffProfiles;
}

export function getDemoStaffEvaluations() {
  return getStore().staffEvaluations;
}

export function getDemoStaffAbsences() {
  return getStore().staffAbsences;
}

export function getDemoStaffRewards() {
  return getStore().staffRewards;
}

export function getDemoStaffStrikepointEntries() {
  return getStore().staffStrikepointEntries;
}

export function addDemoPatient(patient: Patient) {
  getStore().patients.unshift(patient);
}

export function updateDemoPatient(patientId: string, updates: Partial<Patient>) {
  const patient = getStore().patients.find((item) => item.id === patientId);
  if (!patient) return;

  Object.assign(patient, updates);
}

export function removeDemoPatient(patientId: string) {
  const store = getStore();
  store.patients = store.patients.filter((item) => item.id !== patientId);
  store.cases = store.cases.filter((item) => item.patientId !== patientId);
  store.reports = store.reports.filter((item) => item.patientId !== patientId);
  store.patientAuditLogs = store.patientAuditLogs.filter((item) => item.patientId !== patientId);
}

export function addDemoPatientAuditLog(logEntry: PatientAuditLog) {
  getStore().patientAuditLogs.unshift(logEntry);
}

export function addDemoCase(patientCase: PatientCase) {
  getStore().cases.unshift(patientCase);
}

export function updateDemoCase(caseId: string, updates: Partial<PatientCase>) {
  const patientCase = getStore().cases.find((item) => item.id === caseId);
  if (!patientCase) return;

  Object.assign(patientCase, updates);
}

export function addDemoReport(report: MedicalReport) {
  getStore().reports.unshift(report);
}

export function addDemoStaffEvaluation(evaluation: StaffEvaluation) {
  getStore().staffEvaluations.unshift(evaluation);
}

export function addDemoStaffAbsence(absence: StaffAbsence) {
  getStore().staffAbsences.unshift(absence);
}

export function addDemoStaffReward(reward: StaffReward) {
  getStore().staffRewards.unshift(reward);
}

export function addDemoStaffStrikepointEntry(entry: StaffStrikepointEntry) {
  getStore().staffStrikepointEntries.unshift(entry);
}

export function updateDemoStaffProfile(profileId: string, updates: Partial<StaffProfile>) {
  const profile = getStore().staffProfiles.find((item) => item.id === profileId);
  if (!profile) return;

  Object.assign(profile, updates, { lastModifiedAt: new Date().toISOString() });
}

export function updateDemoReport(reportId: string, updates: Partial<MedicalReport>) {
  const report = getStore().reports.find((item) => item.id === reportId);
  if (!report) return;

  Object.assign(report, updates, { updatedAt: new Date().toISOString() });
}

export function updateDemoStaffEvaluation(
  evaluationId: string,
  updates: Partial<StaffEvaluation>,
) {
  const evaluation = getStore().staffEvaluations.find((item) => item.id === evaluationId);
  if (!evaluation) return;

  Object.assign(evaluation, updates);
}

export function updateDemoStaffAbsence(absenceId: string, updates: Partial<StaffAbsence>) {
  const absence = getStore().staffAbsences.find((item) => item.id === absenceId);
  if (!absence) return;

  Object.assign(absence, updates);
}

export function updateDemoStaffReward(rewardId: string, updates: Partial<StaffReward>) {
  const reward = getStore().staffRewards.find((item) => item.id === rewardId);
  if (!reward) return;

  Object.assign(reward, updates);
}

export function removeDemoStaffSpecialization(profileId: string, specializationId: string) {
  const profile = getStore().staffProfiles.find((item) => item.id === profileId);
  if (!profile) return;

  profile.specializationIds = profile.specializationIds.filter((id) => id !== specializationId);
}

export function addDemoStaffSpecialization(
  profileId: string,
  specializationId: string,
  specializationName: string,
) {
  const profile = getStore().staffProfiles.find((item) => item.id === profileId);
  if (!profile || profile.specializationIds.includes(specializationId)) return;

  profile.specializationIds.push(specializationId);
  if (!profile.specializationNames.includes(specializationName)) {
    profile.specializationNames.push(specializationName);
  }
}

export function resolveDemoStaffStrikepointEntry(
  entryId: string,
  updates: Pick<StaffStrikepointEntry, "resolvedAt" | "resolvedBy" | "resolvedReason">,
) {
  const entry = getStore().staffStrikepointEntries.find((item) => item.id === entryId);
  if (!entry) return;

  Object.assign(entry, updates);
}

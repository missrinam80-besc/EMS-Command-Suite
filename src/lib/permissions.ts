export const CAPABILITIES = [
  "patients.read",
  "patients.write",
  "cases.read",
  "cases.write",
  "reports.read",
  "reports.write",
  "treatments.read",
  "treatments.write",
  "staff.read",
  "staff.write",
  "evaluations.read",
  "evaluations.write",
  "absences.read",
  "absences.write",
  "meetings.read",
  "meetings.write",
  "minutes.read",
  "minutes.write",
  "guidelines.read",
  "guidelines.write",
  "admin.manage_permissions",
] as const;

export type Capability = (typeof CAPABILITIES)[number];

export const ROLE_BLUEPRINTS: Record<
  string,
  { label: string; capabilities: Capability[] }
> = {
  trainee: {
    label: "Stagiair",
    capabilities: [
      "patients.read",
      "cases.read",
      "reports.read",
      "guidelines.read",
    ],
  },
  ems: {
    label: "EMS medewerker",
    capabilities: [
      "patients.read",
      "patients.write",
      "cases.read",
      "cases.write",
      "reports.read",
      "reports.write",
      "treatments.read",
      "treatments.write",
      "guidelines.read",
    ],
  },
  supervisor: {
    label: "Supervisor",
    capabilities: [
      "patients.read",
      "patients.write",
      "cases.read",
      "cases.write",
      "reports.read",
      "reports.write",
      "treatments.read",
      "treatments.write",
      "staff.read",
      "evaluations.read",
      "evaluations.write",
      "absences.read",
      "meetings.read",
      "meetings.write",
      "minutes.read",
      "minutes.write",
      "guidelines.read",
      "guidelines.write",
    ],
  },
  command: {
    label: "Leiding",
    capabilities: [...CAPABILITIES],
  },
};

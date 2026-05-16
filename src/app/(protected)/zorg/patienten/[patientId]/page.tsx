import Link from "next/link";
import { notFound } from "next/navigation";
import { updatePatientNotesAction } from "@/app/(protected)/zorg/patienten/actions";
import { requirePermission } from "@/lib/auth";
import { PatientCaseList } from "@/components/patient-case-list";
import { PatientDetailActions } from "@/components/patient-detail-actions";
import { FeedbackBanner } from "@/components/feedback-banner";
import { PatientHistoryList } from "@/components/patient-history-list";
import { PatientReportLauncher } from "@/components/patient-report-launcher";
import { readFeedback } from "@/lib/feedback";
import { getPatientDetail } from "@/lib/patients";
import { getOpnameReportsByPatient, getTraumaReportsByPatient } from "@/lib/reports";

type PatientDetailPageProps = {
  params: Promise<{ patientId: string }>;
  searchParams: Promise<{ success?: string; error?: string }>;
};

function calculateAge(birthDate?: string | null) {
  if (!birthDate) return null;

  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDelta = today.getMonth() - birth.getMonth();

  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }

  return age;
}

function getPatientStatusLabel(status?: string | null) {
  switch (status) {
    case "actief_in_behandeling":
      return "Actief in behandeling";
    case "opgenomen":
      return "Opgenomen";
    case "observatie":
      return "Observatie";
    case "stabiel_ontslagen":
      return "Stabiel / ontslagen";
    case "overleden":
      return "Overleden";
    case "forensisch_politie":
      return "Forensisch / politie";
    default:
      return "Onbekend";
  }
}

function getPatientStatusClass(status?: string | null) {
  switch (status) {
    case "actief_in_behandeling":
      return "bg-[#ffe3e3] text-[#9b2020]";
    case "opgenomen":
      return "bg-[#ffe8d5] text-[#a14f00]";
    case "observatie":
      return "bg-[#fff4c2] text-[#7d6500]";
    case "stabiel_ontslagen":
      return "bg-[#ddf7e5] text-[#1f7a3a]";
    case "overleden":
      return "bg-[#e5e7eb] text-[#3f4652]";
    case "forensisch_politie":
      return "bg-[#e6e1ff] text-[#4f46b8]";
    default:
      return "bg-[var(--color-surface-alt)] text-[var(--color-ink)]";
  }
}

export default async function PatientDetailPage({
  params,
  searchParams,
}: PatientDetailPageProps) {
  await requirePermission("patients.read");

  const { patientId } = await params;
  const feedback = readFeedback(await searchParams);
  const [patient, traumaReports, opnameReports] = await Promise.all([
    getPatientDetail(patientId),
    getTraumaReportsByPatient(patientId),
    getOpnameReportsByPatient(patientId),
  ]);

  if (!patient) {
    notFound();
  }

  const age = calculateAge(patient.birthDate);
  const warningBadges = patient.warningBadges ?? [];
  const reportItems = [...traumaReports, ...opnameReports]
    .map((report) => ({
      id: `report-${report.id}`,
      title: report.title,
      summary: report.summary,
      createdAt: report.createdAt,
      href:
        report.type === "trauma"
          ? `/zorg/patienten/${patient.id}/rapporten/trauma/${report.id}`
          : `/zorg/patienten/${patient.id}/rapporten/opname/${report.id}`,
      typeLabel: report.type === "trauma" ? ("trauma" as const) : ("opname" as const),
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8 md:px-10 lg:px-12">
      {feedback ? <FeedbackBanner type={feedback.type} message={feedback.message} /> : null}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-muted)]">
            Patientdetail
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
            {patient.fullName}
          </h1>
          <div className="mt-4 flex flex-wrap gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getPatientStatusClass(patient.status)}`}
            >
              {getPatientStatusLabel(patient.status)}
            </span>
            {warningBadges.map((badge) => (
              <span
                key={badge}
                className="rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-ink)]"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>

        <Link
          href="/zorg/patienten"
          className="rounded-full border border-[var(--color-line)] px-4 py-2 text-sm font-medium text-[var(--color-ink)] transition hover:bg-[var(--color-accent-soft)]"
        >
          Terug naar register
        </Link>
      </div>

      <section className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
        <section className="grid gap-6">
          <article className="rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
            <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-muted)]">
              Identificatie
            </p>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted)]">Naam</p>
                <p className="mt-1 text-sm font-medium text-[var(--color-ink)]">{patient.fullName}</p>
              </div>
              <div className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted)]">ID</p>
                <p className="mt-1 text-sm font-medium text-[var(--color-ink)]">{patient.citizenId}</p>
              </div>
              <div className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted)]">
                  Leeftijd / geboortedatum
                </p>
                <p className="mt-1 text-sm font-medium text-[var(--color-ink)]">
                  {age !== null && patient.birthDate
                    ? `${age} jaar · ${patient.birthDate}`
                    : patient.birthDate || "Onbekend"}
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted)]">Telefoon</p>
                <p className="mt-1 text-sm font-medium text-[var(--color-ink)]">
                  {patient.phone || "Niet ingevuld"}
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 md:col-span-2">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted)]">
                  Noodcontact
                </p>
                <p className="mt-1 text-sm font-medium text-[var(--color-ink)]">
                  {patient.emergencyContactName
                    ? `${patient.emergencyContactName}${patient.emergencyContactPhone ? ` · ${patient.emergencyContactPhone}` : ""}`
                    : "Niet ingevuld"}
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
            <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-muted)]">
              Medische gegevens
            </p>
            <div className="mt-5 grid gap-3">
              <div className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted)]">Bloedgroep</p>
                <p className="mt-1 text-sm font-medium text-[var(--color-ink)]">
                  {patient.bloodType || "Niet geregistreerd"}
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted)]">Allergieën</p>
                <p className="mt-1 text-sm font-medium text-[var(--color-ink)]">
                  {patient.allergies?.length ? patient.allergies.join(", ") : "Geen geregistreerde allergieën"}
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted)]">Medicatie</p>
                <p className="mt-1 text-sm font-medium text-[var(--color-ink)]">
                  {patient.medications?.length ? patient.medications.join(", ") : "Geen actieve medicatie"}
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted)]">
                  Chronische aandoeningen
                </p>
                <p className="mt-1 text-sm font-medium text-[var(--color-ink)]">
                  {patient.chronicConditions?.length
                    ? patient.chronicConditions.join(", ")
                    : "Geen chronische aandoeningen geregistreerd"}
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted)]">
                  Medische waarschuwingen
                </p>
                <p className="mt-1 text-sm font-medium text-[var(--color-ink)]">
                  {patient.medicalWarnings?.length
                    ? patient.medicalWarnings.join(", ")
                    : "Geen extra medische waarschuwingen"}
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
            <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-muted)]">
              Beheersgegevens
            </p>
            <div className="mt-5 grid gap-3">
              <div className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted)]">
                  Aangemaakt door
                </p>
                <p className="mt-1 text-sm font-medium text-[var(--color-ink)]">
                  {patient.createdBy || "Onbekend"}
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted)]">
                  Laatst gewijzigd door
                </p>
                <p className="mt-1 text-sm font-medium text-[var(--color-ink)]">
                  {patient.updatedBy || "Onbekend"}
                </p>
              </div>
            </div>

            <PatientDetailActions patient={patient} />
          </article>
        </section>

        <section className="grid gap-6">
          <article className="rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
            <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-muted)]">
              Snelle acties
            </p>
            <PatientReportLauncher patientId={patient.id} />
          </article>

          <article className="rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-muted)]">Cases</p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">
                Complexe of gespecialiseerde opvolging
              </h2>
            </div>

            <PatientCaseList patientId={patient.id} cases={patient.cases} />
          </article>

          <article className="rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-muted)]">
                Rapporten
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">
                Historiek en lopende opvolging
              </h2>
            </div>

            <PatientHistoryList items={reportItems} />
          </article>

          <article className="rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-muted)]">
                Extra notities
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">
                Informatie voor behandelende arts
              </h2>
            </div>

            <form action={updatePatientNotesAction} className="mt-5 grid gap-3">
              <input type="hidden" name="patientId" value={patient.id} />
              <label className="grid gap-2 text-sm text-[var(--color-muted)]">
                Notities
                <textarea
                  name="notes"
                  rows={7}
                  defaultValue={patient.notes || ""}
                  placeholder="Bijv. patiënt is vuurwapengevaarlijk, politie contacteren bij opname, extra aandachtspunten..."
                  className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
                />
              </label>
              <button
                type="submit"
                className="rounded-full border border-[var(--color-line)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-accent-soft)]"
              >
                Notities opslaan
              </button>
            </form>
          </article>
        </section>
      </section>
    </main>
  );
}

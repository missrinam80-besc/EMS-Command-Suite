import { requireStaffDetailAccess } from "@/lib/auth";
import { notFound } from "next/navigation";
import { FeedbackBanner } from "@/components/feedback-banner";
import { readFeedback } from "@/lib/feedback";
import { StaffDetailActions } from "@/components/staff-detail-actions";
import { getStaffDetail, getStaffProfileMap, resolveStaffStatus } from "@/lib/personnel";

type StaffDetailPageProps = {
  params: Promise<{ profileId: string }>;
  searchParams: Promise<{ success?: string; error?: string }>;
};

function formatDate(date: string | null | undefined) {
  if (!date) return "Niet geregistreerd";
  return new Date(date).toLocaleDateString("nl-BE");
}

function formatDateTime(date: string) {
  return new Date(date).toLocaleString("nl-BE");
}

function formatCurrency(amount: number | null | undefined) {
  if (amount == null) return "Niet geregistreerd";
  return new Intl.NumberFormat("nl-BE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getStatusBadgeClasses(status: string) {
  if (status === "non-actief") {
    return "bg-[#ffe4e8] text-[#8e1f35]";
  }

  if (status === "afwezig") {
    return "bg-[#fff2c7] text-[#73510e]";
  }

  return "bg-[#dff7e7] text-[#1f6a3b]";
}

export default async function StaffDetailPage({ params, searchParams }: StaffDetailPageProps) {
  const { profileId } = await params;
  await requireStaffDetailAccess(profileId);
  const feedback = readFeedback(await searchParams);
  const [staffMember, staffMap] = await Promise.all([
    getStaffDetail(profileId),
    getStaffProfileMap(),
  ]);

  if (!staffMember) {
    notFound();
  }

  const status = resolveStaffStatus(staffMember, staffMember.activeAbsenceCount);
  const rankRecord = staffMember.availableRanks.find((rank) => rank.id === staffMember.rankId);
  const specializationBonusTotal = staffMember.availableSpecializations
    .filter((specialization) => staffMember.specializationIds.includes(specialization.id))
    .reduce((total, specialization) => total + (specialization.salaryBonus ?? 0), 0);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8 md:px-10 lg:px-12">
      {feedback ? <FeedbackBanner type={feedback.type} message={feedback.message} /> : null}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-muted)]">
            Personeelsdossier
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
            {staffMember.fullName}
          </h1>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            {staffMember.callSign || staffMember.citizenId} | {staffMember.rankName}
          </p>
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
        <aside className="rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-6 shadow-[var(--shadow-soft)]">
          <h2 className="text-2xl font-semibold text-[var(--color-ink)]">Profielkaart</h2>

          <dl className="mt-5 grid gap-3">
            <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3">
              <dt className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted)]">
                E-mail
              </dt>
              <dd className="mt-1 text-sm font-medium text-[var(--color-ink)]">
                {staffMember.email}
              </dd>
            </div>
            <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3">
              <dt className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted)]">
                Telefoon
              </dt>
              <dd className="mt-1 text-sm font-medium text-[var(--color-ink)]">
                {staffMember.phone || "Niet geregistreerd"}
              </dd>
            </div>
            <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3">
              <dt className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted)]">
                Status
              </dt>
              <dd className="mt-2">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getStatusBadgeClasses(status)}`}
                >
                  {status}
                </span>
              </dd>
            </div>
            <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3">
              <dt className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted)]">
                Specialisaties
              </dt>
              <dd className="mt-1 text-sm font-medium text-[var(--color-ink)]">
                {staffMember.specializationNames.join(", ") || "Geen specialisaties"}
              </dd>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3">
                <dt className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted)]">
                  In dienst sinds
                </dt>
                <dd className="mt-1 text-sm font-medium text-[var(--color-ink)]">
                  {formatDate(staffMember.joinedAt)}
                </dd>
              </div>
              <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3">
                <dt className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted)]">
                  Laatste wijziging
                </dt>
                <dd className="mt-1 text-sm font-medium text-[var(--color-ink)]">
                  {staffMember.lastModifiedAt
                    ? formatDateTime(staffMember.lastModifiedAt)
                    : "Niet geregistreerd"}
                </dd>
              </div>
              <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3">
                <dt className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted)]">
                  Loon
                </dt>
                <dd className="mt-1 text-sm font-medium text-[var(--color-ink)]">
                  {formatCurrency(staffMember.salaryMonthly)}
                </dd>
                <dd className="mt-2 text-xs leading-5 text-[var(--color-muted)]">
                  Basisloon {formatCurrency(rankRecord?.baseSalary ?? 0)} + specialisatiebonussen{" "}
                  {formatCurrency(specializationBonusTotal)}
                </dd>
              </div>
            </div>
          </dl>

          <div className="mt-6 rounded-2xl border border-[var(--color-line)] bg-[var(--color-accent-soft)] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
              Snelle acties
            </p>
            <StaffDetailActions staffMember={staffMember} />
          </div>
        </aside>

        <section className="grid gap-6">
          <article className="rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-6 shadow-[var(--shadow-soft)]">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-muted)]">
                Beloningen
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">
                Erkenningen en bonusmomenten
              </h2>
            </div>

            <div className="mt-6 grid gap-4">
              {staffMember.rewards.length ? (
                staffMember.rewards.map((reward) => {
                  const granter = reward.grantedBy ? staffMap.get(reward.grantedBy) : null;

                  return (
                    <article
                      key={reward.id}
                      className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-5 py-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-lg font-semibold text-[var(--color-ink)]">
                          {reward.title}
                        </h3>
                        <span className="rounded-full bg-[var(--color-accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-ink)]">
                          {formatCurrency(reward.amount)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-[var(--color-muted)]">
                        {reward.description || "Geen toelichting toegevoegd."}
                      </p>
                      <p className="mt-4 text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
                        {formatDateTime(reward.grantedAt)} | door{" "}
                        {granter?.fullName || "Onbekend"}
                      </p>
                    </article>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-[var(--color-line)] px-4 py-6 text-sm text-[var(--color-muted)]">
                  Nog geen beloningen voor deze medewerker.
                </div>
              )}
            </div>
          </article>

          <article className="rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-6 shadow-[var(--shadow-soft)]">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-muted)]">
                Strikepoints
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">
                Disciplinaire opvolging
              </h2>
            </div>

            <div className="mt-6 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-5 py-5">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted)]">
                Huidige stand
              </p>
              <p className="mt-3 text-4xl font-semibold text-[var(--color-ink)]">
                {staffMember.strikePoints}
              </p>
            </div>

            <div className="mt-4 grid gap-3">
              {staffMember.strikepointEntries.length ? (
                staffMember.strikepointEntries.map((entry) => {
                  const actor = entry.createdBy ? staffMap.get(entry.createdBy) : null;

                  return (
                    <article
                      key={entry.id}
                      className={`rounded-2xl border border-[var(--color-line)] px-5 py-4 ${
                        entry.resolvedAt
                          ? "bg-[var(--color-surface-alt)] opacity-70"
                          : "bg-[var(--color-surface)]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${
                            entry.delta > 0
                              ? "bg-[#ffe4e8] text-[#8e1f35]"
                              : "bg-[#dff7e7] text-[#1f6a3b]"
                          }`}
                        >
                          {entry.delta > 0 ? `+${entry.delta}` : entry.delta}
                        </span>
                        <span className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
                          {formatDateTime(entry.createdAt)}
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-[var(--color-ink)]">{entry.reason}</p>
                      <p className="mt-3 text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
                        Door {actor?.fullName || "Onbekend"}
                      </p>
                      {entry.resolvedAt ? (
                        <p className="mt-3 text-xs uppercase tracking-[0.16em] text-[var(--color-muted)] line-through">
                          Verwijderd op {formatDateTime(entry.resolvedAt)}
                        </p>
                      ) : null}
                    </article>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-[var(--color-line)] px-4 py-6 text-sm text-[var(--color-muted)]">
                  Nog geen strikepoint-historiek voor deze medewerker.
                </div>
              )}
            </div>
          </article>

          <article className="rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-6 shadow-[var(--shadow-soft)]">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-muted)]">
                Evaluaties
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">
                Historiek en feedback
              </h2>
            </div>

            <div className="mt-6 grid gap-4">
              {staffMember.evaluations.length ? (
                staffMember.evaluations.map((evaluation) => {
                  const evaluator = staffMap.get(evaluation.evaluatorProfileId);

                  return (
                    <article
                      key={evaluation.id}
                      className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-5 py-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-lg font-semibold text-[var(--color-ink)]">
                          {evaluation.title}
                        </h3>
                        <span className="rounded-full bg-[var(--color-accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-ink)]">
                          evaluatie
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-[var(--color-muted)]">
                        {evaluation.summary}
                      </p>
                      <dl className="mt-4 grid gap-2 text-sm text-[var(--color-ink)]">
                        <div>
                          <dt className="font-semibold">Periode</dt>
                          <dd>{evaluation.content.evaluationPeriod || "Niet ingevuld"}</dd>
                        </div>
                        <div>
                          <dt className="font-semibold">Sterktes</dt>
                          <dd>{evaluation.content.strengths || "Niet ingevuld"}</dd>
                        </div>
                        <div>
                          <dt className="font-semibold">Aandachtspunten</dt>
                          <dd>{evaluation.content.attentionPoints || "Niet ingevuld"}</dd>
                        </div>
                        <div>
                          <dt className="font-semibold">Ontwikkelplan</dt>
                          <dd>{evaluation.content.developmentPlan || "Niet ingevuld"}</dd>
                        </div>
                        <div>
                          <dt className="font-semibold">Besluit</dt>
                          <dd>{evaluation.content.outcome || "Niet ingevuld"}</dd>
                        </div>
                      </dl>
                      <p className="mt-4 text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
                        {formatDateTime(evaluation.createdAt)} | door{" "}
                        {evaluator?.fullName || evaluation.evaluatorProfileId}
                      </p>
                    </article>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-[var(--color-line)] px-4 py-6 text-sm text-[var(--color-muted)]">
                  Nog geen evaluaties voor deze medewerker.
                </div>
              )}
            </div>
          </article>

          <article className="rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-6 shadow-[var(--shadow-soft)]">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-muted)]">
                Afwezigheden
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">
                Planning en beschikbaarheid
              </h2>
            </div>

            <div className="mt-6 grid gap-4">
              {staffMember.absences.length ? (
                staffMember.absences.map((absence) => {
                  const decider = absence.decidedBy ? staffMap.get(absence.decidedBy) : null;

                  return (
                    <article
                      key={absence.id}
                      className={`rounded-2xl border border-[var(--color-line)] px-5 py-4 ${
                        new Date(absence.endDate) < new Date("2026-05-16")
                          ? "bg-[var(--color-surface-alt)] opacity-70"
                          : "bg-[var(--color-surface)]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-lg font-semibold text-[var(--color-ink)]">
                          {absence.absenceType}
                        </h3>
                        <span className="rounded-full border border-[var(--color-line)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-ink)]">
                          {absence.status}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-[var(--color-muted)]">
                        {formatDate(absence.startDate)} tot {formatDate(absence.endDate)}
                      </p>
                      <p
                        className={`mt-2 text-sm ${
                          new Date(absence.endDate) < new Date("2026-05-16")
                            ? "line-through text-[var(--color-muted)]"
                            : "text-[var(--color-ink)]"
                        }`}
                      >
                        {absence.reason || "Geen toelichting toegevoegd."}
                      </p>
                      <p className="mt-4 text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
                        Beslisser: {decider?.fullName || "Nog niet beslist"}
                      </p>
                    </article>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-[var(--color-line)] px-4 py-6 text-sm text-[var(--color-muted)]">
                  Nog geen afwezigheden voor deze medewerker.
                </div>
              )}
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}

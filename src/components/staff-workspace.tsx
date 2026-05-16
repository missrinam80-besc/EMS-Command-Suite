"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { StaffDetail, StaffWorkspaceRow } from "@/lib/personnel";

type StaffWorkspaceProps = {
  selfProfileId: string;
  staff: StaffWorkspaceRow[];
  staffDetails: StaffDetail[];
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

function getStatusLabel(row: StaffWorkspaceRow) {
  if (row.statusOverride) return row.statusOverride;
  if (!row.active) return "non-actief";
  if (row.activeAbsenceCount > 0) return "afwezig";
  return "actief";
}

function getStatusBadgeClasses(row: StaffWorkspaceRow) {
  if (!row.active) {
    return "bg-[#ffe4e8] text-[#8e1f35]";
  }

  if (row.activeAbsenceCount > 0) {
    return "bg-[#fff2c7] text-[#73510e]";
  }

  return "bg-[#dff7e7] text-[#1f6a3b]";
}

export function StaffWorkspace({
  selfProfileId,
  staff,
  staffDetails,
}: StaffWorkspaceProps) {
  const [query, setQuery] = useState("");
  const [openProfileId, setOpenProfileId] = useState<string | null>(null);

  useEffect(() => {
    if (!openProfileId) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenProfileId(null);
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [openProfileId]);

  const filteredStaff = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return staff;

    return staff.filter((member) =>
      [
        member.callSign,
        member.fullName,
        member.rankName,
        member.specializationNames.join(" "),
        getStatusLabel(member),
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [query, staff]);

  const detailMap = useMemo(
    () => new Map(staffDetails.map((member) => [member.id, member])),
    [staffDetails],
  );

  const selfStaffMember = staff.find((member) => member.id === selfProfileId) ?? null;
  const openStaffMember = openProfileId ? detailMap.get(openProfileId) ?? null : null;

  const dossierModal =
    openStaffMember && typeof document !== "undefined"
      ? createPortal(
          <div
            className="fixed inset-0 z-[100] overflow-y-auto bg-[#061521]/55 px-4 py-6 backdrop-blur-sm"
            onClick={() => setOpenProfileId(null)}
          >
            <div className="flex min-h-[calc(100vh-3rem)] items-start justify-center pt-8 md:items-center md:pt-0">
              <div
                role="dialog"
                aria-modal="true"
                className="w-full max-w-5xl rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-6 shadow-[0_30px_80px_rgba(4,28,44,0.28)]"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-muted)]">
                      Medewerkersdossier
                    </p>
                    <h2 className="mt-2 text-3xl font-semibold text-[var(--color-ink)]">
                      {openStaffMember.fullName}
                    </h2>
                    <p className="mt-2 text-sm text-[var(--color-muted)]">
                      {openStaffMember.callSign} | {openStaffMember.rankName}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={`/personeel/${openStaffMember.id}`}
                      className="rounded-full border border-[var(--color-line)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-accent-soft)]"
                    >
                      Open detailpagina
                    </Link>
                    <button
                      type="button"
                      onClick={() => setOpenProfileId(null)}
                      className="rounded-full border border-[var(--color-line)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-accent-soft)]"
                    >
                      Sluiten
                    </button>
                  </div>
                </div>

                <div className="mt-6 grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
                  <section className="grid gap-3">
                    <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted)]">
                        E-mail
                      </p>
                      <p className="mt-1 text-sm font-medium text-[var(--color-ink)]">
                        {openStaffMember.email}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted)]">
                        Telefoon
                      </p>
                      <p className="mt-1 text-sm font-medium text-[var(--color-ink)]">
                        {openStaffMember.phone || "Niet geregistreerd"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted)]">
                        Status
                      </p>
                      <span
                        className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getStatusBadgeClasses(openStaffMember)}`}
                      >
                        {getStatusLabel(openStaffMember)}
                      </span>
                    </div>
                    <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted)]">
                        Specialisaties
                      </p>
                      <p className="mt-1 text-sm font-medium text-[var(--color-ink)]">
                        {openStaffMember.specializationNames.join(", ") || "Geen"}
                      </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted)]">
                          In dienst sinds
                        </p>
                        <p className="mt-1 text-sm font-medium text-[var(--color-ink)]">
                          {formatDate(openStaffMember.joinedAt)}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted)]">
                          Laatste wijziging
                        </p>
                        <p className="mt-1 text-sm font-medium text-[var(--color-ink)]">
                          {openStaffMember.lastModifiedAt
                            ? formatDateTime(openStaffMember.lastModifiedAt)
                            : "Niet geregistreerd"}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted)]">
                          Loon
                        </p>
                        <p className="mt-1 text-sm font-medium text-[var(--color-ink)]">
                          {formatCurrency(openStaffMember.salaryMonthly)}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted)]">
                          Strikepoints
                        </p>
                        <p className="mt-1 text-sm font-medium text-[var(--color-ink)]">
                          {openStaffMember.strikePoints}
                        </p>
                      </div>
                    </div>
                  </section>

                  <section className="grid gap-4">
                    <article className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-lg font-semibold text-[var(--color-ink)]">
                          Beloningen
                        </h3>
                        <span className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
                          {openStaffMember.rewards.length}
                        </span>
                      </div>
                      <div className="mt-4 grid gap-3">
                        {openStaffMember.rewards.length ? (
                          openStaffMember.rewards.map((reward) => (
                            <div
                              key={reward.id}
                              className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel-strong)] px-4 py-3"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <p className="font-semibold text-[var(--color-ink)]">
                                  {reward.title}
                                </p>
                                <span className="text-sm font-semibold text-[var(--color-accent-strong)]">
                                  {formatCurrency(reward.amount)}
                                </span>
                              </div>
                              <p className="mt-2 text-sm text-[var(--color-muted)]">
                                {reward.description || "Geen toelichting toegevoegd."}
                              </p>
                              <p className="mt-3 text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
                                {formatDateTime(reward.grantedAt)}
                              </p>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-[var(--color-muted)]">
                            Nog geen beloningen geregistreerd.
                          </p>
                        )}
                      </div>
                    </article>

                    <article className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-lg font-semibold text-[var(--color-ink)]">
                          Afwezigheden
                        </h3>
                        <span className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
                          {openStaffMember.absences.length}
                        </span>
                      </div>
                      <div className="mt-4 grid gap-3">
                        {openStaffMember.absences.length ? (
                          openStaffMember.absences.map((absence) => (
                            <div
                              key={absence.id}
                              className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel-strong)] px-4 py-3"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <p className="font-semibold text-[var(--color-ink)]">
                                  {absence.absenceType}
                                </p>
                                <span className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
                                  {absence.status}
                                </span>
                              </div>
                              <p className="mt-2 text-sm text-[var(--color-muted)]">
                                {formatDate(absence.startDate)} tot {formatDate(absence.endDate)}
                              </p>
                              <p className="mt-2 text-sm text-[var(--color-ink)]">
                                {absence.reason || "Geen toelichting toegevoegd."}
                              </p>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-[var(--color-muted)]">
                            Nog geen afwezigheden geregistreerd.
                          </p>
                        )}
                      </div>
                    </article>
                  </section>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <section className="rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-6 shadow-[var(--shadow-soft)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-[var(--color-ink)]">Personeelslijst</h2>
          </div>

          <label className="flex w-full max-w-sm flex-col gap-2 text-sm text-[var(--color-muted)]">
            Zoek op roepnummer, naam, rang of specialisatie
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Bijv. EMS-14210 of trauma"
              className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
            />
          </label>
        </div>

        <div className="mt-6 overflow-x-auto rounded-[1.25rem] border border-[var(--color-line)]">
          <div className="min-w-[1120px]">
            <div className="grid grid-cols-[0.9fr_1.3fr_0.9fr_1.15fr_0.85fr_0.9fr] gap-3 bg-[var(--color-surface-alt)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
              <span>Roepnummer</span>
              <span>Naam</span>
              <span>Rang</span>
              <span>Specialisaties</span>
              <span>Status</span>
              <span>Detailpagina</span>
            </div>

            <div className="divide-y divide-[var(--color-line)] bg-[var(--color-surface)]">
              {filteredStaff.map((member) => (
                <div
                  key={member.id}
                  className="grid grid-cols-[0.9fr_1.3fr_0.9fr_1.15fr_0.85fr_0.9fr] gap-3 px-4 py-4 transition hover:bg-[var(--color-accent-wash)]"
                >
                  <div className="text-sm font-medium text-[var(--color-ink)]">
                    {member.callSign}
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpenProfileId(member.id)}
                    className="text-left"
                  >
                    <span className="block font-semibold text-[var(--color-ink)]">{member.fullName}</span>
                  </button>
                  <div className="text-sm text-[var(--color-ink)]">{member.rankName}</div>
                  <div className="text-sm text-[var(--color-muted)]">
                    {member.specializationNames.join(", ") || "Geen"}
                  </div>
                  <div>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getStatusBadgeClasses(member)}`}
                    >
                      {getStatusLabel(member)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setOpenProfileId(member.id)}
                      className="rounded-full border border-[var(--color-line)] px-3 py-1 text-xs font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-accent-soft)]"
                    >
                      Open sneloverzicht
                    </button>
                  </div>
                </div>
              ))}

              {!filteredStaff.length ? (
                <div className="px-4 py-6 text-sm text-[var(--color-muted)]">
                  Geen medewerkers gevonden voor deze zoekopdracht.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <aside className="rounded-[1.75rem] border border-[var(--color-line)] bg-[linear-gradient(180deg,_var(--color-surface-alt),_var(--color-panel-strong))] p-6 shadow-[var(--shadow-soft)]">
        <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-muted)]">
          Snellinks
        </p>
        <h3 className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">
          {selfStaffMember ? selfStaffMember.fullName : "Mijn personeelszone"}
        </h3>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Open snel je eigen dossierfiche of ga rechtstreeks naar het formulier voor
          afwezigheden.
        </p>

        <div className="mt-6 grid gap-3">
          <Link
            href={`/personeel/${selfProfileId}`}
            className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-4 transition hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-soft)]"
          >
            <span className="block text-sm font-semibold text-[var(--color-ink)]">
              Mijn dossierfiche
            </span>
            <span className="mt-1 block text-sm text-[var(--color-muted)]">
              Persoonsgegevens, evaluaties en historiek openen.
            </span>
          </Link>
          <Link
            href={`/personeel/${selfProfileId}#nieuwe-afwezigheid`}
            className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-4 transition hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-soft)]"
          >
            <span className="block text-sm font-semibold text-[var(--color-ink)]">
              Afwezigheidsformulier
            </span>
            <span className="mt-1 block text-sm text-[var(--color-muted)]">
              Registreer verlof, opleiding of tijdelijke afwezigheid.
            </span>
          </Link>
        </div>
      </aside>

      {dossierModal}
    </>
  );
}

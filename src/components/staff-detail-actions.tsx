"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  addStaffStrikepointAction,
  createStaffAbsenceAction,
  createStaffEvaluationAction,
  createStaffRewardAction,
  removeStaffStrikepointAction,
  updateStaffProfileAction,
  updateStaffSpecializationsAction,
} from "@/app/(protected)/personeel/actions";
import type { StaffDetail } from "@/lib/personnel";

type ModalKey =
  | null
  | "login-details"
  | "edit-profile"
  | "manage-specializations"
  | "add-reward"
  | "add-strikepoint"
  | "remove-strikepoint"
  | "add-evaluation"
  | "add-absence";

type StaffDetailActionsProps = {
  staffMember: StaffDetail;
};

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return createPortal(
    <div
      className="fixed inset-0 z-[100] overflow-y-auto bg-[#061521]/55 px-4 py-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="flex min-h-[calc(100vh-3rem)] items-start justify-center pt-8 md:items-center md:pt-0">
        <div
          role="dialog"
          aria-modal="true"
          className="w-full max-w-2xl rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-6 shadow-[0_30px_80px_rgba(4,28,44,0.28)]"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-muted)]">
                Snelle actie
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">{title}</h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-[var(--color-line)] px-3 py-1 text-sm text-[var(--color-ink)] transition hover:bg-[var(--color-accent-soft)]"
            >
              Sluiten
            </button>
          </div>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function StaffDetailActions({ staffMember }: StaffDetailActionsProps) {
  const [openModal, setOpenModal] = useState<ModalKey>(null);

  useEffect(() => {
    if (!openModal) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenModal(null);
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [openModal]);

  const activeStrikepoints = staffMember.strikepointEntries.filter(
    (entry) => entry.delta > 0 && !entry.resolvedAt,
  );

  return (
    <>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setOpenModal("login-details")}
          className="inline-flex rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-accent-soft)]"
        >
          Inloggegevens
        </button>
        <button
          type="button"
          onClick={() => setOpenModal("edit-profile")}
          className="inline-flex rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-accent-soft)]"
        >
          Edit profiel
        </button>
        <button
          type="button"
          onClick={() => setOpenModal("manage-specializations")}
          className="inline-flex rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-accent-soft)]"
        >
          Specialisaties beheren
        </button>
        <button
          type="button"
          onClick={() => setOpenModal("add-reward")}
          className="inline-flex rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-accent-soft)]"
        >
          Beloning toevoegen
        </button>
        <button
          type="button"
          onClick={() => setOpenModal("add-strikepoint")}
          className="inline-flex rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-accent-soft)]"
        >
          Strikepoint toevoegen
        </button>
        <button
          type="button"
          onClick={() => setOpenModal("remove-strikepoint")}
          className="inline-flex rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-accent-soft)]"
        >
          Strikepoint verwijderen
        </button>
        <button
          type="button"
          onClick={() => setOpenModal("add-evaluation")}
          className="inline-flex rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:brightness-105"
        >
          Nieuwe evaluatie
        </button>
        <button
          type="button"
          onClick={() => setOpenModal("add-absence")}
          className="inline-flex rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-accent-soft)]"
        >
          Nieuwe afwezigheid
        </button>
      </div>

      {openModal === "login-details" ? (
        <ModalShell title="Inloggegevens" onClose={() => setOpenModal(null)}>
          <div className="grid gap-4">
            <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted)]">
                E-mailadres
              </p>
              <p className="mt-2 text-sm font-medium text-[var(--color-ink)]">
                {staffMember.email}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted)]">
                Wachtwoord
              </p>
              <p className="mt-2 text-sm font-medium text-[var(--color-ink)]">
                {staffMember.toolPassword || "Niet beschikbaar"}
              </p>
            </div>
          </div>
        </ModalShell>
      ) : null}

      {openModal === "edit-profile" ? (
        <ModalShell title="Profiel bewerken" onClose={() => setOpenModal(null)}>
          <form action={updateStaffProfileAction} className="grid gap-4">
            <input type="hidden" name="profileId" value={staffMember.id} />
            <label className="grid gap-2 text-sm text-[var(--color-muted)]">
              Roepnummer
              <input
                name="callSign"
                defaultValue={staffMember.callSign}
                className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
              />
            </label>
            <label className="grid gap-2 text-sm text-[var(--color-muted)]">
              Rang
              <select
                name="rankId"
                defaultValue={staffMember.rankId}
                className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
              >
                {staffMember.availableRanks.map((rank) => (
                  <option key={rank.id} value={rank.id}>
                    {rank.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm text-[var(--color-muted)]">
              Telefoon
              <input
                name="phone"
                defaultValue={staffMember.phone ?? ""}
                className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
              />
            </label>
            <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-muted)]">
              <p className="text-xs uppercase tracking-[0.18em]">In dienst sinds</p>
              <p className="mt-2 font-medium text-[var(--color-ink)]">
                {staffMember.joinedAt || "Niet geregistreerd"}
              </p>
            </div>
            <label className="grid gap-2 text-sm text-[var(--color-muted)]">
              Status
              <select
                name="status"
                defaultValue={staffMember.statusOverride ?? "actief"}
                className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
              >
                <option value="actief">Actief</option>
                <option value="afwezig">Afwezig</option>
                <option value="non-actief">Non-actief</option>
              </select>
            </label>
            <button
              type="submit"
              className="rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:brightness-105"
            >
              Profiel opslaan
            </button>
          </form>
        </ModalShell>
      ) : null}

      {openModal === "manage-specializations" ? (
        <ModalShell title="Specialisaties beheren" onClose={() => setOpenModal(null)}>
          <form action={updateStaffSpecializationsAction} className="grid gap-4">
            <input type="hidden" name="profileId" value={staffMember.id} />
            <div className="grid gap-3">
              {staffMember.availableSpecializations.map((specialization) => (
                <label
                  key={specialization.id}
                  className="flex items-center gap-3 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-ink)]"
                >
                  <input
                    type="checkbox"
                    name="specializationIds"
                    value={specialization.id}
                    defaultChecked={staffMember.specializationIds.includes(specialization.id)}
                  />
                  <span>{specialization.name}</span>
                </label>
              ))}
            </div>
            <button
              type="submit"
              className="rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:brightness-105"
            >
              Specialisaties opslaan
            </button>
          </form>
        </ModalShell>
      ) : null}

      {openModal === "add-reward" ? (
        <ModalShell title="Beloning toevoegen" onClose={() => setOpenModal(null)}>
          <form action={createStaffRewardAction} className="grid gap-4">
            <input type="hidden" name="profileId" value={staffMember.id} />
            <label className="grid gap-2 text-sm text-[var(--color-muted)]">
              Titel
              <input
                name="title"
                className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
              />
            </label>
            <label className="grid gap-2 text-sm text-[var(--color-muted)]">
              Toelichting
              <textarea
                name="description"
                rows={4}
                className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
              />
            </label>
            <label className="grid gap-2 text-sm text-[var(--color-muted)]">
              Bedrag
              <input
                type="number"
                name="amount"
                min="0"
                defaultValue="0"
                className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
              />
            </label>
            <button
              type="submit"
              className="rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:brightness-105"
            >
              Beloning opslaan
            </button>
          </form>
        </ModalShell>
      ) : null}

      {openModal === "add-strikepoint" ? (
        <ModalShell title="Strikepoint toevoegen" onClose={() => setOpenModal(null)}>
          <form action={addStaffStrikepointAction} className="grid gap-4">
            <input type="hidden" name="profileId" value={staffMember.id} />
            <label className="grid gap-2 text-sm text-[var(--color-muted)]">
              Aantal strikepoints
              <input
                type="number"
                name="amount"
                min="1"
                defaultValue="1"
                className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
              />
            </label>
            <label className="grid gap-2 text-sm text-[var(--color-muted)]">
              Reden
              <textarea
                name="reason"
                rows={4}
                required
                minLength={5}
                className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
              />
            </label>
            <button
              type="submit"
              className="rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:brightness-105"
            >
              Strikepoint toevoegen
            </button>
          </form>
        </ModalShell>
      ) : null}

      {openModal === "remove-strikepoint" ? (
        <ModalShell title="Strikepoint verwijderen" onClose={() => setOpenModal(null)}>
          <div className="grid gap-4">
            {activeStrikepoints.length ? (
              activeStrikepoints.map((entry) => (
                <form
                  key={entry.id}
                  action={removeStaffStrikepointAction}
                  className="grid gap-3 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-4"
                >
                  <input type="hidden" name="profileId" value={staffMember.id} />
                  <input type="hidden" name="entryId" value={entry.id} />
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full bg-[#ffe4e8] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#8e1f35]">
                      +{entry.delta}
                    </span>
                    <span className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
                      {new Date(entry.createdAt).toLocaleDateString("nl-BE")}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--color-ink)]">{entry.reason}</p>
                  <label className="grid gap-2 text-sm text-[var(--color-muted)]">
                    Reden van verwijdering
                    <textarea
                      name="reason"
                      rows={3}
                      required
                      minLength={5}
                      className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel-strong)] px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
                    />
                  </label>
                  <button
                    type="submit"
                    className="justify-self-start rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:brightness-105"
                  >
                    Verwijder dit strikepoint
                  </button>
                </form>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-[var(--color-line)] px-4 py-6 text-sm text-[var(--color-muted)]">
                Er zijn momenteel geen actieve strikepoints om individueel te verwijderen.
              </div>
            )}
          </div>
        </ModalShell>
      ) : null}

      {openModal === "add-evaluation" ? (
        <ModalShell title="Nieuwe evaluatie" onClose={() => setOpenModal(null)}>
          <form action={createStaffEvaluationAction} className="grid gap-4">
            <input type="hidden" name="employeeProfileId" value={staffMember.id} />
            <label className="grid gap-2 text-sm text-[var(--color-muted)]">
              Titel
              <input
                name="title"
                className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
              />
            </label>
            <label className="grid gap-2 text-sm text-[var(--color-muted)]">
              Samenvatting
              <textarea
                name="summary"
                rows={3}
                required
                minLength={3}
                className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
              />
            </label>
            <label className="grid gap-2 text-sm text-[var(--color-muted)]">
              Periode
              <input
                name="evaluationPeriod"
                className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
              />
            </label>
            <label className="grid gap-2 text-sm text-[var(--color-muted)]">
              Sterktes
              <textarea
                name="strengths"
                rows={3}
                className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
              />
            </label>
            <label className="grid gap-2 text-sm text-[var(--color-muted)]">
              Aandachtspunten
              <textarea
                name="attentionPoints"
                rows={3}
                className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
              />
            </label>
            <label className="grid gap-2 text-sm text-[var(--color-muted)]">
              Ontwikkelplan
              <textarea
                name="developmentPlan"
                rows={3}
                className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
              />
            </label>
            <label className="grid gap-2 text-sm text-[var(--color-muted)]">
              Besluit
              <input
                name="outcome"
                className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
              />
            </label>
            <button
              type="submit"
              className="rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:brightness-105"
            >
              Evaluatie opslaan
            </button>
          </form>
        </ModalShell>
      ) : null}

      {openModal === "add-absence" ? (
        <ModalShell title="Nieuwe afwezigheid" onClose={() => setOpenModal(null)}>
          <form action={createStaffAbsenceAction} className="grid gap-4 md:grid-cols-2">
            <input type="hidden" name="profileId" value={staffMember.id} />
            <label className="grid gap-2 text-sm text-[var(--color-muted)]">
              Type
              <input
                name="absenceType"
                className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
              />
            </label>
            <label className="grid gap-2 text-sm text-[var(--color-muted)]">
              Status
              <select
                name="status"
                defaultValue="aangevraagd"
                className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
              >
                <option value="aangevraagd">Aangevraagd</option>
                <option value="goedgekeurd">Goedgekeurd</option>
                <option value="geweigerd">Geweigerd</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm text-[var(--color-muted)]">
              Startdatum
              <input
                type="date"
                name="startDate"
                className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
              />
            </label>
            <label className="grid gap-2 text-sm text-[var(--color-muted)]">
              Einddatum
              <input
                type="date"
                name="endDate"
                className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
              />
            </label>
            <label className="grid gap-2 text-sm text-[var(--color-muted)] md:col-span-2">
              Toelichting
              <textarea
                name="reason"
                rows={4}
                className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
              />
            </label>
            <div className="md:col-span-2">
              <button
                type="submit"
                className="rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:brightness-105"
              >
                Afwezigheid opslaan
              </button>
            </div>
          </form>
        </ModalShell>
      ) : null}
    </>
  );
}

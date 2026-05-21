"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  createRankAction,
  updateRankPermissionGroupAction,
} from "@/app/(protected)/beheer/actions";
import type { ManagedRank, PermissionCatalogItem, RankPermissionGroup } from "@/lib/admin";

type ModalKey = null | `view:${string}` | `edit:${string}`;

type AdminRankGroupsProps = {
  ranks: ManagedRank[];
  rankGroups: RankPermissionGroup[];
  permissions: PermissionCatalogItem[];
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
          className="w-full max-w-4xl rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-6 shadow-[0_30px_80px_rgba(4,28,44,0.28)]"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-muted)]">
                Rechtengroep
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

export function AdminRankGroups({ ranks, rankGroups, permissions }: AdminRankGroupsProps) {
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

  const selectedRankId = openModal ? openModal.split(":")[1] : null;
  const selectedGroup = selectedRankId
    ? rankGroups.find((group) => group.rankId === selectedRankId) ?? null
    : null;

  return (
    <>
      <section className="rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-6 shadow-[var(--shadow-soft)]">
        <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-muted)]">
          Rechtengroepen
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">
          Ranggebonden permissiematrix
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--color-muted)]">
          Deze groepen bepalen de standaardrechten per rang. Open een snelle weergave om de
          actieve rechten te bekijken en bewerk ze pas indien nodig in een aparte popup.
        </p>

        <form action={createRankAction} className="mt-5 grid gap-4 rounded-[1.25rem] border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
          <h3 className="text-lg font-semibold text-[var(--color-ink)]">Nieuwe rang aanmaken</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="grid gap-2 text-sm text-[var(--color-muted)]">
              Code
              <input
                name="code"
                required
                placeholder="rank_7"
                className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-[var(--color-ink)]"
              />
            </label>
            <label className="grid gap-2 text-sm text-[var(--color-muted)]">
              Naam
              <input
                name="name"
                required
                placeholder="Nieuwe rang"
                className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-[var(--color-ink)]"
              />
            </label>
            <label className="grid gap-2 text-sm text-[var(--color-muted)]">
              Rangnummer
              <input
                type="number"
                name="rankNumber"
                required
                min={1}
                defaultValue={ranks.length + 1}
                className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-[var(--color-ink)]"
              />
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <label className="grid gap-2 text-sm text-[var(--color-muted)]">
              Kleur (hex)
              <input
                name="colorHex"
                placeholder="#2d74c9"
                className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-[var(--color-ink)]"
              />
            </label>
            <label className="grid gap-2 text-sm text-[var(--color-muted)]">
              Beschrijving
              <input
                name="description"
                className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-[var(--color-ink)]"
              />
            </label>
            <label className="flex items-center gap-3 rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-sm text-[var(--color-ink)]">
              <input type="checkbox" name="isActive" defaultChecked />
              Actief
            </label>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:brightness-105"
            >
              Rang aanmaken
            </button>
          </div>
        </form>

        <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {rankGroups.map((group) => (
            <article
              key={group.rankId}
              className="rounded-[1.25rem] border border-[var(--color-line)] bg-[var(--color-surface)] p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--color-ink)]">
                    {group.rankName}
                  </h3>
                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
                    {group.rankCode}
                  </p>
                </div>
                <span className="rounded-full border border-[var(--color-line)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-ink)]">
                  {group.permissionCodes.length}
                </span>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setOpenModal(`view:${group.rankId}`)}
                  className="rounded-full border border-[var(--color-line)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-accent-soft)]"
                >
                  Snel overzicht
                </button>
                <button
                  type="button"
                  onClick={() => setOpenModal(`edit:${group.rankId}`)}
                  className="rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:brightness-105"
                >
                  Bewerken
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {selectedGroup && openModal === `view:${selectedGroup.rankId}` ? (
        <ModalShell title={`Snel overzicht · ${selectedGroup.rankName}`} onClose={() => setOpenModal(null)}>
          <div className="grid gap-4">
            <div className="rounded-[1.25rem] border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
              <p className="text-sm text-[var(--color-muted)]">
                Deze ranggroep heeft momenteel {selectedGroup.permissionCodes.length} actieve rechten.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {selectedGroup.permissionCodes.length ? (
                  selectedGroup.permissionCodes.map((code) => (
                    <span
                      key={code}
                      className="rounded-full bg-[var(--color-accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-ink)]"
                    >
                      {code}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-[var(--color-muted)]">
                    Er zijn nog geen rechten gekoppeld aan deze rang.
                  </span>
                )}
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setOpenModal(`edit:${selectedGroup.rankId}`)}
                className="rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:brightness-105"
              >
                Bewerken
              </button>
            </div>
          </div>
        </ModalShell>
      ) : null}

      {selectedGroup && openModal === `edit:${selectedGroup.rankId}` ? (
        <ModalShell title={`Rechtengroep bewerken · ${selectedGroup.rankName}`} onClose={() => setOpenModal(null)}>
          <form action={updateRankPermissionGroupAction} className="grid gap-4">
            <input type="hidden" name="rankId" value={selectedGroup.rankId} />
            <div className="grid gap-3 md:grid-cols-2">
              {permissions.map((permission) => (
                <label
                  key={`${selectedGroup.rankId}-${permission.id}`}
                  className="flex items-start gap-3 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-ink)]"
                >
                  <input
                    type="checkbox"
                    name="permissionIds"
                    value={permission.id}
                    defaultChecked={selectedGroup.permissionCodes.includes(permission.code)}
                    className="mt-1"
                  />
                  <span>
                    <span className="block font-semibold">{permission.label}</span>
                    <span className="mt-1 block text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">
                      {permission.code}
                    </span>
                    {permission.description ? (
                      <span className="mt-2 block text-sm text-[var(--color-muted)]">
                        {permission.description}
                      </span>
                    ) : null}
                  </span>
                </label>
              ))}
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:brightness-105"
              >
                Rechtengroep opslaan
              </button>
            </div>
          </form>
        </ModalShell>
      ) : null}
    </>
  );
}

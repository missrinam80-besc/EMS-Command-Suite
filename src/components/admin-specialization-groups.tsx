"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { updateSpecializationPermissionGroupAction } from "@/app/(protected)/beheer/actions";
import type { PermissionCatalogItem, SpecializationPermissionGroup } from "@/lib/admin";

type ModalKey = null | `edit:${string}`;

type AdminSpecializationGroupsProps = {
  groups: SpecializationPermissionGroup[];
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
                Specialisatie rechten
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

export function AdminSpecializationGroups({ groups, permissions }: AdminSpecializationGroupsProps) {
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

  const selectedId = openModal ? openModal.split(":")[1] : null;
  const selectedGroup = selectedId
    ? groups.find((group) => group.specializationId === selectedId) ?? null
    : null;

  return (
    <>
      <section className="rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-6 shadow-[var(--shadow-soft)]">
        <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-muted)]">
          Specialisaties
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">
          Specialisatiegebonden permissies
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--color-muted)]">
          Gebruik deze matrix om extra rechten per specialisatie toe te kennen bovenop rangrechten.
        </p>

        <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {groups.map((group) => (
            <article
              key={group.specializationId}
              className="rounded-[1.25rem] border border-[var(--color-line)] bg-[var(--color-surface)] p-5"
            >
              <h3 className="text-lg font-semibold text-[var(--color-ink)]">{group.specializationName}</h3>
              <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
                {group.specializationCode}
              </p>
              <p className="mt-2 text-xs text-[var(--color-muted)]">
                Min. rank: {group.minimumRankCode ?? "n.v.t."}
              </p>
              <p className="mt-2 text-sm text-[var(--color-ink)]">
                {group.permissionCodes.length} gekoppelde rechten
              </p>
              <button
                type="button"
                onClick={() => setOpenModal(`edit:${group.specializationId}`)}
                className="mt-4 rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:brightness-105"
              >
                Bewerken
              </button>
            </article>
          ))}
        </div>
      </section>

      {selectedGroup ? (
        <ModalShell
          title={`${selectedGroup.specializationName} · rechtenmatrix`}
          onClose={() => setOpenModal(null)}
        >
          <form action={updateSpecializationPermissionGroupAction} className="grid gap-4">
            <input type="hidden" name="specializationId" value={selectedGroup.specializationId} />
            <div className="grid gap-3 md:grid-cols-2">
              {permissions.map((permission) => (
                <label
                  key={`${selectedGroup.specializationId}-${permission.id}`}
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
                  </span>
                </label>
              ))}
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:brightness-105"
              >
                Specialisatie-rechten opslaan
              </button>
            </div>
          </form>
        </ModalShell>
      ) : null}
    </>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  createManagedUserAction,
  updateManagedUserAction,
  updateManagedUserPermissionsAction,
} from "@/app/(protected)/beheer/actions";
import type {
  ManagedTenant,
  ManagedUser,
  PermissionCatalogItem,
  RankPermissionGroup,
} from "@/lib/admin";

type ModalKey = null | "create-user" | `edit-user:${string}` | `permissions:${string}`;

type AdminUserManagementProps = {
  users: ManagedUser[];
  permissions: PermissionCatalogItem[];
  rankGroups: RankPermissionGroup[];
  serviceRoleConfigured: boolean;
  tenants: ManagedTenant[];
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
                Beheeractie
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

function employmentStatusLabel(status: string) {
  switch (status) {
    case "verlof":
      return "Afwezig";
    case "inactief":
      return "Inactief";
    case "geschorst":
      return "Geschorst";
    case "ontslagen":
      return "Ontslagen";
    case "in_opleiding":
      return "In opleiding";
    default:
      return "Actief";
  }
}

export function AdminUserManagement({
  users,
  permissions,
  rankGroups,
  serviceRoleConfigured,
  tenants,
}: AdminUserManagementProps) {
  const [openModal, setOpenModal] = useState<ModalKey>(null);
  const [showPassword, setShowPassword] = useState(false);

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

  const rankOptions = useMemo(
    () =>
      rankGroups.map((group) => ({
        id: group.rankId,
        name: group.rankName,
        code: group.rankCode,
      })),
    [rankGroups],
  );

  const selectedUserId =
    openModal && openModal !== "create-user" ? openModal.split(":")[1] : null;
  const selectedUser = selectedUserId
    ? users.find((user) => user.id === selectedUserId) ?? null
    : null;

  const selectedUserInheritedPermissions = selectedUser?.inheritedPermissionCodes ?? [];
  const selectedUserDirectPermissions = selectedUser?.directPermissionCodes ?? [];
  const today = new Date().toISOString().slice(0, 10);
  const tenantLabelById = useMemo(
    () => new Map(tenants.map((tenant) => [tenant.id, `${tenant.label} (${tenant.code})`])),
    [tenants],
  );

  return (
    <>
      <section className="rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-6 shadow-[var(--shadow-soft)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-muted)]">
              Gebruikersbeheer
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">
              Accounts, login en rechten
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--color-muted)]">
              Beheer hier de live gebruikers, hun login-identiteit, ranggroep en directe
              permissie-overschrijvingen. Rechtengroepen blijven primair op rangniveau
              ingesteld; individuele rechten zijn aanvullend.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <span
              className={`rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] ${
                serviceRoleConfigured
                  ? "bg-[#ddf7e5] text-[#1f7a3a]"
                  : "bg-[#fff1db] text-[#9a5b00]"
              }`}
            >
              {serviceRoleConfigured
                ? "Service role actief"
                : "Service role ontbreekt"}
            </span>
            <button
              type="button"
              onClick={() => setOpenModal("create-user")}
              disabled={!serviceRoleConfigured}
              className="rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-[var(--color-ink)] transition enabled:hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Nieuwe gebruiker
            </button>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-[1.25rem] border border-[var(--color-line)]">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[var(--color-line)] text-sm">
              <thead className="bg-[var(--color-panel)] text-left text-xs uppercase tracking-[0.18em] text-[var(--color-muted)]">
                <tr>
                  <th className="px-4 py-3">Gebruiker</th>
                  <th className="px-4 py-3">Profiel</th>
                  <th className="px-4 py-3">Ranggroep</th>
                  <th className="px-4 py-3">Specialisaties</th>
                  <th className="px-4 py-3">Rechten</th>
                  <th className="px-4 py-3">Acties</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-line)] bg-[var(--color-surface)]">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-4 py-4 align-top">
                      <p className="font-semibold text-[var(--color-ink)]">{user.fullName}</p>
                      <p className="mt-1 text-[var(--color-muted)]">{user.email}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
                        {user.callSign || user.citizenId}
                      </p>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <p className="font-medium capitalize text-[var(--color-ink)]">
                        {user.profileType.replaceAll("_", " ")}
                      </p>
                      <p className="mt-1 text-[var(--color-muted)]">
                        {employmentStatusLabel(user.employmentStatus)}
                      </p>
                      <p className="mt-1 text-xs text-[var(--color-muted)]">
                        In dienst: {user.joinedAt || "Niet gezet"}
                      </p>
                      <p className="mt-1 text-xs text-[var(--color-muted)]">
                        Tenant: {user.tenantId ? tenantLabelById.get(user.tenantId) ?? user.tenantId : "Onbekend"}
                      </p>
                    </td>
                    <td className="px-4 py-4 align-top text-[var(--color-ink)]">
                      {user.rankName || "Geen medische rang"}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="flex max-w-xs flex-wrap gap-2">
                        {user.specializationNames.length ? (
                          user.specializationNames.map((name) => (
                            <span
                              key={name}
                              className="rounded-full border border-[var(--color-line)] px-2 py-1 text-xs text-[var(--color-ink)]"
                            >
                              {name}
                            </span>
                          ))
                        ) : (
                          <span className="text-[var(--color-muted)]">Geen</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <p className="text-[var(--color-ink)]">
                        {user.inheritedPermissionCodes.length} via rang
                      </p>
                      <p className="mt-1 text-[var(--color-muted)]">
                        {user.directPermissionCodes.length} direct
                      </p>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setOpenModal(`edit-user:${user.id}`)}
                          className="rounded-full border border-[var(--color-line)] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-accent-soft)]"
                        >
                          Inloggegevens
                        </button>
                        <button
                          type="button"
                          onClick={() => setOpenModal(`permissions:${user.id}`)}
                          className="rounded-full border border-[var(--color-line)] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-accent-soft)]"
                        >
                          Rechten
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {!serviceRoleConfigured ? (
          <div className="mt-4 rounded-[1.25rem] border border-[#f2d294] bg-[#fff6e3] px-4 py-4 text-sm text-[#7b5b12]">
            Voeg `SUPABASE_SERVICE_ROLE_KEY` toe in Vercel en lokaal om accounts vanuit de
            beheerpagina aan te maken of hun e-mail/wachtwoord te wijzigen.
          </div>
        ) : null}
      </section>

      {openModal === "create-user" ? (
        <ModalShell title="Nieuwe gebruiker aanmaken" onClose={() => setOpenModal(null)}>
          <form action={createManagedUserAction} className="grid gap-4 lg:grid-cols-2">
            <label className="grid gap-2 text-sm text-[var(--color-muted)]">
              Volledige naam
              <input
                name="fullName"
                required
                className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
              />
            </label>
            <label className="grid gap-2 text-sm text-[var(--color-muted)]">
              E-mailadres
              <input
                name="email"
                type="email"
                required
                placeholder="naam@domein.xx"
                className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
              />
            </label>
            <label className="grid gap-2 text-sm text-[var(--color-muted)]">
              Wachtwoord
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                minLength={8}
                required
                className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="justify-self-start rounded-full border border-[var(--color-line)] px-3 py-1 text-xs font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-accent-soft)]"
              >
                {showPassword ? "Verberg wachtwoord" : "Toon wachtwoord"}
              </button>
            </label>
            <label className="grid gap-2 text-sm text-[var(--color-muted)]">
              Citizenid
              <input
                name="citizenId"
                required
                className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
              />
            </label>
            <label className="grid gap-2 text-sm text-[var(--color-muted)]">
              Profieltype
              <select
                name="profileType"
                defaultValue="medical_staff"
                className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
              >
                <option value="medical_staff">Medisch personeel</option>
                <option value="administratie">Administratie</option>
                <option value="directie_assistent">Directie-assistent</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm text-[var(--color-muted)]">
              Rang
              <select
                name="rankId"
                defaultValue="none"
                className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
              >
                <option value="none">Geen medische rang</option>
                {rankOptions.map((rank) => (
                  <option key={rank.id} value={rank.id}>
                    {rank.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm text-[var(--color-muted)]">
              Tenant
              <select
                name="tenantId"
                defaultValue={tenants[0]?.id ?? ""}
                className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
              >
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.label} ({tenant.code}){tenant.isDefault ? " · default" : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm text-[var(--color-muted)]">
              Roepnummer
              <input
                name="callSign"
                className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
              />
            </label>
            <label className="grid gap-2 text-sm text-[var(--color-muted)]">
              Telefoon
              <input
                name="phone"
                className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
              />
            </label>
            <label className="grid gap-2 text-sm text-[var(--color-muted)]">
              Status
              <select
                name="employmentStatus"
                defaultValue="actief"
                className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
              >
                <option value="actief">Actief</option>
                <option value="in_opleiding">In opleiding</option>
                <option value="verlof">Verlof</option>
                <option value="inactief">Inactief</option>
                <option value="geschorst">Geschorst</option>
                <option value="ontslagen">Ontslagen</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm text-[var(--color-muted)]">
              In dienst sinds
              <input
                name="joinedAt"
                type="date"
                defaultValue={today}
                className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
              />
            </label>
            <div className="lg:col-span-2">
              <button
                type="submit"
                className="rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:brightness-105"
              >
                Gebruiker aanmaken
              </button>
            </div>
          </form>
        </ModalShell>
      ) : null}

      {selectedUser && openModal === `edit-user:${selectedUser.id}` ? (
        <ModalShell title={`Inloggegevens beheren · ${selectedUser.fullName}`} onClose={() => setOpenModal(null)}>
          <form action={updateManagedUserAction} className="grid gap-4 lg:grid-cols-2">
            <input type="hidden" name="userId" value={selectedUser.id} />
            <label className="grid gap-2 text-sm text-[var(--color-muted)]">
              Volledige naam
              <input
                name="fullName"
                required
                defaultValue={selectedUser.fullName}
                className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
              />
            </label>
            <label className="grid gap-2 text-sm text-[var(--color-muted)]">
              E-mailadres
              <input
                name="email"
                type="email"
                required
                placeholder="naam@domein.xx"
                defaultValue={selectedUser.email}
                className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
              />
            </label>
            <label className="grid gap-2 text-sm text-[var(--color-muted)]">
              Nieuw wachtwoord
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                minLength={8}
                placeholder="Leeg laten om niet te wijzigen"
                className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="justify-self-start rounded-full border border-[var(--color-line)] px-3 py-1 text-xs font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-accent-soft)]"
              >
                {showPassword ? "Verberg wachtwoord" : "Toon wachtwoord"}
              </button>
            </label>
            <label className="grid gap-2 text-sm text-[var(--color-muted)]">
              Citizenid
              <input
                name="citizenId"
                required
                defaultValue={selectedUser.citizenId}
                className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
              />
            </label>
            <label className="grid gap-2 text-sm text-[var(--color-muted)]">
              Profieltype
              <select
                name="profileType"
                defaultValue={selectedUser.profileType}
                className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
              >
                <option value="medical_staff">Medisch personeel</option>
                <option value="administratie">Administratie</option>
                <option value="directie_assistent">Directie-assistent</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm text-[var(--color-muted)]">
              Rang
              <select
                name="rankId"
                defaultValue={selectedUser.rankId ?? "none"}
                className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
              >
                <option value="none">Geen medische rang</option>
                {rankOptions.map((rank) => (
                  <option key={rank.id} value={rank.id}>
                    {rank.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm text-[var(--color-muted)]">
              Tenant
              <select
                name="tenantId"
                defaultValue={selectedUser.tenantId ?? tenants[0]?.id ?? ""}
                className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
              >
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.label} ({tenant.code}){tenant.isDefault ? " · default" : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm text-[var(--color-muted)]">
              Roepnummer
              <input
                name="callSign"
                defaultValue={selectedUser.callSign ?? ""}
                className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
              />
            </label>
            <label className="grid gap-2 text-sm text-[var(--color-muted)]">
              Telefoon
              <input
                name="phone"
                defaultValue={selectedUser.phone ?? ""}
                className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
              />
            </label>
            <label className="grid gap-2 text-sm text-[var(--color-muted)]">
              Status
              <select
                name="employmentStatus"
                defaultValue={selectedUser.employmentStatus}
                className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
              >
                <option value="actief">Actief</option>
                <option value="in_opleiding">In opleiding</option>
                <option value="verlof">Verlof</option>
                <option value="inactief">Inactief</option>
                <option value="geschorst">Geschorst</option>
                <option value="ontslagen">Ontslagen</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm text-[var(--color-muted)]">
              In dienst sinds
              <input
                name="joinedAt"
                type="date"
                defaultValue={selectedUser.joinedAt ?? ""}
                className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
              />
            </label>
            <div className="lg:col-span-2">
              <button
                type="submit"
                className="rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:brightness-105"
              >
                Account bijwerken
              </button>
            </div>
          </form>
        </ModalShell>
      ) : null}

      {selectedUser && openModal === `permissions:${selectedUser.id}` ? (
        <ModalShell title={`Rechten beheren · ${selectedUser.fullName}`} onClose={() => setOpenModal(null)}>
          <div className="grid gap-4">
            <div className="rounded-[1.25rem] border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
              <p className="text-sm font-semibold text-[var(--color-ink)]">Geërfde rangrechten</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedUserInheritedPermissions.length ? (
                  selectedUserInheritedPermissions.map((code) => (
                    <span
                      key={code}
                      className="rounded-full bg-[var(--color-accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-ink)]"
                    >
                      {code}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-[var(--color-muted)]">
                    Geen geërfde rechten via ranggroep.
                  </span>
                )}
              </div>
            </div>

            <form action={updateManagedUserPermissionsAction} className="grid gap-4">
              <input type="hidden" name="profileId" value={selectedUser.id} />
              <div className="grid gap-3 md:grid-cols-2">
                {permissions.map((permission) => (
                  <label
                    key={permission.id}
                    className="flex items-start gap-3 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-ink)]"
                  >
                    <input
                      type="checkbox"
                      name="permissionIds"
                      value={permission.id}
                      defaultChecked={selectedUserDirectPermissions.includes(permission.code)}
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
              <button
                type="submit"
                className="justify-self-start rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:brightness-105"
              >
                Directe rechten opslaan
              </button>
            </form>
          </div>
        </ModalShell>
      ) : null}
    </>
  );
}

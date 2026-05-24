import type { ManagedTenant } from "@/lib/admin";
import {
  createManagedTenantAction,
  toggleManagedTenantActiveAction,
  updateManagedTenantAction,
} from "@/app/(protected)/beheer/actions";

type AdminTenantOperationsBoardProps = {
  tenants: ManagedTenant[];
};

export function AdminTenantOperationsBoard({ tenants }: AdminTenantOperationsBoardProps) {
  return (
    <section className="rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-6 shadow-[var(--shadow-soft)]">
      <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-muted)]">Fase 11</p>
      <h2 className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">Tenant operations</h2>
      <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
        Beheer tenants centraal. Alle mutaties worden geaudit.
      </p>

      <div className="mt-6 rounded-[1.25rem] border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
          Nieuwe tenant
        </h3>
        <form action={createManagedTenantAction} className="mt-3 grid gap-3 md:grid-cols-3">
          <input
            type="text"
            name="code"
            placeholder="tenant_code"
            className="rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-sm text-[var(--color-ink)]"
            required
          />
          <input
            type="text"
            name="label"
            placeholder="Tenant label"
            className="rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-sm text-[var(--color-ink)]"
            required
          />
          <button
            type="submit"
            className="rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:brightness-105"
          >
            Tenant aanmaken
          </button>
        </form>
      </div>

      <div className="mt-6 overflow-x-auto rounded-[1.25rem] border border-[var(--color-line)] bg-[var(--color-surface)]">
        <table className="min-w-full text-sm">
          <thead className="bg-[var(--color-accent-soft)] text-left text-[var(--color-muted)]">
            <tr>
              <th className="px-4 py-3 font-semibold">Code</th>
              <th className="px-4 py-3 font-semibold">Label</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Default</th>
              <th className="px-4 py-3 font-semibold">Actie</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((tenant) => (
              <tr key={tenant.id} className="border-t border-[var(--color-line)]">
                <td className="px-4 py-3 font-medium text-[var(--color-ink)]">{tenant.code}</td>
                <td className="px-4 py-3 text-[var(--color-ink)]">{tenant.label}</td>
                <td className="px-4 py-3 text-[var(--color-muted)]">
                  {tenant.isActive ? "Actief" : "Inactief"}
                </td>
                <td className="px-4 py-3 text-[var(--color-muted)]">
                  {tenant.isDefault ? "Ja" : "Nee"}
                </td>
                <td className="px-4 py-3">
                  {tenant.isDefault ? (
                    <span className="text-xs text-[var(--color-muted)]">Niet wijzigbaar</span>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      <form action={updateManagedTenantAction} className="flex flex-wrap items-center gap-2">
                        <input type="hidden" name="tenantId" value={tenant.id} />
                        <input
                          type="text"
                          name="code"
                          defaultValue={tenant.code}
                          className="w-28 rounded-lg border border-[var(--color-line)] bg-white px-2 py-1 text-xs text-[var(--color-ink)]"
                          required
                        />
                        <input
                          type="text"
                          name="label"
                          defaultValue={tenant.label}
                          className="w-40 rounded-lg border border-[var(--color-line)] bg-white px-2 py-1 text-xs text-[var(--color-ink)]"
                          required
                        />
                        <button
                          type="submit"
                          className="rounded-full border border-[var(--color-line)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-accent-soft)]"
                        >
                          Opslaan
                        </button>
                      </form>
                      <form action={toggleManagedTenantActiveAction}>
                        <input type="hidden" name="tenantId" value={tenant.id} />
                        <input type="hidden" name="nextActive" value={String(!tenant.isActive)} />
                        <button
                          type="submit"
                          className="rounded-full border border-[var(--color-line)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-accent-soft)]"
                        >
                          {tenant.isActive ? "Deactiveer" : "Activeer"}
                        </button>
                      </form>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {tenants.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-[var(--color-muted)]">
                  Geen tenants gevonden.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

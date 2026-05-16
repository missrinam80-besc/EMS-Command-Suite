"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type PatientHistoryItem = {
  id: string;
  title: string;
  summary: string | null;
  createdAt: string;
  href: string;
  typeLabel: "trauma" | "opname";
};

type PatientHistoryListProps = {
  items: PatientHistoryItem[];
};

function getTypeClass(typeLabel: string) {
  switch (typeLabel) {
    case "trauma":
      return "bg-[#dff6ff] text-[#0f5f8f] border-[#a8ddf3]";
    case "opname":
      return "bg-[#fff1db] text-[#9a5b00] border-[#f2c98b]";
    default:
      return "bg-[var(--color-surface)] text-[var(--color-ink)] border-[var(--color-line)]";
  }
}

export function PatientHistoryList({ items }: PatientHistoryListProps) {
  const [filter, setFilter] = useState<"alles" | "trauma" | "opname">("alles");

  const filteredItems = useMemo(() => {
    if (filter === "alles") return items;
    return items.filter((item) => item.typeLabel === filter);
  }, [items, filter]);

  return (
    <>
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="grid min-w-[220px] gap-2 text-sm text-[var(--color-muted)]">
          Filter op rapporttype
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value as "alles" | "trauma" | "opname")}
            className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
          >
            <option value="alles">Alles</option>
            <option value="trauma">Traumarapporten</option>
            <option value="opname">Opnamerapporten</option>
          </select>
        </label>
      </div>

      <div className="mt-6 grid gap-4">
        {filteredItems.length ? (
          filteredItems.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-[var(--color-line)] bg-white px-5 py-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold text-[var(--color-ink)]">{item.title}</h3>
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getTypeClass(item.typeLabel)}`}
                    >
                      {item.typeLabel}
                    </span>
                  </div>
                  {item.summary ? (
                    <p className="mt-2 text-sm text-[var(--color-muted)]">{item.summary}</p>
                  ) : null}
                  <p className="mt-2 text-sm text-[var(--color-muted)]">
                    Toegevoegd op {new Date(item.createdAt).toLocaleString("nl-BE")}
                  </p>
                </div>

                <Link
                  href={item.href}
                  className="rounded-full border border-[var(--color-line)] px-3 py-1 text-xs font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-accent-soft)]"
                >
                  Open
                </Link>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-[var(--color-line)] px-4 py-6 text-sm text-[var(--color-muted)]">
            Geen rapporten gevonden voor deze filter.
          </div>
        )}
      </div>
    </>
  );
}

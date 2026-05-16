type SectionPageProps = {
  kicker: string;
  title: string;
  description: string;
  modules: string[];
};

export function SectionPage({
  kicker,
  title,
  description,
  modules,
}: SectionPageProps) {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-12rem)] w-full max-w-7xl flex-col gap-8 px-6 py-8 md:px-10 lg:px-12">
      <section className="rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-8 shadow-[0_22px_45px_rgba(15,23,42,0.07)]">
        <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-muted)]">
          {kicker}
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
          {title}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--color-muted)]">
          {description}
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {modules.map((module) => (
          <article
            key={module}
            className="rounded-[1.5rem] border border-[var(--color-line)] bg-[var(--color-panel)] p-5"
          >
            <p className="text-sm uppercase tracking-[0.18em] text-[var(--color-muted)]">
              Module
            </p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--color-ink)]">
              {module}
            </h2>
            <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
              Placeholder voor de eerste functionele build van deze sectie.
            </p>
          </article>
        ))}
      </section>
    </main>
  );
}

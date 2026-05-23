import Link from "next/link";
import { notFound } from "next/navigation";
import { hasPermission, requireAnyPermission } from "@/lib/auth";
import { getHandbookArticleBySlug } from "@/lib/handbook";

type HandbookArticlePageProps = {
  params: Promise<{ slug: string }>;
};

export default async function HandbookArticlePage({ params }: HandbookArticlePageProps) {
  const session = await requireAnyPermission(["handbook.read", "handbook.manage"]);
  const { slug } = await params;
  const article = await getHandbookArticleBySlug(slug, {
    includeRestricted: hasPermission(session, "handbook.manage"),
    viewerProfileId: session.userId,
  });
  if (!article) notFound();

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-8 md:px-10">
      <div>
        <Link
          href="/handboek"
          className="rounded-full border border-[var(--color-line)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)]"
        >
          Terug naar handboek
        </Link>
      </div>
      <header className="rounded-[1.25rem] border border-[var(--color-line)] bg-[var(--color-surface)] p-6">
        <p className="text-sm text-[var(--color-muted)]">{article.categoryLabel ?? "Handboek"}</p>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--color-ink)]">{article.title}</h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Laatst bijgewerkt: {new Date(article.updatedAt).toLocaleString("nl-BE")}
        </p>
      </header>
      {article.summary ? (
        <section className="rounded-[1.25rem] border border-[var(--color-line)] bg-[var(--color-surface)] p-6 text-[var(--color-muted)]">
          {article.summary}
        </section>
      ) : null}
      <article className="rounded-[1.25rem] border border-[var(--color-line)] bg-[var(--color-surface)] p-6 text-sm leading-7 whitespace-pre-wrap text-[var(--color-ink)]">
        {article.content}
      </article>
    </main>
  );
}

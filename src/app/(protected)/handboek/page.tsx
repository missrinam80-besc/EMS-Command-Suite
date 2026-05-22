import { FeedbackBanner } from "@/components/feedback-banner";
import { hasPermission, requireAnyPermission } from "@/lib/auth";
import { readFeedback } from "@/lib/feedback";
import {
  getHandbookArticles,
  getHandbookCategories,
  getHandbookVisibilityReferences,
} from "@/lib/handbook";
import {
  createHandbookArticleAction,
  createHandbookCategoryAction,
  deleteHandbookArticleAction,
  updateHandbookArticleAction,
} from "./actions";

type HandboekPageProps = {
  searchParams: Promise<{ success?: string; error?: string }>;
};

export default async function HandboekPage({ searchParams }: HandboekPageProps) {
  const session = await requireAnyPermission(["handbook.read", "handbook.manage"]);
  const feedback = readFeedback(await searchParams);
  const [categories, articles, visibility] = await Promise.all([
    getHandbookCategories(),
    getHandbookArticles(),
    getHandbookVisibilityReferences(),
  ]);
  const canManage = hasPermission(session, "handbook.manage");

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8 md:px-10 lg:px-12">
      {feedback ? <FeedbackBanner type={feedback.type} message={feedback.message} /> : null}

      <section className="rounded-[1.75rem] border border-[var(--color-line-strong)] bg-[radial-gradient(circle_at_top_left,_rgba(82,210,255,0.16),_transparent_34%),linear-gradient(145deg,_var(--color-hero-start),_var(--color-hero-end))] p-8 text-[var(--color-hero-ink)] shadow-[0_30px_80px_rgba(4,28,44,0.24)]">
        <p className="text-sm uppercase tracking-[0.2em] text-cyan-50/70">Handboek</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em]">
          Richtlijnen, procedures en interne kennis
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-cyan-50/84">
          Publicatiestatus en zichtbaarheid worden per artikel beheerd op basis van rang en
          specialisatie.
        </p>
      </section>

      {canManage ? (
        <section className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-[1.5rem] border border-[var(--color-line)] bg-[var(--color-surface)] p-6">
            <h2 className="text-xl font-semibold text-[var(--color-ink)]">Categorie aanmaken</h2>
            <form action={createHandbookCategoryAction} className="mt-4 space-y-3">
              <input
                name="code"
                placeholder="code (bv. triage)"
                className="w-full rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-sm"
                required
              />
              <input
                name="label"
                placeholder="Naam"
                className="w-full rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-sm"
                required
              />
              <textarea
                name="description"
                placeholder="Beschrijving"
                className="h-24 w-full rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-sm"
              />
              <input
                type="number"
                name="sortOrder"
                defaultValue={100}
                className="w-32 rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-sm"
              />
              <label className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
                <input type="checkbox" name="isActive" defaultChecked />
                Actief
              </label>
              <button
                type="submit"
                className="rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)]"
              >
                Categorie opslaan
              </button>
            </form>
          </article>

          <article className="rounded-[1.5rem] border border-[var(--color-line)] bg-[var(--color-surface)] p-6">
            <h2 className="text-xl font-semibold text-[var(--color-ink)]">Artikel aanmaken</h2>
            <form action={createHandbookArticleAction} className="mt-4 space-y-3">
              <select
                name="categoryId"
                className="w-full rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-sm"
                required
              >
                <option value="">Selecteer categorie</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </select>
              <input
                name="title"
                placeholder="Titel"
                className="w-full rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-sm"
                required
              />
              <input
                name="slug"
                placeholder="slug (bv. trauma-intake)"
                className="w-full rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-sm"
                required
              />
              <textarea
                name="summary"
                placeholder="Korte samenvatting"
                className="h-20 w-full rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-sm"
              />
              <textarea
                name="content"
                placeholder="Volledige inhoud"
                className="h-36 w-full rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-sm"
                required
              />
              <div className="grid gap-3 md:grid-cols-2">
                <select
                  name="status"
                  defaultValue="draft"
                  className="rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-sm"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
                <input
                  type="number"
                  name="sortOrder"
                  defaultValue={100}
                  className="rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-sm"
                />
              </div>
              <details className="rounded-xl border border-[var(--color-line)] p-3">
                <summary className="cursor-pointer text-sm font-semibold text-[var(--color-ink)]">
                  Zichtbaarheid filteren (optioneel)
                </summary>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
                      Rangen
                    </p>
                    <div className="mt-2 max-h-32 space-y-2 overflow-auto">
                      {visibility.ranks.map((rank) => (
                        <label key={rank.id} className="flex items-center gap-2 text-sm">
                          <input type="checkbox" name="visibleRankIds" value={rank.id} />
                          {rank.name}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
                      Specialisaties
                    </p>
                    <div className="mt-2 max-h-32 space-y-2 overflow-auto">
                      {visibility.specializations.map((item) => (
                        <label key={item.id} className="flex items-center gap-2 text-sm">
                          <input type="checkbox" name="visibleSpecializationIds" value={item.id} />
                          {item.name}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </details>
              <label className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
                <input type="checkbox" name="isActive" defaultChecked />
                Actief
              </label>
              <button
                type="submit"
                className="rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)]"
              >
                Artikel opslaan
              </button>
            </form>
          </article>
        </section>
      ) : null}

      <section className="space-y-4">
        {articles.map((article) => (
          <details
            key={article.id}
            className="rounded-[1.25rem] border border-[var(--color-line)] bg-[var(--color-surface)] p-4"
          >
            <summary className="cursor-pointer">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--color-ink)]">{article.title}</h2>
                  <p className="text-sm text-[var(--color-muted)]">
                    /{article.slug} · {article.status}
                  </p>
                </div>
                <p className="text-xs text-[var(--color-muted)]">
                  {new Date(article.updatedAt).toLocaleString("nl-BE")}
                </p>
              </div>
            </summary>
            <p className="mt-3 text-sm text-[var(--color-muted)]">{article.summary ?? "Geen samenvatting."}</p>
            <div className="mt-3 rounded-xl border border-[var(--color-line)] bg-white/70 p-3 text-sm whitespace-pre-wrap">
              {article.content}
            </div>
            {canManage ? (
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <form action={updateHandbookArticleAction} className="space-y-2 rounded-xl border border-[var(--color-line)] p-3">
                  <input type="hidden" name="id" value={article.id} />
                  <select
                    name="categoryId"
                    defaultValue={article.categoryId}
                    className="w-full rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-sm"
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                  <input name="title" defaultValue={article.title} className="w-full rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-sm" />
                  <input name="slug" defaultValue={article.slug} className="w-full rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-sm" />
                  <textarea name="summary" defaultValue={article.summary ?? ""} className="h-20 w-full rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-sm" />
                  <textarea name="content" defaultValue={article.content} className="h-32 w-full rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-sm" />
                  <div className="grid grid-cols-2 gap-2">
                    <select name="status" defaultValue={article.status} className="rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-sm">
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                    <input type="number" name="sortOrder" defaultValue={article.sortOrder} className="rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-sm" />
                  </div>
                  <details className="rounded-xl border border-[var(--color-line)] p-3">
                    <summary className="cursor-pointer text-sm font-semibold text-[var(--color-ink)]">
                      Zichtbaarheid (rang/specialisatie)
                    </summary>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <div className="max-h-28 space-y-1 overflow-auto">
                        {visibility.ranks.map((rank) => (
                          <label key={`${article.id}-rank-${rank.id}`} className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              name="visibleRankIds"
                              value={rank.id}
                              defaultChecked={article.visibleRankIds.includes(rank.id)}
                            />
                            {rank.name}
                          </label>
                        ))}
                      </div>
                      <div className="max-h-28 space-y-1 overflow-auto">
                        {visibility.specializations.map((item) => (
                          <label key={`${article.id}-spec-${item.id}`} className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              name="visibleSpecializationIds"
                              value={item.id}
                              defaultChecked={article.visibleSpecializationIds.includes(item.id)}
                            />
                            {item.name}
                          </label>
                        ))}
                      </div>
                    </div>
                  </details>
                  <label className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
                    <input type="checkbox" name="isActive" defaultChecked={article.isActive} />
                    Actief
                  </label>
                  <button type="submit" className="rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)]">
                    Update
                  </button>
                </form>
                <form action={deleteHandbookArticleAction} className="self-start">
                  <input type="hidden" name="id" value={article.id} />
                  <button type="submit" className="rounded-full border border-red-300 px-4 py-2 text-sm font-semibold text-red-700">
                    Verwijderen
                  </button>
                </form>
              </div>
            ) : null}
          </details>
        ))}
      </section>
    </main>
  );
}


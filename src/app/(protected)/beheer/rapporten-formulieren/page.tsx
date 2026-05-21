import Link from "next/link";
import { FeedbackBanner } from "@/components/feedback-banner";
import { AdminReportFormBuilder } from "@/components/admin-report-form-builder";
import { requireAnyPermission } from "@/lib/auth";
import { readFeedback } from "@/lib/feedback";
import {
  getManagedFormFields,
  getManagedFormTemplates,
  getManagedReportTypes,
} from "@/lib/admin";

type ReportFormBuilderPageProps = {
  searchParams: Promise<{ success?: string; error?: string }>;
};

export default async function ReportFormBuilderPage({
  searchParams,
}: ReportFormBuilderPageProps) {
  await requireAnyPermission(["config.report_types.manage", "config.forms.manage"]);

  const feedback = readFeedback(await searchParams);
  const [reportTypes, templates, fields] = await Promise.all([
    getManagedReportTypes(),
    getManagedFormTemplates(),
    getManagedFormFields(),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8 md:px-10 lg:px-12">
      {feedback ? <FeedbackBanner type={feedback.type} message={feedback.message} /> : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-muted)]">
            Beheer
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-[var(--color-ink)]">
            Rapporten en formulieren
          </h1>
        </div>
        <Link
          href="/beheer"
          className="rounded-full border border-[var(--color-line)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-accent-soft)]"
        >
          Terug naar beheer
        </Link>
      </div>

      <AdminReportFormBuilder
        reportTypes={reportTypes}
        templates={templates}
        fields={fields}
      />
    </main>
  );
}


import { FeedbackBanner } from "@/components/feedback-banner";
import { OrganisationWorkspace } from "@/components/organisation-workspace";
import { hasPermission, requireAnyPermission } from "@/lib/auth";
import { readFeedback } from "@/lib/feedback";
import { getOrganisationWorkspaceData } from "@/lib/organisation";

type OrganisatiePageProps = {
  searchParams: Promise<{ success?: string; error?: string }>;
};

export default async function OrganisatiePage({ searchParams }: OrganisatiePageProps) {
  const session = await requireAnyPermission(["meetings.read", "minutes.read"]);
  const feedback = readFeedback(await searchParams);
  const data = await getOrganisationWorkspaceData();

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8 md:px-10 lg:px-12">
      {feedback ? <FeedbackBanner type={feedback.type} message={feedback.message} /> : null}

      <section>
        <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-muted)]">Organisatie</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
          Meetings, notulen en opvolging
        </h1>
        <p className="mt-3 max-w-3xl text-sm text-[var(--color-muted)]">
          Centrale werkruimte voor meetingaanvragen, planning, notulen en actiepunten met
          traceerbare follow-up.
        </p>
      </section>

      <OrganisationWorkspace
        data={data}
        canCreateMeeting={hasPermission(session, "meetings.create")}
        canManageMeetings={hasPermission(session, "meetings.update")}
        canEditMinutes={hasPermission(session, "minutes.update")}
      />
    </main>
  );
}

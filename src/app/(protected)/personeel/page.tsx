import { StaffWorkspace } from "@/components/staff-workspace";
import { requirePermission } from "@/lib/auth";
import { FeedbackBanner } from "@/components/feedback-banner";
import { readFeedback } from "@/lib/feedback";
import {
  getActiveStaffCount,
  getStaffDetail,
  getStaffOnLeaveCount,
  getStaffWorkspaceRows,
} from "@/lib/personnel";

type PersoneelPageProps = {
  searchParams: Promise<{ success?: string; error?: string }>;
};

export default async function PersoneelPage({ searchParams }: PersoneelPageProps) {
  const session = await requirePermission("staff.read_basic");
  const feedback = readFeedback(await searchParams);
  const staff = await getStaffWorkspaceRows();
  const staffDetails = (await Promise.all(staff.map((member) => getStaffDetail(member.id)))).filter(
    (member) => member !== null,
  );
  const activeStaff = getActiveStaffCount(staff);
  const onLeave = getStaffOnLeaveCount(staff);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8 md:px-10 lg:px-12">
      {feedback ? <FeedbackBanner type={feedback.type} message={feedback.message} /> : null}

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-[1.5rem] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-6">
          <p className="text-sm uppercase tracking-[0.18em] text-[var(--color-muted)]">
            Actief personeel
          </p>
          <p className="mt-2 text-4xl font-semibold text-[var(--color-ink)]">
            {activeStaff}
          </p>
        </article>
        <article className="rounded-[1.5rem] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-6">
          <p className="text-sm uppercase tracking-[0.18em] text-[var(--color-muted)]">
            Lopende afwezigheden
          </p>
          <p className="mt-2 text-4xl font-semibold text-[var(--color-ink)]">
            {onLeave}
          </p>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <StaffWorkspace
          selfProfileId={session.userId}
          staff={staff}
          staffDetails={staffDetails}
        />
      </section>
    </main>
  );
}

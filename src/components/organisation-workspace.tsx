import {
  createMeetingActionItemAction,
  createMeetingRequestAction,
  updateMeetingActionItemStatusAction,
  updateMeetingMinutesAction,
  updateMeetingPlanningAction,
} from "@/app/(protected)/organisatie/actions";
import type {
  OrganisationStaffMember,
  OrganisationWorkspaceData,
} from "@/lib/organisation";

type OrganisationWorkspaceProps = {
  data: OrganisationWorkspaceData;
  canCreateMeeting: boolean;
  canManageMeetings: boolean;
  canEditMinutes: boolean;
};

function formatDate(date: string | null | undefined) {
  if (!date) return "Niet ingepland";
  return new Date(date).toLocaleDateString("nl-BE");
}

function formatDateTime(date: string | null | undefined) {
  if (!date) return "Niet ingepland";
  return new Date(date).toLocaleString("nl-BE");
}

function getStatusBadge(status: string) {
  switch (status) {
    case "aangevraagd":
      return "bg-[#fff2c7] text-[#73510e]";
    case "goedgekeurd":
      return "bg-[#dff7e7] text-[#1f6a3b]";
    case "gepland":
      return "bg-[#dbeafe] text-[#1d4d8f]";
    case "afgerond":
      return "bg-[#e6ecf4] text-[#334155]";
    case "geweigerd":
    case "geannuleerd":
      return "bg-[#ffe4e8] text-[#8e1f35]";
    default:
      return "bg-[var(--color-surface-alt)] text-[var(--color-muted)]";
  }
}

function resolveStaffLabel(staff: OrganisationStaffMember[], profileId: string | null | undefined) {
  if (!profileId) return "Niet toegewezen";
  const profile = staff.find((item) => item.id === profileId);
  if (!profile) return profileId;
  return `${profile.fullName} (${profile.callSign})`;
}

export function OrganisationWorkspace({
  data,
  canCreateMeeting,
  canManageMeetings,
  canEditMinutes,
}: OrganisationWorkspaceProps) {
  const actionItemsByMeetingId = new Map(
    data.meetings.map((meeting) => [
      meeting.id,
      data.actionItems.filter((actionItem) => actionItem.meetingId === meeting.id),
    ]),
  );
  const openActionItems = data.actionItems.filter((actionItem) => actionItem.status !== "afgerond");

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-[1.5rem] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-6">
          <p className="text-sm uppercase tracking-[0.18em] text-[var(--color-muted)]">
            Meetings totaal
          </p>
          <p className="mt-2 text-4xl font-semibold text-[var(--color-ink)]">{data.meetings.length}</p>
        </article>
        <article className="rounded-[1.5rem] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-6">
          <p className="text-sm uppercase tracking-[0.18em] text-[var(--color-muted)]">
            Open aanvragen
          </p>
          <p className="mt-2 text-4xl font-semibold text-[var(--color-ink)]">
            {data.meetings.filter((meeting) => meeting.status === "aangevraagd").length}
          </p>
        </article>
        <article className="rounded-[1.5rem] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-6">
          <p className="text-sm uppercase tracking-[0.18em] text-[var(--color-muted)]">
            Open actiepunten
          </p>
          <p className="mt-2 text-4xl font-semibold text-[var(--color-ink)]">{openActionItems.length}</p>
        </article>
      </section>

      {canCreateMeeting ? (
        <section className="rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-6 shadow-[var(--shadow-soft)]">
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-muted)]">
            Meetingaanvraag
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">Nieuwe aanvraag</h2>
          <form action={createMeetingRequestAction} className="mt-6 grid gap-4">
            <div className="grid gap-2">
              <label htmlFor="title" className="text-sm font-medium text-[var(--color-ink)]">
                Titel
              </label>
              <input
                id="title"
                name="title"
                required
                className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-ink)]"
                placeholder="Bijv. Evaluatie weekendinzet"
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="purpose" className="text-sm font-medium text-[var(--color-ink)]">
                Doel
              </label>
              <textarea
                id="purpose"
                name="purpose"
                required
                rows={3}
                className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-ink)]"
                placeholder="Wat moet beslist of opgevolgd worden?"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <label htmlFor="location" className="text-sm font-medium text-[var(--color-ink)]">
                  Locatie
                </label>
                <input
                  id="location"
                  name="location"
                  className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-ink)]"
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="requestedDate" className="text-sm font-medium text-[var(--color-ink)]">
                  Gewenste datum
                </label>
                <input
                  id="requestedDate"
                  type="date"
                  name="requestedDate"
                  className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-ink)]"
                />
              </div>
            </div>
            <fieldset className="grid gap-2">
              <legend className="text-sm font-medium text-[var(--color-ink)]">Deelnemers</legend>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {data.staff.map((profile) => (
                  <label
                    key={profile.id}
                    className="flex items-center gap-2 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-ink)]"
                  >
                    <input type="checkbox" name="participantProfileIds" value={profile.id} />
                    <span>{profile.fullName}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <button
              type="submit"
              className="inline-flex w-fit items-center justify-center rounded-full bg-[var(--color-accent)] px-5 py-2 text-sm font-semibold text-white"
            >
              Aanvraag indienen
            </button>
          </form>
        </section>
      ) : null}

      <section className="grid gap-5">
        {data.meetings.length ? (
          data.meetings.map((meeting) => {
            const meetingActionItems = actionItemsByMeetingId.get(meeting.id) ?? [];
            return (
              <article
                key={meeting.id}
                className="rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-6 shadow-[var(--shadow-soft)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-muted)]">
                      Meeting
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">{meeting.title}</h3>
                    <p className="mt-2 text-sm text-[var(--color-muted)]">{meeting.purpose || "Geen omschrijving."}</p>
                  </div>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getStatusBadge(meeting.status)}`}
                  >
                    {meeting.status}
                  </span>
                </div>

                <dl className="mt-4 grid gap-3 text-sm text-[var(--color-ink)] md:grid-cols-2">
                  <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3">
                    <dt className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
                      Gewenste datum
                    </dt>
                    <dd className="mt-1">{formatDate(meeting.requestedDate)}</dd>
                  </div>
                  <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3">
                    <dt className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
                      Planning
                    </dt>
                    <dd className="mt-1">
                      {formatDateTime(meeting.scheduledStart)}{" "}
                      {meeting.scheduledEnd ? `- ${formatDateTime(meeting.scheduledEnd)}` : ""}
                    </dd>
                  </div>
                  <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3">
                    <dt className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
                      Locatie
                    </dt>
                    <dd className="mt-1">{meeting.location || "Niet bepaald"}</dd>
                  </div>
                  <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3">
                    <dt className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
                      Deelnemers
                    </dt>
                    <dd className="mt-1">
                      {meeting.participantProfileIds.length
                        ? meeting.participantProfileIds
                            .map((profileId) => resolveStaffLabel(data.staff, profileId))
                            .join(", ")
                        : "Niet toegewezen"}
                    </dd>
                  </div>
                </dl>

                {canManageMeetings ? (
                  <form action={updateMeetingPlanningAction} className="mt-5 grid gap-3 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-4">
                    <input type="hidden" name="meetingId" value={meeting.id} />
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                      Meetings beheren
                    </p>
                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="grid gap-1 text-sm text-[var(--color-ink)]">
                        Status
                        <select
                          name="status"
                          defaultValue={meeting.status}
                          className="rounded-xl border border-[var(--color-line)] bg-[var(--color-panel-strong)] px-3 py-2 text-sm"
                        >
                          <option value="aangevraagd">aangevraagd</option>
                          <option value="goedgekeurd">goedgekeurd</option>
                          <option value="gepland">gepland</option>
                          <option value="afgerond">afgerond</option>
                          <option value="geweigerd">geweigerd</option>
                          <option value="geannuleerd">geannuleerd</option>
                        </select>
                      </label>
                      <label className="grid gap-1 text-sm text-[var(--color-ink)]">
                        Locatie
                        <input
                          name="location"
                          defaultValue={meeting.location ?? ""}
                          className="rounded-xl border border-[var(--color-line)] bg-[var(--color-panel-strong)] px-3 py-2 text-sm"
                        />
                      </label>
                      <label className="grid gap-1 text-sm text-[var(--color-ink)]">
                        Start
                        <input
                          type="datetime-local"
                          name="scheduledStart"
                          defaultValue={meeting.scheduledStart ? meeting.scheduledStart.slice(0, 16) : ""}
                          className="rounded-xl border border-[var(--color-line)] bg-[var(--color-panel-strong)] px-3 py-2 text-sm"
                        />
                      </label>
                      <label className="grid gap-1 text-sm text-[var(--color-ink)]">
                        Einde
                        <input
                          type="datetime-local"
                          name="scheduledEnd"
                          defaultValue={meeting.scheduledEnd ? meeting.scheduledEnd.slice(0, 16) : ""}
                          className="rounded-xl border border-[var(--color-line)] bg-[var(--color-panel-strong)] px-3 py-2 text-sm"
                        />
                      </label>
                    </div>
                    <label className="grid gap-1 text-sm text-[var(--color-ink)]">
                      Beslisnota
                      <textarea
                        name="decisionNote"
                        rows={2}
                        defaultValue={meeting.decisionNote ?? ""}
                        className="rounded-xl border border-[var(--color-line)] bg-[var(--color-panel-strong)] px-3 py-2 text-sm"
                      />
                    </label>
                    <button
                      type="submit"
                      className="inline-flex w-fit items-center justify-center rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white"
                    >
                      Planning opslaan
                    </button>
                  </form>
                ) : null}

                {canEditMinutes ? (
                  <form action={updateMeetingMinutesAction} className="mt-5 grid gap-3 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-4">
                    <input type="hidden" name="meetingId" value={meeting.id} />
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                      Notulen editor
                    </p>
                    <label className="grid gap-1 text-sm text-[var(--color-ink)]">
                      Notulen
                      <textarea
                        name="minutes"
                        rows={4}
                        defaultValue={meeting.minutes ?? ""}
                        className="rounded-xl border border-[var(--color-line)] bg-[var(--color-panel-strong)] px-3 py-2 text-sm"
                        required
                      />
                    </label>
                    <label className="grid gap-1 text-sm text-[var(--color-ink)]">
                      Follow-up
                      <textarea
                        name="followUp"
                        rows={3}
                        defaultValue={meeting.followUp ?? ""}
                        className="rounded-xl border border-[var(--color-line)] bg-[var(--color-panel-strong)] px-3 py-2 text-sm"
                      />
                    </label>
                    <button
                      type="submit"
                      className="inline-flex w-fit items-center justify-center rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white"
                    >
                      Notulen opslaan
                    </button>
                  </form>
                ) : null}

                <section className="mt-5 grid gap-3 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                    Actiepunten en follow-up
                  </p>
                  {meetingActionItems.length ? (
                    <div className="grid gap-3">
                      {meetingActionItems.map((actionItem) => (
                        <article
                          key={actionItem.id}
                          className="rounded-xl border border-[var(--color-line)] bg-[var(--color-panel-strong)] px-3 py-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-[var(--color-ink)]">{actionItem.title}</p>
                            <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${getStatusBadge(actionItem.status)}`}>
                              {actionItem.status}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-[var(--color-muted)]">
                            {actionItem.description || "Geen toelichting."}
                          </p>
                          <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
                            Eigenaar: {resolveStaffLabel(data.staff, actionItem.ownerProfileId)} | deadline{" "}
                            {formatDate(actionItem.dueDate)}
                          </p>
                          {canManageMeetings ? (
                            <form action={updateMeetingActionItemStatusAction} className="mt-3 flex flex-wrap items-center gap-2">
                              <input type="hidden" name="meetingId" value={meeting.id} />
                              <input type="hidden" name="actionItemId" value={actionItem.id} />
                              <select
                                name="status"
                                defaultValue={actionItem.status}
                                className="rounded-xl border border-[var(--color-line)] bg-[var(--color-panel-strong)] px-3 py-2 text-xs"
                              >
                                <option value="open">open</option>
                                <option value="in_uitvoering">in_uitvoering</option>
                                <option value="geblokkeerd">geblokkeerd</option>
                                <option value="afgerond">afgerond</option>
                              </select>
                              <button
                                type="submit"
                                className="rounded-full border border-[var(--color-line)] px-3 py-1 text-xs font-semibold text-[var(--color-ink)]"
                              >
                                Status bijwerken
                              </button>
                            </form>
                          ) : null}
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[var(--color-muted)]">Nog geen actiepunten gekoppeld aan deze meeting.</p>
                  )}

                  {canManageMeetings ? (
                    <form action={createMeetingActionItemAction} className="grid gap-3 rounded-xl border border-dashed border-[var(--color-line)] px-3 py-3">
                      <input type="hidden" name="meetingId" value={meeting.id} />
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                        Nieuw actiepunt
                      </p>
                      <label className="grid gap-1 text-xs text-[var(--color-ink)]">
                        Titel
                        <input
                          name="title"
                          required
                          className="rounded-xl border border-[var(--color-line)] bg-[var(--color-panel-strong)] px-3 py-2 text-sm"
                        />
                      </label>
                      <label className="grid gap-1 text-xs text-[var(--color-ink)]">
                        Beschrijving
                        <textarea
                          name="description"
                          rows={2}
                          className="rounded-xl border border-[var(--color-line)] bg-[var(--color-panel-strong)] px-3 py-2 text-sm"
                        />
                      </label>
                      <div className="grid gap-3 md:grid-cols-2">
                        <label className="grid gap-1 text-xs text-[var(--color-ink)]">
                          Eigenaar
                          <select
                            name="ownerProfileId"
                            className="rounded-xl border border-[var(--color-line)] bg-[var(--color-panel-strong)] px-3 py-2 text-sm"
                            defaultValue=""
                          >
                            <option value="">Niet toegewezen</option>
                            {data.staff.map((profile) => (
                              <option key={profile.id} value={profile.id}>
                                {profile.fullName}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="grid gap-1 text-xs text-[var(--color-ink)]">
                          Deadline
                          <input
                            type="date"
                            name="dueDate"
                            className="rounded-xl border border-[var(--color-line)] bg-[var(--color-panel-strong)] px-3 py-2 text-sm"
                          />
                        </label>
                      </div>
                      <button
                        type="submit"
                        className="inline-flex w-fit items-center justify-center rounded-full bg-[var(--color-accent)] px-4 py-2 text-xs font-semibold text-white"
                      >
                        Actiepunt toevoegen
                      </button>
                    </form>
                  ) : null}
                </section>
              </article>
            );
          })
        ) : (
          <article className="rounded-[1.75rem] border border-dashed border-[var(--color-line)] bg-[var(--color-panel-strong)] p-6 text-sm text-[var(--color-muted)]">
            Er zijn nog geen meetings geregistreerd.
          </article>
        )}
      </section>
    </div>
  );
}

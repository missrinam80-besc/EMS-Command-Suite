import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  addDemoMeeting,
  addDemoMeetingActionItem,
  getDemoMeetingActionItems,
  getDemoMeetings,
  getDemoStaffProfiles,
  updateDemoMeeting,
  updateDemoMeetingActionItem,
} from "@/lib/demo-store";
import { writeAuditLog } from "@/lib/audit";
import { shouldUseDemoData } from "@/lib/env";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  Meeting,
  MeetingActionItem,
  MeetingActionStatus,
  MeetingStatus,
} from "@/types/domain";

export type OrganisationStaffMember = {
  id: string;
  fullName: string;
  callSign: string;
  rankName: string;
};

export type OrganisationWorkspaceData = {
  meetings: Meeting[];
  actionItems: MeetingActionItem[];
  staff: OrganisationStaffMember[];
};

const meetingStatusValues = [
  "aangevraagd",
  "goedgekeurd",
  "gepland",
  "afgerond",
  "geannuleerd",
  "geweigerd",
] as const;

const meetingActionStatusValues = [
  "open",
  "in_uitvoering",
  "geblokkeerd",
  "afgerond",
] as const;

export const meetingRequestSchema = z.object({
  title: z.string().trim().min(4, "Titel is verplicht."),
  purpose: z.string().trim().min(5, "Doel van de meeting is verplicht."),
  location: z.string().trim().optional(),
  requestedDate: z.string().trim().optional(),
  participantProfileIds: z.array(z.string().trim()).default([]),
});

export const meetingPlanningSchema = z.object({
  meetingId: z.string().trim().min(1, "Meeting ontbreekt."),
  status: z.enum(meetingStatusValues),
  location: z.string().trim().optional(),
  scheduledStart: z.string().trim().optional(),
  scheduledEnd: z.string().trim().optional(),
  decisionNote: z.string().trim().optional(),
});

export const meetingMinutesSchema = z.object({
  meetingId: z.string().trim().min(1, "Meeting ontbreekt."),
  minutes: z.string().trim().min(5, "Notulen mogen niet leeg zijn."),
  followUp: z.string().trim().optional(),
});

export const meetingActionItemSchema = z.object({
  meetingId: z.string().trim().min(1, "Meeting ontbreekt."),
  title: z.string().trim().min(3, "Actiepunt titel is verplicht."),
  description: z.string().trim().optional(),
  ownerProfileId: z.string().trim().optional(),
  dueDate: z.string().trim().optional(),
});

export const meetingActionItemStatusSchema = z.object({
  meetingId: z.string().trim().min(1, "Meeting ontbreekt."),
  actionItemId: z.string().trim().min(1, "Actiepunt ontbreekt."),
  status: z.enum(meetingActionStatusValues),
});

function normalizeMeeting(meeting: {
  id: string;
  title: string;
  purpose: string | null;
  location: string | null;
  requested_date: string | null;
  participant_profile_ids: string[] | null;
  status: string;
  requested_by: string | null;
  decided_by: string | null;
  decision_note: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  minutes: string | null;
  follow_up: string | null;
  created_at: string;
  updated_at: string | null;
}): Meeting {
  return {
    id: meeting.id,
    title: meeting.title,
    purpose: meeting.purpose,
    location: meeting.location,
    requestedDate: meeting.requested_date,
    participantProfileIds: meeting.participant_profile_ids ?? [],
    status: meeting.status as MeetingStatus,
    requestedBy: meeting.requested_by,
    decidedBy: meeting.decided_by,
    decisionNote: meeting.decision_note,
    scheduledStart: meeting.scheduled_start,
    scheduledEnd: meeting.scheduled_end,
    minutes: meeting.minutes,
    followUp: meeting.follow_up,
    createdAt: meeting.created_at,
    updatedAt: meeting.updated_at,
  };
}

function normalizeActionItem(actionItem: {
  id: string;
  meeting_id: string;
  title: string;
  description: string | null;
  owner_profile_id: string | null;
  due_date: string | null;
  status: string;
  created_by: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string | null;
}): MeetingActionItem {
  return {
    id: actionItem.id,
    meetingId: actionItem.meeting_id,
    title: actionItem.title,
    description: actionItem.description,
    ownerProfileId: actionItem.owner_profile_id,
    dueDate: actionItem.due_date,
    status: actionItem.status as MeetingActionStatus,
    createdBy: actionItem.created_by,
    completedAt: actionItem.completed_at,
    createdAt: actionItem.created_at,
    updatedAt: actionItem.updated_at,
  };
}

export async function getOrganisationWorkspaceData(): Promise<OrganisationWorkspaceData> {
  if (shouldUseDemoData()) {
    return {
      meetings: getDemoMeetings().sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      actionItems: getDemoMeetingActionItems().sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
      ),
      staff: getDemoStaffProfiles()
        .map((profile) => ({
          id: profile.id,
          fullName: profile.fullName,
          callSign: profile.callSign,
          rankName: profile.rankName,
        }))
        .sort((a, b) => a.fullName.localeCompare(b.fullName, "nl-BE")),
    };
  }

  const supabase = await createSupabaseServerClient();
  const [
    { data: meetings, error: meetingsError },
    { data: actionItems, error: actionItemsError },
    { data: profiles, error: profilesError },
  ] = await Promise.all([
    supabase.from("meetings").select("*").order("created_at", { ascending: false }),
    supabase
      .from("meeting_action_items")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("id, full_name, call_sign, ranks(name)")
      .order("full_name", { ascending: true }),
  ]);

  if (meetingsError || actionItemsError || profilesError) {
    return { meetings: [], actionItems: [], staff: [] };
  }

  const staff = (profiles ?? []).map((profile) => {
    const rankRelation = profile.ranks as
      | { name?: string | null }
      | { name?: string | null }[]
      | null;
    const rankRecord = Array.isArray(rankRelation) ? rankRelation[0] : rankRelation;

    return {
      id: profile.id,
      fullName: profile.full_name,
      callSign: profile.call_sign ?? profile.id,
      rankName: rankRecord?.name ?? "Ongekend",
    };
  });

  return {
    meetings: (meetings ?? []).map(normalizeMeeting),
    actionItems: (actionItems ?? []).map(normalizeActionItem),
    staff,
  };
}

export async function createMeetingRequestRecord(
  input: z.infer<typeof meetingRequestSchema>,
  requestedBy: string,
) {
  const parsed = meetingRequestSchema.parse(input);

  if (shouldUseDemoData()) {
    const now = new Date().toISOString();
    addDemoMeeting({
      id: randomUUID(),
      title: parsed.title,
      purpose: parsed.purpose,
      location: parsed.location || null,
      requestedDate: parsed.requestedDate || null,
      participantProfileIds: parsed.participantProfileIds,
      status: "aangevraagd",
      requestedBy,
      decisionNote: null,
      decidedBy: null,
      scheduledStart: null,
      scheduledEnd: null,
      minutes: null,
      followUp: null,
      createdAt: now,
      updatedAt: now,
    });
    revalidatePath("/organisatie");
    return;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("meetings")
    .insert({
      title: parsed.title,
      purpose: parsed.purpose,
      location: parsed.location || null,
      requested_date: parsed.requestedDate || null,
      participant_profile_ids: parsed.participantProfileIds,
      status: "aangevraagd",
      requested_by: requestedBy,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Meeting kon niet worden aangemaakt.");
  }

  await writeAuditLog(supabase, {
    targetType: "meeting",
    targetId: data.id,
    action: "meeting_requested",
    summary: `Meetingaanvraag aangemaakt: ${parsed.title}`,
    afterState: {
      title: parsed.title,
      requestedDate: parsed.requestedDate || null,
      participantCount: parsed.participantProfileIds.length,
    },
    changedFields: ["title", "purpose", "requested_date", "participant_profile_ids", "status"],
    context: { module: "organisatie" },
  });

  revalidatePath("/organisatie");
}

export async function updateMeetingPlanningRecord(
  input: z.infer<typeof meetingPlanningSchema>,
  decidedBy: string,
) {
  const parsed = meetingPlanningSchema.parse(input);

  if (shouldUseDemoData()) {
    updateDemoMeeting(parsed.meetingId, {
      status: parsed.status,
      location: parsed.location || null,
      scheduledStart: parsed.scheduledStart || null,
      scheduledEnd: parsed.scheduledEnd || null,
      decisionNote: parsed.decisionNote || null,
      decidedBy,
      updatedAt: new Date().toISOString(),
    });
    revalidatePath("/organisatie");
    return;
  }

  const supabase = await createSupabaseServerClient();
  const { data: existing } = await supabase.from("meetings").select("*").eq("id", parsed.meetingId).single();
  const { error } = await supabase
    .from("meetings")
    .update({
      status: parsed.status,
      location: parsed.location || null,
      scheduled_start: parsed.scheduledStart || null,
      scheduled_end: parsed.scheduledEnd || null,
      decision_note: parsed.decisionNote || null,
      decided_by: decidedBy,
      decided_at: new Date().toISOString(),
    })
    .eq("id", parsed.meetingId);

  if (error) {
    throw new Error(error.message);
  }

  await writeAuditLog(supabase, {
    targetType: "meeting",
    targetId: parsed.meetingId,
    action: "meeting_planning_updated",
    summary: `Meetingplanning bijgewerkt naar status: ${parsed.status}`,
    beforeState: (existing as Record<string, unknown>) ?? null,
    afterState: {
      status: parsed.status,
      location: parsed.location || null,
      scheduledStart: parsed.scheduledStart || null,
      scheduledEnd: parsed.scheduledEnd || null,
      decisionNote: parsed.decisionNote || null,
      decidedBy,
    },
    changedFields: [
      "status",
      "location",
      "scheduled_start",
      "scheduled_end",
      "decision_note",
      "decided_by",
      "decided_at",
    ],
    context: { module: "organisatie" },
  });

  revalidatePath("/organisatie");
}

export async function updateMeetingMinutesRecord(
  input: z.infer<typeof meetingMinutesSchema>,
) {
  const parsed = meetingMinutesSchema.parse(input);

  if (shouldUseDemoData()) {
    updateDemoMeeting(parsed.meetingId, {
      minutes: parsed.minutes,
      followUp: parsed.followUp || null,
      updatedAt: new Date().toISOString(),
    });
    revalidatePath("/organisatie");
    return;
  }

  const supabase = await createSupabaseServerClient();
  const { data: existing } = await supabase.from("meetings").select("*").eq("id", parsed.meetingId).single();
  const { error } = await supabase
    .from("meetings")
    .update({
      minutes: parsed.minutes,
      follow_up: parsed.followUp || null,
    })
    .eq("id", parsed.meetingId);

  if (error) {
    throw new Error(error.message);
  }

  await writeAuditLog(supabase, {
    targetType: "meeting",
    targetId: parsed.meetingId,
    action: "meeting_minutes_updated",
    summary: "Meetingnotulen bijgewerkt",
    beforeState: (existing as Record<string, unknown>) ?? null,
    afterState: {
      minutes: parsed.minutes,
      followUp: parsed.followUp || null,
    },
    changedFields: ["minutes", "follow_up"],
    context: { module: "organisatie" },
  });

  revalidatePath("/organisatie");
}

export async function createMeetingActionItemRecord(
  input: z.infer<typeof meetingActionItemSchema>,
  createdBy: string,
) {
  const parsed = meetingActionItemSchema.parse(input);

  if (shouldUseDemoData()) {
    const now = new Date().toISOString();
    addDemoMeetingActionItem({
      id: randomUUID(),
      meetingId: parsed.meetingId,
      title: parsed.title,
      description: parsed.description || null,
      ownerProfileId: parsed.ownerProfileId || null,
      dueDate: parsed.dueDate || null,
      status: "open",
      createdBy,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    });
    revalidatePath("/organisatie");
    return;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("meeting_action_items")
    .insert({
      meeting_id: parsed.meetingId,
      title: parsed.title,
      description: parsed.description || null,
      owner_profile_id: parsed.ownerProfileId || null,
      due_date: parsed.dueDate || null,
      status: "open",
      created_by: createdBy,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Actiepunt kon niet worden opgeslagen.");
  }

  await writeAuditLog(supabase, {
    targetType: "meeting_action_item",
    targetId: data.id,
    action: "meeting_action_item_created",
    summary: `Actiepunt toegevoegd: ${parsed.title}`,
    afterState: {
      meetingId: parsed.meetingId,
      title: parsed.title,
      ownerProfileId: parsed.ownerProfileId || null,
      dueDate: parsed.dueDate || null,
    },
    changedFields: ["meeting_id", "title", "description", "owner_profile_id", "due_date", "status"],
    context: { module: "organisatie" },
  });

  revalidatePath("/organisatie");
}

export async function updateMeetingActionItemStatusRecord(
  input: z.infer<typeof meetingActionItemStatusSchema>,
) {
  const parsed = meetingActionItemStatusSchema.parse(input);

  if (shouldUseDemoData()) {
    updateDemoMeetingActionItem(parsed.actionItemId, {
      status: parsed.status,
      completedAt: parsed.status === "afgerond" ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString(),
    });
    revalidatePath("/organisatie");
    return;
  }

  const supabase = await createSupabaseServerClient();
  const { data: existing } = await supabase
    .from("meeting_action_items")
    .select("*")
    .eq("id", parsed.actionItemId)
    .single();
  const { error } = await supabase
    .from("meeting_action_items")
    .update({
      status: parsed.status,
      completed_at: parsed.status === "afgerond" ? new Date().toISOString() : null,
    })
    .eq("id", parsed.actionItemId)
    .eq("meeting_id", parsed.meetingId);

  if (error) {
    throw new Error(error.message);
  }

  await writeAuditLog(supabase, {
    targetType: "meeting_action_item",
    targetId: parsed.actionItemId,
    action: "meeting_action_item_updated",
    summary: `Actiepuntstatus bijgewerkt: ${parsed.status}`,
    beforeState: (existing as Record<string, unknown>) ?? null,
    afterState: {
      status: parsed.status,
      completedAt: parsed.status === "afgerond" ? new Date().toISOString() : null,
    },
    changedFields: ["status", "completed_at"],
    context: { module: "organisatie" },
  });

  revalidatePath("/organisatie");
}

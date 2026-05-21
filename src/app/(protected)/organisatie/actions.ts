"use server";

import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { buildFeedbackUrl } from "@/lib/feedback";
import {
  createMeetingActionItemRecord,
  createMeetingRequestRecord,
  updateMeetingActionItemStatusRecord,
  updateMeetingMinutesRecord,
  updateMeetingPlanningRecord,
} from "@/lib/organisation";

export async function createMeetingRequestAction(formData: FormData) {
  try {
    const session = await requirePermission("meetings.create");
    await createMeetingRequestRecord(
      {
        title: String(formData.get("title") ?? ""),
        purpose: String(formData.get("purpose") ?? ""),
        location: String(formData.get("location") ?? ""),
        requestedDate: String(formData.get("requestedDate") ?? ""),
        participantProfileIds: formData.getAll("participantProfileIds").map(String),
      },
      session.userId,
    );
    redirect(buildFeedbackUrl("/organisatie", "success", "Meetingaanvraag opgeslagen."));
  } catch (error) {
    redirect(buildFeedbackUrl("/organisatie", "error", error instanceof Error ? error.message : "Meetingaanvraag kon niet worden opgeslagen."));
  }
}

export async function updateMeetingPlanningAction(formData: FormData) {
  try {
    const session = await requirePermission("meetings.update");
    await updateMeetingPlanningRecord(
      {
        meetingId: String(formData.get("meetingId") ?? ""),
        status: String(formData.get("status") ?? "aangevraagd") as
          | "aangevraagd"
          | "goedgekeurd"
          | "gepland"
          | "afgerond"
          | "geannuleerd"
          | "geweigerd",
        location: String(formData.get("location") ?? ""),
        scheduledStart: String(formData.get("scheduledStart") ?? ""),
        scheduledEnd: String(formData.get("scheduledEnd") ?? ""),
        decisionNote: String(formData.get("decisionNote") ?? ""),
      },
      session.userId,
    );
    redirect(buildFeedbackUrl("/organisatie", "success", "Meetingplanning bijgewerkt."));
  } catch (error) {
    redirect(buildFeedbackUrl("/organisatie", "error", error instanceof Error ? error.message : "Meetingplanning kon niet worden bijgewerkt."));
  }
}

export async function updateMeetingMinutesAction(formData: FormData) {
  try {
    await requirePermission("minutes.update");
    await updateMeetingMinutesRecord({
      meetingId: String(formData.get("meetingId") ?? ""),
      minutes: String(formData.get("minutes") ?? ""),
      followUp: String(formData.get("followUp") ?? ""),
    });
    redirect(buildFeedbackUrl("/organisatie", "success", "Notulen bijgewerkt."));
  } catch (error) {
    redirect(buildFeedbackUrl("/organisatie", "error", error instanceof Error ? error.message : "Notulen konden niet worden bijgewerkt."));
  }
}

export async function createMeetingActionItemAction(formData: FormData) {
  try {
    const session = await requirePermission("meetings.update");
    await createMeetingActionItemRecord(
      {
        meetingId: String(formData.get("meetingId") ?? ""),
        title: String(formData.get("title") ?? ""),
        description: String(formData.get("description") ?? ""),
        ownerProfileId: String(formData.get("ownerProfileId") ?? ""),
        dueDate: String(formData.get("dueDate") ?? ""),
      },
      session.userId,
    );
    redirect(buildFeedbackUrl("/organisatie", "success", "Actiepunt toegevoegd."));
  } catch (error) {
    redirect(buildFeedbackUrl("/organisatie", "error", error instanceof Error ? error.message : "Actiepunt kon niet worden toegevoegd."));
  }
}

export async function updateMeetingActionItemStatusAction(formData: FormData) {
  try {
    await requirePermission("meetings.update");
    await updateMeetingActionItemStatusRecord({
      meetingId: String(formData.get("meetingId") ?? ""),
      actionItemId: String(formData.get("actionItemId") ?? ""),
      status: String(formData.get("status") ?? "open") as
        | "open"
        | "in_uitvoering"
        | "geblokkeerd"
        | "afgerond",
    });
    redirect(buildFeedbackUrl("/organisatie", "success", "Actiepuntstatus bijgewerkt."));
  } catch (error) {
    redirect(buildFeedbackUrl("/organisatie", "error", error instanceof Error ? error.message : "Actiepuntstatus kon niet worden bijgewerkt."));
  }
}

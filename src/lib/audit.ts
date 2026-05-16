import type { createClient as createSupabaseServerClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

type AuditPayload = {
  targetType: string;
  targetId?: string | null;
  patientId?: string | null;
  action: string;
  summary: string;
  beforeState?: Record<string, unknown> | null;
  afterState?: Record<string, unknown> | null;
  changedFields?: string[];
  context?: Record<string, unknown> | null;
};

export async function writeAuditLog(
  supabase: SupabaseServerClient,
  payload: AuditPayload,
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("audit_logs").insert({
    actor_profile_id: user?.id ?? null,
    target_type: payload.targetType,
    target_id: payload.targetId ?? null,
    action: payload.action,
    summary: payload.summary,
    before_state: payload.beforeState ?? null,
    after_state: payload.afterState ?? null,
    changed_fields: payload.changedFields ?? [],
    context: {
      ...(payload.context ?? {}),
      ...(payload.patientId ? { patient_id: payload.patientId } : {}),
    },
  });

  if (error) {
    console.error("Auditlog insert mislukt:", error.message);
  }
}

import { createHmac, randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseEnv, shouldUseDemoData } from "@/lib/env";
import { writeAuditLog } from "@/lib/audit";
import { createAdminClient } from "@/lib/supabase/admin";

export type IntegrationEndpoint = {
  id: string;
  code: string;
  label: string;
  targetUrl: string;
  signingSecret: string;
  isActive: boolean;
  retryLimit: number;
  timeoutMs: number;
  lastStatus: "idle" | "success" | "failed";
  lastError: string | null;
  lastDeliveryAt: string | null;
  lastSuccessAt: string | null;
};

export type IntegrationDelivery = {
  id: string;
  endpointId: string;
  endpointCode: string;
  eventType: string;
  idempotencyKey: string;
  status: "pending" | "success" | "failed";
  attempt: number;
  httpStatus: number | null;
  errorMessage: string | null;
  pushedAt: string;
  processedAt: string | null;
};

export type AutomationJobState = {
  id: string;
  jobCode: string;
  label: string;
  scheduleKind: string;
  isActive: boolean;
  lastRunAt: string | null;
  lastStatus: "idle" | "success" | "failed";
  lastError: string | null;
};

export type AutomationRun = {
  id: string;
  jobCode: string;
  status: "running" | "success" | "failed";
  triggeredBy: string | null;
  startedAt: string;
  finishedAt: string | null;
  errorMessage: string | null;
};

function signPayload(secret: string, payload: string) {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

function toEndpoint(row: {
  id: string;
  code: string;
  label: string;
  target_url: string;
  signing_secret: string;
  is_active: boolean;
  retry_limit: number;
  timeout_ms: number;
  last_status: string | null;
  last_error: string | null;
  last_delivery_at: string | null;
  last_success_at: string | null;
}): IntegrationEndpoint {
  return {
    id: row.id,
    code: row.code,
    label: row.label,
    targetUrl: row.target_url,
    signingSecret: row.signing_secret,
    isActive: row.is_active,
    retryLimit: row.retry_limit,
    timeoutMs: row.timeout_ms,
    lastStatus: (row.last_status ?? "idle") as IntegrationEndpoint["lastStatus"],
    lastError: row.last_error,
    lastDeliveryAt: row.last_delivery_at,
    lastSuccessAt: row.last_success_at,
  };
}

async function getActiveEndpointsWithClient(supabase: SupabaseClient): Promise<IntegrationEndpoint[]> {
  const { data, error } = await supabase
    .from("integration_endpoints")
    .select("id, code, label, target_url, signing_secret, is_active, retry_limit, timeout_ms, last_status, last_error, last_delivery_at, last_success_at")
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []).map(toEndpoint).filter((endpoint: IntegrationEndpoint) => endpoint.isActive);
}

export async function getIntegrationEndpoints(): Promise<IntegrationEndpoint[]> {
  if (shouldUseDemoData() || !hasSupabaseEnv()) return [];
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("integration_endpoints")
    .select("id, code, label, target_url, signing_secret, is_active, retry_limit, timeout_ms, last_status, last_error, last_delivery_at, last_success_at")
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []).map(toEndpoint);
}

export async function getRecentIntegrationDeliveries(limit = 100): Promise<IntegrationDelivery[]> {
  if (shouldUseDemoData() || !hasSupabaseEnv()) return [];
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("integration_webhook_deliveries")
    .select("id, endpoint_id, endpoint_code, event_type, idempotency_key, status, attempt, http_status, error_message, pushed_at, processed_at")
    .order("pushed_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? []).map((row) => ({
    id: row.id,
    endpointId: row.endpoint_id,
    endpointCode: row.endpoint_code,
    eventType: row.event_type,
    idempotencyKey: row.idempotency_key,
    status: row.status,
    attempt: row.attempt,
    httpStatus: row.http_status,
    errorMessage: row.error_message,
    pushedAt: row.pushed_at,
    processedAt: row.processed_at,
  }));
}

export async function getAutomationJobs(): Promise<AutomationJobState[]> {
  if (shouldUseDemoData() || !hasSupabaseEnv()) return [];
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("automation_jobs")
    .select("id, job_code, label, schedule_kind, is_active, last_run_at, last_status, last_error")
    .order("job_code", { ascending: true });
  if (error) return [];
  return (data ?? []).map((row) => ({
    id: row.id,
    jobCode: row.job_code,
    label: row.label,
    scheduleKind: row.schedule_kind,
    isActive: row.is_active,
    lastRunAt: row.last_run_at,
    lastStatus: (row.last_status ?? "idle") as AutomationJobState["lastStatus"],
    lastError: row.last_error,
  }));
}

export async function getRecentAutomationRuns(limit = 100): Promise<AutomationRun[]> {
  if (shouldUseDemoData() || !hasSupabaseEnv()) return [];
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("automation_runs")
    .select("id, job_code, status, triggered_by, started_at, finished_at, error_message")
    .order("started_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? []).map((row) => ({
    id: row.id,
    jobCode: row.job_code,
    status: row.status,
    triggeredBy: row.triggered_by,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    errorMessage: row.error_message,
  }));
}

async function runSingleDelivery(params: {
  supabaseClient: Awaited<ReturnType<typeof createSupabaseServerClient>> | ReturnType<typeof createAdminClient>;
  endpoint: IntegrationEndpoint;
  eventType: string;
  idempotencyKey: string;
  payload: Record<string, unknown>;
}) {
  const supabase = params.supabaseClient;
  const payloadString = JSON.stringify(params.payload);
  const signature = signPayload(params.endpoint.signingSecret, payloadString);

  const existing = await supabase
    .from("integration_webhook_deliveries")
    .select("id, status")
    .eq("endpoint_id", params.endpoint.id)
    .eq("idempotency_key", params.idempotencyKey)
    .maybeSingle();
  if (existing.data?.status === "success") {
    return { delivered: true, skipped: true };
  }

  let finalStatus: "success" | "failed" = "failed";
  let finalHttpStatus: number | null = null;
  let finalError: string | null = null;
  let attemptCount = 0;

  for (let attempt = 1; attempt <= Math.max(params.endpoint.retryLimit, 1); attempt += 1) {
    attemptCount = attempt;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), params.endpoint.timeoutMs);
    try {
      const response = await fetch(params.endpoint.targetUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-EMS-Event-Type": params.eventType,
          "X-EMS-Idempotency-Key": params.idempotencyKey,
          "X-EMS-Signature": signature,
        },
        body: payloadString,
        signal: controller.signal,
      });
      clearTimeout(timer);
      finalHttpStatus = response.status;
      if (response.ok) {
        finalStatus = "success";
        finalError = null;
        break;
      }
      finalError = `HTTP ${response.status}`;
    } catch (error) {
      clearTimeout(timer);
      finalError = error instanceof Error ? error.message : "Onbekende fetch-fout";
    }
  }

  await supabase.from("integration_webhook_deliveries").insert({
    id: randomUUID(),
    endpoint_id: params.endpoint.id,
    endpoint_code: params.endpoint.code,
    event_type: params.eventType,
    idempotency_key: params.idempotencyKey,
    payload: params.payload,
    status: finalStatus,
    attempt: attemptCount,
    http_status: finalHttpStatus,
    error_message: finalError,
    pushed_at: new Date().toISOString(),
    processed_at: new Date().toISOString(),
  });

  await supabase
    .from("integration_endpoints")
    .update({
      last_status: finalStatus,
      last_error: finalError,
      last_delivery_at: new Date().toISOString(),
      last_success_at: finalStatus === "success" ? new Date().toISOString() : null,
    })
    .eq("id", params.endpoint.id);

  return { delivered: finalStatus === "success", skipped: false, error: finalError };
}

export async function dispatchIntegrationEvent(params: {
  eventType: string;
  payload: Record<string, unknown>;
  idempotencyKey?: string;
}) {
  if (shouldUseDemoData() || !hasSupabaseEnv()) return { total: 0, success: 0, failed: 0 };
  const supabase = await createSupabaseServerClient();
  const activeEndpoints = await getActiveEndpointsWithClient(supabase);
  const key = params.idempotencyKey ?? randomUUID();

  let success = 0;
  let failed = 0;
  for (const endpoint of activeEndpoints) {
    const result = await runSingleDelivery({
      supabaseClient: supabase,
      endpoint,
      eventType: params.eventType,
      idempotencyKey: `${key}:${endpoint.code}`,
      payload: params.payload,
    });
    if (result.delivered) success += 1;
    if (!result.delivered && !result.skipped) failed += 1;
  }

  await writeAuditLog(supabase, {
    targetType: "integration_dispatch",
    targetId: key,
    action: "integration_event_dispatched",
    summary: `Integratie-event verzonden: ${params.eventType}`,
    afterState: {
      eventType: params.eventType,
      key,
      totalEndpoints: activeEndpoints.length,
      success,
      failed,
    },
    changedFields: ["event_type", "endpoint_count", "success", "failed"],
    context: { automation: "webhook_dispatch" },
  });

  return { total: activeEndpoints.length, success, failed, idempotencyKey: key };
}

export async function runAutomationJob(params: {
  jobCode: "daily_kpi_digest" | "open_cases_reminder";
  triggeredBy: string;
}) {
  if (shouldUseDemoData() || !hasSupabaseEnv()) {
    return { ok: true, jobCode: params.jobCode, message: "Demo/no-supabase mode" };
  }

  const useSystemMode = params.triggeredBy.startsWith("system:");
  const supabase = useSystemMode ? createAdminClient() : await createSupabaseServerClient();
  const { data: job } = await supabase
    .from("automation_jobs")
    .select("id, job_code, is_active")
    .eq("job_code", params.jobCode)
    .maybeSingle();

  if (!job || !job.is_active) {
    return { ok: false, jobCode: params.jobCode, message: "Job niet actief of ontbreekt." };
  }

  const runId = randomUUID();
  await supabase.from("automation_runs").insert({
    id: runId,
    job_id: job.id,
    job_code: job.job_code,
    triggered_by: params.triggeredBy,
    status: "running",
    started_at: new Date().toISOString(),
  });

  try {
    if (params.jobCode === "daily_kpi_digest") {
      const [{ count: reports24h }, { count: audits24h }] = await Promise.all([
        supabase
          .from("medical_reports")
          .select("*", { count: "exact", head: true })
          .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
        supabase
          .from("audit_logs")
          .select("*", { count: "exact", head: true })
          .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      ]);
      const activeEndpoints = await getActiveEndpointsWithClient(supabase);
      const key = `daily-kpi:${new Date().toISOString().slice(0, 10)}`;
      for (const endpoint of activeEndpoints) {
        await runSingleDelivery({
          supabaseClient: supabase,
          endpoint,
          eventType: "automation.daily_kpi_digest",
          idempotencyKey: `${key}:${endpoint.code}`,
          payload: { reports24h: reports24h ?? 0, audits24h: audits24h ?? 0, generatedAt: new Date().toISOString() },
        });
      }
    }

    if (params.jobCode === "open_cases_reminder") {
      const { count: openCases } = await supabase
        .from("patient_cases")
        .select("*", { count: "exact", head: true })
        .eq("status", "open");
      const activeEndpoints = await getActiveEndpointsWithClient(supabase);
      const key = `open-cases:${new Date().toISOString().slice(0, 10)}`;
      for (const endpoint of activeEndpoints) {
        await runSingleDelivery({
          supabaseClient: supabase,
          endpoint,
          eventType: "automation.open_cases_reminder",
          idempotencyKey: `${key}:${endpoint.code}`,
          payload: { openCases: openCases ?? 0, generatedAt: new Date().toISOString() },
        });
      }
    }

    await supabase
      .from("automation_runs")
      .update({
        status: "success",
        finished_at: new Date().toISOString(),
      })
      .eq("id", runId);

    await supabase
      .from("automation_jobs")
      .update({
        last_status: "success",
        last_error: null,
        last_run_at: new Date().toISOString(),
      })
      .eq("id", job.id);

    return { ok: true, jobCode: params.jobCode, runId };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Onbekende automation-fout";
    await supabase
      .from("automation_runs")
      .update({
        status: "failed",
        error_message: message,
        finished_at: new Date().toISOString(),
      })
      .eq("id", runId);
    await supabase
      .from("automation_jobs")
      .update({
        last_status: "failed",
        last_error: message,
        last_run_at: new Date().toISOString(),
      })
      .eq("id", job.id);
    return { ok: false, jobCode: params.jobCode, runId, message };
  }
}

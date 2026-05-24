"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import { buildFeedbackUrl } from "@/lib/feedback";
import { dispatchIntegrationEvent, runAutomationJob } from "@/lib/integrations";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/audit";
import { getTenantContext } from "@/lib/tenant";

const endpointSchema = z.object({
  code: z.string().trim().min(2),
  label: z.string().trim().min(2),
  targetUrl: z.string().trim().url(),
  signingSecret: z.string().trim().min(8),
  retryLimit: z.coerce.number().int().min(1).max(5).default(3),
  timeoutMs: z.coerce.number().int().min(1000).max(30000).default(7000),
  isActive: z.boolean().default(true),
});

const endpointUpdateSchema = endpointSchema.extend({
  id: z.string().trim().min(1),
});

function checkbox(value: FormDataEntryValue | null) {
  return value === "on" || value === "true" || value === "1";
}

export async function createIntegrationEndpointAction(formData: FormData) {
  try {
    const session = await requirePermission("config.database.read");
    const parsed = endpointSchema.parse({
      code: String(formData.get("code") ?? ""),
      label: String(formData.get("label") ?? ""),
      targetUrl: String(formData.get("targetUrl") ?? ""),
      signingSecret: String(formData.get("signingSecret") ?? ""),
      retryLimit: Number(formData.get("retryLimit") ?? 3),
      timeoutMs: Number(formData.get("timeoutMs") ?? 7000),
      isActive: checkbox(formData.get("isActive")),
    });
    const supabase = await createSupabaseServerClient();
    const tenant = await getTenantContext();
    const { data, error } = await supabase
      .from("integration_endpoints")
      .insert({
        tenant_id: tenant.tenantId,
        code: parsed.code,
        label: parsed.label,
        target_url: parsed.targetUrl,
        signing_secret: parsed.signingSecret,
        retry_limit: parsed.retryLimit,
        timeout_ms: parsed.timeoutMs,
        is_active: parsed.isActive,
        created_by: session.userId,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    await writeAuditLog(supabase, {
      targetType: "integration_endpoint",
      targetId: data?.id ?? null,
      action: "integration_endpoint_created",
      summary: `Integratie endpoint aangemaakt: ${parsed.label}`,
      afterState: parsed,
      changedFields: ["code", "label", "target_url", "retry_limit", "timeout_ms", "is_active"],
      context: { admin_area: "integrations", updated_by: session.userId },
    });

    redirect(buildFeedbackUrl("/beheer/integraties", "success", "Integratie endpoint aangemaakt."));
  } catch (error) {
    redirect(buildFeedbackUrl("/beheer/integraties", "error", error instanceof Error ? error.message : "Kon endpoint niet aanmaken."));
  }
}

export async function updateIntegrationEndpointAction(formData: FormData) {
  try {
    const session = await requirePermission("config.database.read");
    const parsed = endpointUpdateSchema.parse({
      id: String(formData.get("id") ?? ""),
      code: String(formData.get("code") ?? ""),
      label: String(formData.get("label") ?? ""),
      targetUrl: String(formData.get("targetUrl") ?? ""),
      signingSecret: String(formData.get("signingSecret") ?? ""),
      retryLimit: Number(formData.get("retryLimit") ?? 3),
      timeoutMs: Number(formData.get("timeoutMs") ?? 7000),
      isActive: checkbox(formData.get("isActive")),
    });
    const supabase = await createSupabaseServerClient();
    const tenant = await getTenantContext();
    const scopedBefore = tenant.tenantId
      ? supabase.from("integration_endpoints").select("*").eq("id", parsed.id).eq("tenant_id", tenant.tenantId)
      : supabase.from("integration_endpoints").select("*").eq("id", parsed.id);
    const { data: before } = await scopedBefore.single();
    let updateQuery = supabase
      .from("integration_endpoints")
      .update({
        code: parsed.code,
        label: parsed.label,
        target_url: parsed.targetUrl,
        signing_secret: parsed.signingSecret,
        retry_limit: parsed.retryLimit,
        timeout_ms: parsed.timeoutMs,
        is_active: parsed.isActive,
      })
      .eq("id", parsed.id);
    if (tenant.tenantId) updateQuery = updateQuery.eq("tenant_id", tenant.tenantId);
    const { error } = await updateQuery;
    if (error) throw new Error(error.message);

    await writeAuditLog(supabase, {
      targetType: "integration_endpoint",
      targetId: parsed.id,
      action: "integration_endpoint_updated",
      summary: `Integratie endpoint bijgewerkt: ${parsed.label}`,
      beforeState: before ?? null,
      afterState: parsed,
      changedFields: ["code", "label", "target_url", "signing_secret", "retry_limit", "timeout_ms", "is_active"],
      context: { admin_area: "integrations", updated_by: session.userId },
    });

    redirect(buildFeedbackUrl("/beheer/integraties", "success", "Integratie endpoint bijgewerkt."));
  } catch (error) {
    redirect(buildFeedbackUrl("/beheer/integraties", "error", error instanceof Error ? error.message : "Kon endpoint niet bijwerken."));
  }
}

export async function testIntegrationDispatchAction(formData: FormData) {
  try {
    await requirePermission("config.database.read");
    const eventType = String(formData.get("eventType") ?? "manual.test");
    const payload = {
      source: "beheer",
      at: new Date().toISOString(),
      note: "Handmatige testdispatch",
    };
    const result = await dispatchIntegrationEvent({
      eventType,
      payload,
      idempotencyKey: `manual-test:${randomUUID()}`,
    });
    redirect(
      buildFeedbackUrl(
        "/beheer/integraties",
        "success",
        `Dispatch klaar. totaal=${result.total}, success=${result.success}, failed=${result.failed}`,
      ),
    );
  } catch (error) {
    redirect(buildFeedbackUrl("/beheer/integraties", "error", error instanceof Error ? error.message : "Dispatch mislukt."));
  }
}

export async function runAutomationJobAction(formData: FormData) {
  try {
    const session = await requirePermission("config.database.read");
    const jobCodeRaw = String(formData.get("jobCode") ?? "");
    const jobCode = z.enum(["daily_kpi_digest", "open_cases_reminder"]).parse(jobCodeRaw);
    const result = await runAutomationJob({ jobCode, triggeredBy: session.userId });
    if (!result.ok) throw new Error(result.message ?? "Automation job mislukt.");
    redirect(buildFeedbackUrl("/beheer/integraties", "success", `Automation job uitgevoerd: ${jobCode}`));
  } catch (error) {
    redirect(buildFeedbackUrl("/beheer/integraties", "error", error instanceof Error ? error.message : "Automation job mislukt."));
  }
}

import { NextResponse } from "next/server";
import { getInfrastructureHealth } from "@/lib/admin";

export async function GET() {
  const health = await getInfrastructureHealth();
  const ok = health.supabaseConfigured && health.databaseHealthy;

  return NextResponse.json(
    {
      status: ok ? "ok" : "degraded",
      runtime: health.runtimeLabel,
      environment: health.vercelEnv,
      dataMode: health.dataModeLabel,
      checks: {
        supabaseConfigured: health.supabaseConfigured,
        databaseHealthy: health.databaseHealthy,
        serviceRoleConfigured: health.serviceRoleConfigured,
      },
      counters: {
        patients: health.patientCount,
        reports: health.reportCount,
        profiles: health.profileCount,
        auditLogs: health.auditLogCount,
      },
      message: health.databaseMessage,
      timestamp: new Date().toISOString(),
      commit: health.gitCommitSha,
    },
    { status: ok ? 200 : 503 },
  );
}

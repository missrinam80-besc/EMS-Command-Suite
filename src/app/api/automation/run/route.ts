import { NextRequest, NextResponse } from "next/server";
import { getAppSession, hasPermission } from "@/lib/auth";
import { runAutomationJob } from "@/lib/integrations";

function isValidCronToken(request: NextRequest) {
  const configured = process.env.AUTOMATION_CRON_TOKEN;
  if (!configured) return false;
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  return token.length > 0 && token === configured;
}

export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => null)) as { jobCode?: string } | null;
  const jobCode = payload?.jobCode;
  if (jobCode !== "daily_kpi_digest" && jobCode !== "open_cases_reminder") {
    return NextResponse.json({ error: "Ongeldige jobCode." }, { status: 400 });
  }

  const session = await getAppSession();
  const viaCronToken = isValidCronToken(request);
  const canRunAsUser = Boolean(session && hasPermission(session, "config.database.read"));
  if (!canRunAsUser && !viaCronToken) {
    return NextResponse.json({ error: "Geen toegang." }, { status: 403 });
  }

  const result = await runAutomationJob({
    jobCode,
    triggeredBy: session?.userId ?? "system:cron",
  });
  if (!result.ok) {
    return NextResponse.json({ ok: false, message: result.message ?? "Job mislukt." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, runId: result.runId, jobCode });
}

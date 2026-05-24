import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseEnv, shouldUseDemoData } from "@/lib/env";

type TrendPoint = {
  date: string;
  count: number;
};

export type IntelligenceSnapshot = {
  rangeFrom: string;
  rangeTo: string;
  kpis: {
    patientsTotal: number;
    reportsTotal: number;
    casesOpen: number;
    staffActive: number;
    meetingsUpcoming: number;
    auditLast24h: number;
  };
  trends: {
    reportsByDay: TrendPoint[];
    auditsByDay: TrendPoint[];
  };
  dataQuality: {
    reportsMissingSummary: number;
    patientsMissingCitizenId: number;
    profilesMissingRank: number;
  };
  alerts: Array<{
    code: string;
    severity: "info" | "warning" | "critical";
    message: string;
  }>;
};

function toIsoDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function buildDateRange(days: number) {
  const to = new Date();
  const from = new Date(to);
  from.setDate(to.getDate() - days + 1);
  return { from: toIsoDate(from), to: toIsoDate(to) };
}

function createEmptyTrend(fromIso: string, toIso: string): TrendPoint[] {
  const points: TrendPoint[] = [];
  const cursor = new Date(`${fromIso}T00:00:00.000Z`);
  const end = new Date(`${toIso}T00:00:00.000Z`);
  while (cursor <= end) {
    points.push({ date: toIsoDate(cursor), count: 0 });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return points;
}

function bucketByDate(
  rows: Array<{ created_at?: string | null }>,
  fromIso: string,
  toIso: string,
): TrendPoint[] {
  const points = createEmptyTrend(fromIso, toIso);
  const index = new Map(points.map((point) => [point.date, point]));
  for (const row of rows) {
    if (!row.created_at) continue;
    const date = row.created_at.slice(0, 10);
    const target = index.get(date);
    if (target) target.count += 1;
  }
  return points;
}

export async function getIntelligenceSnapshot(days = 30): Promise<IntelligenceSnapshot> {
  const { from, to } = buildDateRange(days);
  if (shouldUseDemoData() || !hasSupabaseEnv()) {
    return {
      rangeFrom: from,
      rangeTo: to,
      kpis: {
        patientsTotal: 0,
        reportsTotal: 0,
        casesOpen: 0,
        staffActive: 0,
        meetingsUpcoming: 0,
        auditLast24h: 0,
      },
      trends: { reportsByDay: createEmptyTrend(from, to), auditsByDay: createEmptyTrend(from, to) },
      dataQuality: {
        reportsMissingSummary: 0,
        patientsMissingCitizenId: 0,
        profilesMissingRank: 0,
      },
      alerts: [{ code: "demo_mode", severity: "info", message: "Demo/geen Supabase: intelligence gebruikt lege dataset." }],
    };
  }

  const supabase = await createSupabaseServerClient();
  const fromTs = `${from}T00:00:00.000Z`;
  const toTs = `${to}T23:59:59.999Z`;
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: patientsTotal },
    { count: reportsTotal },
    { count: casesOpen },
    { count: staffActive },
    { count: meetingsUpcoming },
    { count: auditLast24h },
    { data: reportRows },
    { data: auditRows },
    { count: reportsMissingSummary },
    { count: patientsMissingCitizenId },
    { count: profilesMissingRank },
  ] = await Promise.all([
    supabase.from("patients").select("*", { count: "exact", head: true }).eq("is_deleted", false),
    supabase.from("medical_reports").select("*", { count: "exact", head: true }),
    supabase.from("patient_cases").select("*", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("employment_status", "actief"),
    supabase.from("meetings").select("*", { count: "exact", head: true }).gte("scheduled_for", now.toISOString()),
    supabase.from("audit_logs").select("*", { count: "exact", head: true }).gte("created_at", dayAgo),
    supabase
      .from("medical_reports")
      .select("created_at")
      .gte("created_at", fromTs)
      .lte("created_at", toTs)
      .limit(10000),
    supabase
      .from("audit_logs")
      .select("created_at")
      .gte("created_at", fromTs)
      .lte("created_at", toTs)
      .limit(10000),
    supabase
      .from("medical_reports")
      .select("*", { count: "exact", head: true })
      .or("summary.is.null,summary.eq."),
    supabase
      .from("patients")
      .select("*", { count: "exact", head: true })
      .or("citizenid.is.null,citizenid.eq.")
      .eq("is_deleted", false),
    supabase.from("profiles").select("*", { count: "exact", head: true }).is("rank_id", null),
  ]);

  const snapshot: IntelligenceSnapshot = {
    rangeFrom: from,
    rangeTo: to,
    kpis: {
      patientsTotal: patientsTotal ?? 0,
      reportsTotal: reportsTotal ?? 0,
      casesOpen: casesOpen ?? 0,
      staffActive: staffActive ?? 0,
      meetingsUpcoming: meetingsUpcoming ?? 0,
      auditLast24h: auditLast24h ?? 0,
    },
    trends: {
      reportsByDay: bucketByDate(reportRows ?? [], from, to),
      auditsByDay: bucketByDate(auditRows ?? [], from, to),
    },
    dataQuality: {
      reportsMissingSummary: reportsMissingSummary ?? 0,
      patientsMissingCitizenId: patientsMissingCitizenId ?? 0,
      profilesMissingRank: profilesMissingRank ?? 0,
    },
    alerts: [],
  };

  if (snapshot.dataQuality.reportsMissingSummary > 10) {
    snapshot.alerts.push({
      code: "dq_reports_summary",
      severity: "warning",
      message: `${snapshot.dataQuality.reportsMissingSummary} rapporten zonder samenvatting.`,
    });
  }
  if (snapshot.dataQuality.patientsMissingCitizenId > 0) {
    snapshot.alerts.push({
      code: "dq_patients_citizenid",
      severity: "critical",
      message: `${snapshot.dataQuality.patientsMissingCitizenId} actieve patienten zonder citizenid.`,
    });
  }
  if (snapshot.kpis.auditLast24h === 0) {
    snapshot.alerts.push({
      code: "audit_silence",
      severity: "warning",
      message: "Geen audit-events in de laatste 24 uur.",
    });
  }
  if (snapshot.alerts.length === 0) {
    snapshot.alerts.push({
      code: "all_clear",
      severity: "info",
      message: "Geen kritieke intelligence alerts.",
    });
  }

  return snapshot;
}

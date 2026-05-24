import { NextRequest, NextResponse } from "next/server";
import { getAppSession, hasAnyPermission } from "@/lib/auth";
import { toCsv } from "@/lib/export-csv";
import { getIntelligenceSnapshot } from "@/lib/intelligence";

function parseDays(from?: string | null, to?: string | null) {
  if (!from || !to) return 30;
  const fromDate = new Date(`${from}T00:00:00.000Z`);
  const toDate = new Date(`${to}T00:00:00.000Z`);
  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime()) || toDate < fromDate) {
    return 30;
  }
  const diffMs = toDate.getTime() - fromDate.getTime();
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000)) + 1;
  return Math.min(Math.max(diffDays, 1), 90);
}

export async function GET(request: NextRequest) {
  const session = await getAppSession();
  if (!session) {
    return NextResponse.json({ error: "Niet aangemeld." }, { status: 401 });
  }

  if (!hasAnyPermission(session, ["config.panel.read", "audit.read"])) {
    return NextResponse.json({ error: "Geen toegang tot KPI export." }, { status: 403 });
  }

  const from = request.nextUrl.searchParams.get("from");
  const to = request.nextUrl.searchParams.get("to");
  const days = parseDays(from, to);
  const snapshot = await getIntelligenceSnapshot(days);

  const rows = [
    {
      range_from: snapshot.rangeFrom,
      range_to: snapshot.rangeTo,
      patients_total: snapshot.kpis.patientsTotal,
      reports_total: snapshot.kpis.reportsTotal,
      cases_open: snapshot.kpis.casesOpen,
      staff_active: snapshot.kpis.staffActive,
      meetings_upcoming: snapshot.kpis.meetingsUpcoming,
      audit_last_24h: snapshot.kpis.auditLast24h,
      reports_missing_summary: snapshot.dataQuality.reportsMissingSummary,
      patients_missing_citizenid: snapshot.dataQuality.patientsMissingCitizenId,
      profiles_missing_rank: snapshot.dataQuality.profilesMissingRank,
      alert_count: snapshot.alerts.length,
      alert_codes: snapshot.alerts.map((item) => item.code).join("|"),
    },
  ];

  const csv = toCsv(rows, [
    "range_from",
    "range_to",
    "patients_total",
    "reports_total",
    "cases_open",
    "staff_active",
    "meetings_upcoming",
    "audit_last_24h",
    "reports_missing_summary",
    "patients_missing_citizenid",
    "profiles_missing_rank",
    "alert_count",
    "alert_codes",
  ]);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="kpi-snapshot-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

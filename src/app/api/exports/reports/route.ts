import { NextRequest, NextResponse } from "next/server";
import { getAppSession, hasPermission } from "@/lib/auth";
import { toCsv } from "@/lib/export-csv";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const session = await getAppSession();
  if (!session) {
    return NextResponse.json({ error: "Niet aangemeld." }, { status: 401 });
  }

  if (!hasPermission(session, "reports.read")) {
    return NextResponse.json({ error: "Geen toegang tot rapport export." }, { status: 403 });
  }

  const supabase = await createSupabaseServerClient();
  const from = request.nextUrl.searchParams.get("from");
  const to = request.nextUrl.searchParams.get("to");
  let query = supabase
    .from("medical_reports")
    .select("id, patient_id, case_id, report_type_code, title, summary, author_profile_id, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(5000);
  if (from) query = query.gte("created_at", `${from}T00:00:00.000Z`);
  if (to) query = query.lte("created_at", `${to}T23:59:59.999Z`);
  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []).map((item) => ({
    id: item.id,
    patient_id: item.patient_id,
    case_id: item.case_id ?? "",
    report_type_code: item.report_type_code,
    title: item.title,
    summary: item.summary ?? "",
    author_profile_id: item.author_profile_id ?? "",
    created_at: item.created_at,
    updated_at: item.updated_at ?? "",
  }));

  const csv = toCsv(rows, [
    "id",
    "patient_id",
    "case_id",
    "report_type_code",
    "title",
    "summary",
    "author_profile_id",
    "created_at",
    "updated_at",
  ]);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="medical-reports-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

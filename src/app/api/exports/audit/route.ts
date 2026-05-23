import { NextResponse } from "next/server";
import { getAppSession, hasPermission } from "@/lib/auth";
import { toCsv } from "@/lib/export-csv";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const session = await getAppSession();
  if (!session) {
    return NextResponse.json({ error: "Niet aangemeld." }, { status: 401 });
  }

  if (!hasPermission(session, "audit.read")) {
    return NextResponse.json({ error: "Geen toegang tot audit export." }, { status: 403 });
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("audit_logs")
    .select("id, action, summary, target_type, target_id, actor_profile_id, created_at")
    .order("created_at", { ascending: false })
    .limit(5000);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []).map((item) => ({
    id: item.id,
    action: item.action,
    summary: item.summary,
    target_type: item.target_type,
    target_id: item.target_id ?? "",
    actor_profile_id: item.actor_profile_id ?? "",
    created_at: item.created_at,
  }));

  const csv = toCsv(rows, [
    "id",
    "action",
    "summary",
    "target_type",
    "target_id",
    "actor_profile_id",
    "created_at",
  ]);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="audit-logs-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

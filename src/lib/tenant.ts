import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseEnv, shouldUseDemoData } from "@/lib/env";
import { getAppSession, hasPermission } from "@/lib/auth";

export type TenantContext = {
  tenantId: string | null;
  tenantCode: string;
  tenantLabel: string;
};

function configuredTenantCode() {
  return (process.env.NEXT_PUBLIC_DEFAULT_TENANT_CODE ?? "default").trim() || "default";
}

export async function getTenantContext(options?: {
  forceSessionTenant?: boolean;
}): Promise<TenantContext> {
  const code = configuredTenantCode();
  if (shouldUseDemoData() || !hasSupabaseEnv()) {
    return { tenantId: null, tenantCode: code, tenantLabel: "Demo tenant" };
  }

  const session = await getAppSession();
  const supabase = await createSupabaseServerClient();
  if (session) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id, tenants(code, label)")
      .eq("id", session.userId)
      .maybeSingle();

    const tenantRelation = profile?.tenants as
      | { code?: string; label?: string }
      | { code?: string; label?: string }[]
      | null
      | undefined;
    const tenantRecord = Array.isArray(tenantRelation) ? tenantRelation[0] : tenantRelation;
    if (profile?.tenant_id && tenantRecord?.code && tenantRecord?.label) {
      const globalConfigAdmin = hasPermission(session, "config.database.read");
      if (globalConfigAdmin && !options?.forceSessionTenant) {
        return { tenantId: null, tenantCode: "all", tenantLabel: "Alle tenants" };
      }
      return {
        tenantId: profile.tenant_id,
        tenantCode: tenantRecord.code,
        tenantLabel: tenantRecord.label,
      };
    }
  }

  const { data } = await supabase
    .from("tenants")
    .select("id, code, label")
    .eq("code", code)
    .maybeSingle();

  if (!data) {
    return { tenantId: null, tenantCode: code, tenantLabel: code };
  }

  return {
    tenantId: data.id,
    tenantCode: data.code,
    tenantLabel: data.label,
  };
}

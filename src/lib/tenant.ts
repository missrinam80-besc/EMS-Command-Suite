import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseEnv, shouldUseDemoData } from "@/lib/env";

export type TenantContext = {
  tenantId: string | null;
  tenantCode: string;
  tenantLabel: string;
};

function configuredTenantCode() {
  return (process.env.NEXT_PUBLIC_DEFAULT_TENANT_CODE ?? "default").trim() || "default";
}

export async function getTenantContext(): Promise<TenantContext> {
  const code = configuredTenantCode();
  if (shouldUseDemoData() || !hasSupabaseEnv()) {
    return { tenantId: null, tenantCode: code, tenantLabel: "Demo tenant" };
  }

  const supabase = await createSupabaseServerClient();
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

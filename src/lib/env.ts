export function hasSupabaseEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function isHostedRuntime() {
  return process.env.VERCEL === "1" || Boolean(process.env.VERCEL_URL);
}

export function shouldUseDemoData() {
  return (
    process.env.NODE_ENV !== "production" &&
    !isHostedRuntime() &&
    process.env.NEXT_PUBLIC_ENABLE_DEMO_AUTH === "true"
  );
}

export function isDemoAuthEnabled() {
  return shouldUseDemoData();
}

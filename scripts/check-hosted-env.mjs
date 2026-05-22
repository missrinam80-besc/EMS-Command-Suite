const isHostedBuild =
  process.env.VERCEL === "1" ||
  Boolean(process.env.VERCEL_ENV) ||
  process.env.CI === "true";

if (!isHostedBuild) {
  process.exit(0);
}

const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
];

const missing = required.filter((name) => !process.env[name]?.trim());

if (missing.length) {
  console.error("\n[env-guard] Deployment aborted.");
  console.error("[env-guard] Missing required environment variables:");
  for (const name of missing) {
    console.error(`- ${name}`);
  }
  console.error(
    "[env-guard] Add them in Vercel Project Settings -> Environment Variables for Production/Preview/Development and redeploy.\n",
  );
  process.exit(1);
}

const normalizedUrl = process.env.NEXT_PUBLIC_SUPABASE_URL.trim()
  .replace(/\/rest\/v1\/?$/i, "")
  .replace(/\/+$/, "");

if (normalizedUrl !== process.env.NEXT_PUBLIC_SUPABASE_URL.trim()) {
  console.warn(
    "[env-guard] Warning: NEXT_PUBLIC_SUPABASE_URL contains '/rest/v1' or trailing slashes. Use base URL only (https://<project>.supabase.co).",
  );
}

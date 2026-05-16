import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;

  const content = readFileSync(filePath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    if (key && !process.env[key]) {
      process.env[key] = value;
    }
  }
}

function usage() {
  console.log(`
Gebruik:
  npm run create:admin-user -- <email> <password> <full_name> <citizenid> [profile_type] [rank_code]

Voorbeeld:
  npm run create:admin-user -- admin@vespucci.local SterkWachtwoord123 "Linda Admin" EMS-001 medical_staff rank_1

profile_type:
  medical_staff | administratie | directie_assistent

rank_code:
  rank_1 | rank_2 | rank_3 | rank_4 | rank_5 | rank_6
`);
}

async function sleep(ms) {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}

async function main() {
  loadEnvFile(resolve(process.cwd(), ".env.local"));

  const [
    email,
    password,
    fullName,
    citizenid,
    profileType = "medical_staff",
    rankCode = "rank_1",
  ] = process.argv.slice(2);

  if (!email || !password || !fullName || !citizenid) {
    usage();
    process.exit(1);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Ontbrekende Supabase env vars in .env.local.");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: createdUser, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      profile_type: profileType,
      citizenid,
    },
  });

  if (createError || !createdUser.user) {
    console.error("Aanmaken user mislukt:");
    console.error(createError?.message ?? "Onbekende fout");
    process.exit(1);
  }

  const userId = createdUser.user.id;

  let profileFound = false;
  for (let attempt = 1; attempt <= 10; attempt += 1) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (profile?.id) {
      profileFound = true;
      break;
    }

    await sleep(300);
  }

  if (!profileFound) {
    console.error("User is aangemaakt, maar profiel-trigger lijkt nog geen profile-record te hebben gemaakt.");
    console.error(`User ID: ${userId}`);
    process.exit(1);
  }

  if (rankCode && rankCode !== "none") {
    const { data: rank, error: rankLookupError } = await supabase
      .from("ranks")
      .select("id, code")
      .eq("code", rankCode)
      .single();

    if (rankLookupError || !rank) {
      console.error(`Kon rank '${rankCode}' niet vinden.`);
      console.error(rankLookupError?.message ?? "Onbekende fout");
      process.exit(1);
    }

    const { error: assignRankError } = await supabase
      .from("profiles")
      .update({ rank_id: rank.id })
      .eq("id", userId);

    if (assignRankError) {
      console.error("User is aangemaakt, maar rank toewijzen mislukte:");
      console.error(assignRankError.message);
      process.exit(1);
    }
  }

  console.log("User succesvol aangemaakt.");
  console.log(`User ID: ${userId}`);
  console.log(`Email: ${email}`);
  console.log(`Naam: ${fullName}`);
  console.log(`Profile type: ${profileType}`);
  console.log(`Citizenid: ${citizenid}`);
  console.log(`Rank: ${rankCode}`);
}

main().catch((error) => {
  console.error("Onverwachte fout:");
  console.error(error);
  process.exit(1);
});

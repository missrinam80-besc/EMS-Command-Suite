"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { clearDemoSession, createDemoSession, getAppSession, PROFILE_ACTIVATION_ERROR } from "@/lib/auth";
import { getMissingSupabaseEnvNames, hasSupabaseEnv, isDemoAuthEnabled } from "@/lib/env";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";

const loginSchema = z.object({
  email: z.email("Vul een geldig e-mailadres in."),
  password: z.string().min(8, "Wachtwoord moet minstens 8 tekens bevatten."),
});

export async function signInAction(formData: FormData) {
  if (isDemoAuthEnabled()) {
    await createDemoSession();
    redirect("/");
  }

  if (!hasSupabaseEnv()) {
    const missing = getMissingSupabaseEnvNames();
    const message = missing.length
      ? `Supabase is niet geconfigureerd. Ontbrekende env: ${missing.join(", ")}`
      : "Supabase is niet geconfigureerd voor deze omgeving.";
    redirect(`/login?error=${encodeURIComponent(message)}`);
  }

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirect(`/login?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Ongeldige invoer.")}`);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  const session = await getAppSession();
  if (!session) {
    await supabase.auth.signOut();
    redirect(`/login?error=${encodeURIComponent(PROFILE_ACTIVATION_ERROR)}`);
  }

  redirect("/");
}

export async function signOutAction() {
  if (isDemoAuthEnabled()) {
    await clearDemoSession();
    redirect("/login");
  }

  if (!hasSupabaseEnv()) {
    redirect("/login");
  }

  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

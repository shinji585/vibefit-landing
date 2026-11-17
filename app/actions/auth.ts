"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function login(values: { email: string; password: string }) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: values.email.trim().toLowerCase(),
    password: values.password,
  });

  if (error) {
    console.error("Supabase sign-in failed.", error);
    return { error: "Correo o contraseña incorrectos." };
  }

  if (!data.user) {
    return { error: "No se pudo verificar tu cuenta. Intenta de nuevo." };
  }

  const [accountResult, rolesResult] = await Promise.all([
    supabase
      .from("users")
      .select("account_status")
      .eq("id", data.user.id)
      .maybeSingle(),
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id),
  ]);
  const accessError = accountResult.error ?? rolesResult.error;

  if (accessError) {
    console.error("Could not verify the signed-in user's access.", accessError);
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      console.error("Could not clear an unverified session.", signOutError);
    }
    return { error: "No se pudo verificar tu cuenta. Intenta de nuevo." };
  }

  if (accountResult.data?.account_status !== "active") {
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      console.error("Could not sign out a suspended account.", signOutError);
    }
    return { error: "Tu cuenta no está activa. Contacta al gerente." };
  }

  const isManager = rolesResult.data?.some(({ role }) => role === "manager");
  const isReceptionist = rolesResult.data?.some(
    ({ role }) => role === "receptionist",
  );
  redirect(
    isManager
      ? "/manager-dashboard"
      : isReceptionist
        ? "/receptionist-dashboard"
        : "/user-dashboard",
  );
}

export async function logout() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Supabase sign-out failed.", error);
    throw error;
  }

  redirect("/login");
}

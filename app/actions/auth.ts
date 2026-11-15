"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function login(values: { email: string; password: string }) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: values.email.trim().toLowerCase(),
    password: values.password,
  });

  if (error) {
    console.error("Supabase sign-in failed.", error);
    return { error: "Correo o contraseña incorrectos." };
  }

  redirect("/user-dashboard");
}

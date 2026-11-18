"use server";

import "server-only";
import { createClient } from "@/lib/supabase/server";
import {
  getBogotaDate,
  loadClientDashboardData,
} from "@/lib/client-dashboard-data";

type ActionResult<T> =
  | { data: T; error: null }
  | { data: null; error: string };

export async function getClientDashboardData(): Promise<
  ActionResult<Awaited<ReturnType<typeof loadClientDashboardData>>>
> {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError) {
    console.error("Could not verify client session.", authError);
    return { data: null, error: "No se pudo verificar tu sesión." };
  }
  if (!authData.user) {
    return { data: null, error: "Debes iniciar sesión para continuar." };
  }

  try {
    return {
      data: await loadClientDashboardData(supabase, authData.user.id),
      error: null,
    };
  } catch (error) {
    console.error("Could not load client dashboard data.", error);
    return {
      data: null,
      error: "No se pudieron cargar los datos. Intenta de nuevo.",
    };
  }
}

export async function createDailyLog(values: {
  weightKg: number;
  sleepHours: number;
  caloriesConsumed: number;
  caloriesBurned: number;
}): Promise<ActionResult<null>> {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError) {
    console.error("Could not verify client session before saving daily log.", authError);
    return { data: null, error: "No se pudo verificar tu sesión." };
  }
  if (!authData.user) {
    return { data: null, error: "Debes iniciar sesión para continuar." };
  }

  if (
    !Number.isFinite(values.weightKg) ||
    values.weightKg < 20 ||
    values.weightKg > 300
  ) {
    return { data: null, error: "El peso debe estar entre 20 y 300 kg." };
  }
  if (
    !Number.isFinite(values.sleepHours) ||
    values.sleepHours < 0 ||
    values.sleepHours > 24
  ) {
    return { data: null, error: "Las horas de sueño deben estar entre 0 y 24." };
  }
  if (
    !Number.isInteger(values.caloriesConsumed) ||
    values.caloriesConsumed < 0 ||
    !Number.isInteger(values.caloriesBurned) ||
    values.caloriesBurned < 0
  ) {
    return {
      data: null,
      error: "Las calorías deben ser números enteros no negativos.",
    };
  }

  const { error } = await supabase.from("daily_logs").insert({
    client_user_id: authData.user.id,
    log_date: getBogotaDate(),
    weight_kg: values.weightKg,
    sleep_hours: values.sleepHours,
    calories_consumed: values.caloriesConsumed,
    calories_burned: values.caloriesBurned,
  });

  if (error) {
    console.error("Could not save client daily log.", error);
    return {
      data: null,
      error:
        error.code === "23505"
          ? "Ya registraste tu seguimiento de hoy"
          : "No se pudo guardar el seguimiento. Intenta de nuevo.",
    };
  }

  return { data: null, error: null };
}

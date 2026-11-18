"use server";

import "server-only";
import { createClient } from "@/lib/supabase/server";

type ActionResult<T> =
  | { data: T; error: null }
  | { data: null; error: string };

export type NutritionistClient = {
  id: string;
  full_name: string | null;
  email: string;
  hasActiveMealPlan: boolean;
};

export type NutritionistMealPlan = {
  id: string;
  client_user_id: string;
  nutritionist_user_id: string;
  plan_details: string;
  start_date: string;
  end_date: string | null;
  meal_plan_status: string;
};

export type NutritionistDashboardData = {
  today: string;
  clients: NutritionistClient[];
  plans: NutritionistMealPlan[];
};

type NutritionistContext =
  | {
      data: {
        supabase: Awaited<ReturnType<typeof createClient>>;
        userId: string;
      };
      error: null;
    }
  | { data: null; error: string };

function getBogotaDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .formatToParts(date)
    .reduce<Record<string, string>>((result, part) => {
      result[part.type] = part.value;
      return result;
    }, {});

  return `${parts.year}-${parts.month}-${parts.day}`;
}

async function getNutritionistContext(): Promise<NutritionistContext> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    console.error("Could not verify nutritionist session.", error);
    return { data: null, error: "No se pudo verificar tu sesión." };
  }
  if (!data.user) {
    return { data: null, error: "Debes iniciar sesión para continuar." };
  }

  return { data: { supabase, userId: data.user.id }, error: null };
}

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

function validateMealPlan(values: {
  planDetails: string;
  startDate: string;
  endDate: string;
}) {
  if (!values.planDetails.trim()) {
    return "Escribe el detalle del plan de alimentación.";
  }
  if (!isValidDate(values.startDate)) {
    return "Selecciona una fecha de inicio válida.";
  }
  if (
    values.endDate &&
    (!isValidDate(values.endDate) || values.endDate < values.startDate)
  ) {
    return "La fecha de fin debe ser válida y no puede ser anterior a la fecha de inicio.";
  }
  return null;
}

export async function getNutritionistDashboardData(): Promise<
  ActionResult<NutritionistDashboardData>
> {
  const context = await getNutritionistContext();
  if (context.error || !context.data) {
    return {
      data: null,
      error: context.error ?? "No se pudo verificar tu sesión.",
    };
  }

  const { supabase, userId } = context.data;
  const [clientsResult, plansResult] = await Promise.all([
    supabase
      .from("users")
      .select("id, full_name, email, user_roles!user_id(role)")
      .order("full_name"),
    supabase
      .from("meal_plans")
      .select(
        "id, client_user_id, nutritionist_user_id, plan_details, start_date, end_date, meal_plan_status",
      )
      .order("start_date", { ascending: false }),
  ]);
  const queryError = clientsResult.error ?? plansResult.error;

  if (queryError) {
    console.error("Could not load nutritionist dashboard data.", queryError);
    return {
      data: null,
      error: "No se pudieron cargar los datos. Intenta de nuevo.",
    };
  }

  const plans = plansResult.data ?? [];
  const clientRows = (clientsResult.data ?? []).filter(({ user_roles }) =>
    user_roles.some(({ role }) => role === "client"),
  );
  const clientsWithActivePlans = new Set(
    plans
      .filter(({ meal_plan_status }) => meal_plan_status === "active")
      .map(({ client_user_id }) => client_user_id),
  );

  return {
    data: {
      today: getBogotaDate(),
      clients: clientRows.map(({ id, full_name, email }) => ({
        id,
        full_name,
        email,
        hasActiveMealPlan: clientsWithActivePlans.has(id),
      })),
      plans: plans.filter(({ nutritionist_user_id }) => nutritionist_user_id === userId),
    },
    error: null,
  };
}

export async function createNutritionistMealPlan(values: {
  clientUserId: string;
  planDetails: string;
  startDate: string;
  endDate: string;
}): Promise<ActionResult<null>> {
  const context = await getNutritionistContext();
  if (context.error || !context.data) {
    return {
      data: null,
      error: context.error ?? "No se pudo verificar tu sesión.",
    };
  }

  const validationError = validateMealPlan(values);
  if (validationError) return { data: null, error: validationError };
  if (!values.clientUserId.trim()) {
    return { data: null, error: "Selecciona un cliente." };
  }

  const { error } = await context.data.supabase.from("meal_plans").insert({
    client_user_id: values.clientUserId,
    nutritionist_user_id: context.data.userId,
    plan_details: values.planDetails.trim(),
    start_date: values.startDate,
    end_date: values.endDate || null,
    meal_plan_status: "active",
  });

  if (error) {
    console.error("Could not create nutritionist meal plan.", error);
    return {
      data: null,
      error:
        error.code === "23505"
          ? "El cliente ya tiene un plan de alimentación activo"
          : "No se pudo guardar el plan de alimentación. Intenta de nuevo.",
    };
  }

  return { data: null, error: null };
}

export async function updateNutritionistMealPlan(values: {
  planId: string;
  planDetails: string;
  startDate: string;
  endDate: string;
}): Promise<ActionResult<null>> {
  const context = await getNutritionistContext();
  if (context.error || !context.data) {
    return {
      data: null,
      error: context.error ?? "No se pudo verificar tu sesión.",
    };
  }

  const validationError = validateMealPlan(values);
  if (validationError) return { data: null, error: validationError };
  if (!values.planId.trim()) {
    return { data: null, error: "No se encontró el plan que quieres actualizar." };
  }

  const { data, error } = await context.data.supabase
    .from("meal_plans")
    .update({
      plan_details: values.planDetails.trim(),
      start_date: values.startDate,
      end_date: values.endDate || null,
    })
    .eq("id", values.planId)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Could not update nutritionist meal plan.", error);
    return {
      data: null,
      error: "No se pudo actualizar el plan de alimentación. Intenta de nuevo.",
    };
  }
  if (!data) {
    return {
      data: null,
      error: "No se pudo actualizar el plan de alimentación. Intenta de nuevo.",
    };
  }

  return { data: null, error: null };
}

export async function finishNutritionistMealPlan(
  planId: string,
): Promise<ActionResult<null>> {
  const context = await getNutritionistContext();
  if (context.error || !context.data) {
    return {
      data: null,
      error: context.error ?? "No se pudo verificar tu sesión.",
    };
  }
  if (!planId.trim()) {
    return { data: null, error: "No se encontró el plan que quieres finalizar." };
  }

  const { data, error } = await context.data.supabase
    .from("meal_plans")
    .update({
      meal_plan_status: "finished",
      end_date: getBogotaDate(),
    })
    .eq("id", planId)
    .eq("meal_plan_status", "active")
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Could not finish nutritionist meal plan.", error);
    return {
      data: null,
      error: "No se pudo finalizar el plan de alimentación. Intenta de nuevo.",
    };
  }
  if (!data) {
    return {
      data: null,
      error: "No se pudo finalizar el plan de alimentación. Intenta de nuevo.",
    };
  }

  return { data: null, error: null };
}

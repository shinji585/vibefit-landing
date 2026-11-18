import "server-only";

import { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type DailyLog = {
  id: string;
  client_user_id: string;
  log_date: string;
  weight_kg: number;
  sleep_hours: number;
  calories_consumed: number;
  calories_burned: number;
};

export type ClientDashboardData = {
  today: string;
  hasActiveMembership: boolean;
  membership: {
    plan_name: string | null;
    price: number | null;
    duration_in_days: number | null;
    start_date: string;
    end_date: string;
  } | null;
  routine: {
    routine_title: string;
    routine_description: string | null;
    days: {
      id: string;
      day_number: number;
      day_title: string;
      exercises_details: string;
    }[];
  } | null;
  mealPlan: {
    plan_details: string;
    start_date: string;
    end_date: string | null;
    nutritionist_name: string | null;
  } | null;
  dailyLogs: DailyLog[];
};

export function getBogotaDate(date = new Date()) {
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

export async function loadClientDashboardData(
  supabase: SupabaseServerClient,
  clientId: string,
): Promise<ClientDashboardData> {
  const today = getBogotaDate();
  const { data: membership, error: membershipError } = await supabase
    .from("client_memberships")
    .select("id, membership_plan_id, start_date, end_date")
    .eq("client_user_id", clientId)
    .eq("membership_status", "active")
    .lte("start_date", today)
    .gte("end_date", today)
    .order("start_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (membershipError) throw membershipError;
  if (!membership) {
    return {
      today,
      hasActiveMembership: false,
      membership: null,
      routine: null,
      mealPlan: null,
      dailyLogs: [],
    };
  }

  const [membershipPlanResult, routineAssignmentResult, mealPlanResult, logsResult] =
    await Promise.all([
      supabase
        .from("membership_plans")
        .select("plan_name, price, duration_in_days")
        .eq("id", membership.membership_plan_id)
        .maybeSingle(),
      supabase
        .from("routine_assignments")
        .select("routine_id")
        .eq("client_user_id", clientId)
        .eq("assignment_status", "active")
        .order("start_date", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("meal_plans")
        .select(
          "plan_details, nutritionist_user_id, start_date, end_date",
        )
        .eq("client_user_id", clientId)
        .eq("meal_plan_status", "active")
        .lte("start_date", today)
        .or(`end_date.is.null,end_date.gte.${today}`)
        .order("start_date", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("daily_logs")
        .select(
          "id, client_user_id, log_date, weight_kg, sleep_hours, calories_consumed, calories_burned",
        )
        .eq("client_user_id", clientId)
        .order("log_date", { ascending: false }),
    ]);

  const initialQueryError =
    membershipPlanResult.error ??
    routineAssignmentResult.error ??
    mealPlanResult.error ??
    logsResult.error;
  if (initialQueryError) throw initialQueryError;

  const routineId = routineAssignmentResult.data?.routine_id;
  const [routineResult, routineDaysResult, nutritionistResult] =
    await Promise.all([
      routineId
        ? supabase
            .from("routines")
            .select("routine_title, routine_description")
            .eq("id", routineId)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      routineId
        ? supabase
            .from("routine_days")
            .select("id, routine_id, day_number, day_title, exercises_details")
            .eq("routine_id", routineId)
            .order("day_number")
        : Promise.resolve({ data: [], error: null }),
      mealPlanResult.data?.nutritionist_user_id
        ? supabase
            .from("users")
            .select("full_name")
            .eq("id", mealPlanResult.data.nutritionist_user_id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

  const detailQueryError =
    routineResult.error ??
    routineDaysResult.error ??
    nutritionistResult.error;
  if (detailQueryError) throw detailQueryError;

  return {
    today,
    hasActiveMembership: true,
    membership: {
      plan_name: membershipPlanResult.data?.plan_name ?? null,
      price: membershipPlanResult.data?.price ?? null,
      duration_in_days: membershipPlanResult.data?.duration_in_days ?? null,
      start_date: membership.start_date,
      end_date: membership.end_date,
    },
    routine: routineResult.data
      ? {
          ...routineResult.data,
          days: routineDaysResult.data ?? [],
        }
      : null,
    mealPlan: mealPlanResult.data
      ? {
          plan_details: mealPlanResult.data.plan_details,
          start_date: mealPlanResult.data.start_date,
          end_date: mealPlanResult.data.end_date,
          nutritionist_name: nutritionistResult.data?.full_name ?? null,
        }
      : null,
    dailyLogs: logsResult.data ?? [],
  };
}

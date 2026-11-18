"use server";

import "server-only";
import { createClient } from "@/lib/supabase/server";

type ActionResult<T> =
  | { data: T; error: null }
  | { data: null; error: string };

type RoutineDayInput = {
  dayNumber: number;
  title: string;
  exercisesDetails: string;
};

type CoachRoutineDay = {
  id: string;
  day_number: number;
  day_title: string;
  exercises_details: string;
};

type CoachRoutine = {
  id: string;
  routine_title: string;
  routine_description: string | null;
  created_at: string;
  days: CoachRoutineDay[];
};

type CoachClient = {
  id: string;
  full_name: string | null;
  email: string;
  activeRoutine: {
    assignmentId: string;
    title: string;
    startDate: string;
    canFinish: boolean;
  } | null;
};

type CoachDashboardData = {
  clients: CoachClient[];
  routines: CoachRoutine[];
};

async function getCoachContext() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error) {
    console.error("Could not verify coach session.", error);
    return { data: null, error: "No se pudo verificar tu sesión." } as const;
  }

  const coachId = data?.claims?.sub;
  if (!coachId) {
    return { data: null, error: "Debes iniciar sesión para continuar." } as const;
  }

  return { data: { supabase, coachId }, error: null } as const;
}

function isRoutineDayListValid(days: RoutineDayInput[]) {
  const numbers = days.map(({ dayNumber }) => dayNumber);
  return (
    days.length > 0 &&
    days.every(
      ({ dayNumber, title, exercisesDetails }) =>
        Number.isInteger(dayNumber) &&
        dayNumber >= 1 &&
        dayNumber <= 7 &&
        title.trim().length > 0 &&
        exercisesDetails.trim().length > 0,
    ) &&
    new Set(numbers).size === numbers.length
  );
}

function routineWriteError(error: { code?: string; message: string }) {
  console.error("Could not save coach routine.", error);
  if (error.code === "23505") {
    return "No repitas el número de día dentro de la misma rutina.";
  }
  return "No se pudo guardar la rutina. Revisa los datos e intenta de nuevo.";
}

export async function getCoachDashboardData(): Promise<
  ActionResult<CoachDashboardData>
> {
  const context = await getCoachContext();
  if (context.error || !context.data) {
    return { data: null, error: context.error ?? "No se pudo verificar tu sesión." };
  }

  const { supabase, coachId } = context.data;
  const [assignmentsResult, routinesResult] = await Promise.all([
    supabase
      .from("client_coach_assignments")
      .select("client_user_id")
      .eq("coach_user_id", coachId),
    supabase
      .from("routines")
      .select("id, routine_title, routine_description, created_at")
      .eq("coach_user_id", coachId)
      .order("created_at", { ascending: false }),
  ]);
  if (assignmentsResult.error) {
    console.error("Could not load coach's assigned clients.", assignmentsResult.error);
    return { data: null, error: "No se pudieron cargar tus clientes." };
  }
  if (routinesResult.error) {
    console.error("Could not load coach routines.", routinesResult.error);
    return { data: null, error: "No se pudieron cargar tus rutinas." };
  }

  const clientIds = [
    ...new Set((assignmentsResult.data ?? []).map(({ client_user_id }) => client_user_id)),
  ];
  const routineRows = routinesResult.data ?? [];
  const routineIds = routineRows.map(({ id }) => id);

  const [clientsResult, daysResult, activeAssignmentsResult] = await Promise.all([
    clientIds.length
      ? supabase
          .from("users")
          .select("id, full_name, email")
          .in("id", clientIds)
          .order("full_name")
      : Promise.resolve({ data: [], error: null }),
    routineIds.length
      ? supabase
          .from("routine_days")
          .select("id, routine_id, day_number, day_title, exercises_details")
          .in("routine_id", routineIds)
          .order("day_number")
      : Promise.resolve({ data: [], error: null }),
    clientIds.length
      ? supabase
          .from("routine_assignments")
          .select("id, routine_id, client_user_id, start_date")
          .eq("assignment_status", "active")
          .in("client_user_id", clientIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const queryError =
    clientsResult.error ?? daysResult.error ?? activeAssignmentsResult.error;
  if (queryError) {
    console.error("Could not load coach dashboard records.", queryError);
    return { data: null, error: "No se pudieron cargar los datos del dashboard." };
  }

  const routineById = new Map(
    routineRows.map((routine) => [routine.id, routine.routine_title]),
  );
  const activeByClient = new Map(
    (activeAssignmentsResult.data ?? []).map((assignment) => [
      assignment.client_user_id,
      {
        assignmentId: assignment.id,
        title: routineById.get(assignment.routine_id) ?? "Rutina activa",
        startDate: assignment.start_date,
        canFinish: routineById.has(assignment.routine_id),
      },
    ]),
  );
  const daysByRoutine = new Map<string, CoachRoutineDay[]>();
  for (const day of daysResult.data ?? []) {
    const routineDays = daysByRoutine.get(day.routine_id) ?? [];
    routineDays.push({
      id: day.id,
      day_number: day.day_number,
      day_title: day.day_title,
      exercises_details: day.exercises_details,
    });
    daysByRoutine.set(day.routine_id, routineDays);
  }

  return {
    data: {
      clients: (clientsResult.data ?? []).map((client) => ({
        ...client,
        activeRoutine: activeByClient.get(client.id) ?? null,
      })),
      routines: routineRows.map((routine) => ({
        ...routine,
        days: daysByRoutine.get(routine.id) ?? [],
      })),
    },
    error: null,
  };
}

export async function saveCoachRoutine(values: {
  routineId?: string;
  title: string;
  description: string;
  days: RoutineDayInput[];
}): Promise<ActionResult<{ id: string }>> {
  const context = await getCoachContext();
  if (context.error || !context.data) {
    return { data: null, error: context.error ?? "No se pudo verificar tu sesión." };
  }

  const title = values.title.trim();
  const description = values.description.trim();
  if (!title) return { data: null, error: "Escribe el título de la rutina." };
  if (!isRoutineDayListValid(values.days)) {
    return {
      data: null,
      error:
        "Agrega al menos un día válido. Usa números del 1 al 7, sin repetirlos, y completa título y ejercicios.",
    };
  }

  const { supabase, coachId } = context.data;
  let routineId = values.routineId;
  if (routineId) {
    const { error } = await supabase
      .from("routines")
      .update({
        routine_title: title,
        routine_description: description || null,
      })
      .eq("id", routineId);
    if (error) {
      return { data: null, error: routineWriteError(error) };
    }

    const { error: daysError } = await supabase
      .from("routine_days")
      .upsert(
        values.days.map((day) => ({
          routine_id: routineId,
          day_number: day.dayNumber,
          day_title: day.title.trim(),
          exercises_details: day.exercisesDetails.trim(),
        })),
        { onConflict: "routine_id,day_number" },
      );
    if (daysError) {
      return { data: null, error: routineWriteError(daysError) };
    }

    const dayNumbers = values.days.map(({ dayNumber }) => dayNumber);
    let deleteDaysQuery = supabase
      .from("routine_days")
      .delete()
      .eq("routine_id", routineId);
    if (dayNumbers.length) {
      deleteDaysQuery = deleteDaysQuery.not(
        "day_number",
        "in",
        `(${dayNumbers.join(",")})`,
      );
    }
    const { error: deleteDaysError } = await deleteDaysQuery;
    if (deleteDaysError) {
      console.error("Could not remove deleted routine days.", deleteDaysError);
      return {
        data: null,
        error: "La rutina se actualizó, pero no se pudieron quitar los días eliminados.",
      };
    }
  } else {
    const { data: routine, error } = await supabase
      .from("routines")
      .insert({
        coach_user_id: coachId,
        routine_title: title,
        routine_description: description || null,
      })
      .select("id")
      .single();
    if (error) return { data: null, error: routineWriteError(error) };
    routineId = routine.id;

    const { error: daysError } = await supabase.from("routine_days").insert(
      values.days.map((day) => ({
        routine_id: routineId,
        day_number: day.dayNumber,
        day_title: day.title.trim(),
        exercises_details: day.exercisesDetails.trim(),
      })),
    );
    if (daysError) {
      console.error("Routine was created, but its days could not be saved.", daysError);
      return {
        data: null,
        error: "La rutina se creó, pero no se pudieron guardar sus días.",
      };
    }
  }

  if (!routineId) {
    return { data: null, error: "No se pudo guardar la rutina." };
  }
  return { data: { id: routineId }, error: null };
}

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

export async function assignRoutineToClient(values: {
  routineId: string;
  clientId: string;
}): Promise<ActionResult<null>> {
  const context = await getCoachContext();
  if (context.error || !context.data) {
    return { data: null, error: context.error ?? "No se pudo verificar tu sesión." };
  }
  if (!values.routineId || !values.clientId) {
    return { data: null, error: "Selecciona una rutina y un cliente." };
  }

  const { supabase } = context.data;
  const { data: activeAssignment, error: lookupError } = await supabase
    .from("routine_assignments")
    .select("id")
    .eq("client_user_id", values.clientId)
    .eq("assignment_status", "active")
    .limit(1)
    .maybeSingle();
  if (lookupError) {
    console.error("Could not check the client's active routine.", lookupError);
    return {
      data: null,
      error: "No se pudo verificar si el cliente ya tiene una rutina activa.",
    };
  }
  if (activeAssignment) {
    return { data: null, error: "El cliente ya tiene una rutina activa." };
  }

  const { error } = await supabase.from("routine_assignments").insert({
    routine_id: values.routineId,
    client_user_id: values.clientId,
    assignment_status: "active",
    start_date: getBogotaDate(),
  });
  if (error) {
    console.error("Could not assign routine to client.", error);
    return {
      data: null,
      error:
        error.code === "23505"
          ? "El cliente ya tiene una rutina activa."
          : "No se pudo asignar la rutina. Verifica los datos e intenta de nuevo.",
    };
  }

  return { data: null, error: null };
}

export async function finishRoutineAssignment(
  assignmentId: string,
): Promise<ActionResult<null>> {
  const context = await getCoachContext();
  if (context.error || !context.data) {
    return { data: null, error: context.error ?? "No se pudo verificar tu sesión." };
  }
  if (!assignmentId) {
    return { data: null, error: "Selecciona una rutina activa." };
  }

  const { error } = await context.data.supabase
    .from("routine_assignments")
    .update({
      assignment_status: "finished",
      end_date: getBogotaDate(),
    })
    .eq("id", assignmentId)
    .eq("assignment_status", "active");
  if (error) {
    console.error("Could not finish coach routine assignment.", error);
    return { data: null, error: "No se pudo finalizar la rutina. Intenta de nuevo." };
  }

  return { data: null, error: null };
}

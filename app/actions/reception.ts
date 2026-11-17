"use server";

import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type ActionResult<T> = { data: T; error: null } | { data: null; error: string };

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

function getBogotaDayBounds(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, day, 5));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

function addDays(date: string, days: number) {
  const [year, month, day] = date.split("-").map(Number);
  const nextDate = new Date(Date.UTC(year, month - 1, day + days));
  return [
    nextDate.getUTCFullYear(),
    String(nextDate.getUTCMonth() + 1).padStart(2, "0"),
    String(nextDate.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

type ReceptionContext =
  | { authorized: true; supabase: Awaited<ReturnType<typeof createClient>>; userId: string }
  | { authorized: false; error: string };

async function getReceptionContext(): Promise<ReceptionContext> {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getClaims();

  if (authError) {
    console.error("Could not verify receptionist session.", authError);
    return { authorized: false, error: "No se pudo verificar tu sesión." };
  }

  const userId = authData?.claims?.sub;
  if (!userId) {
    return { authorized: false, error: "Debes iniciar sesión para continuar." };
  }

  const { data: roles, error: rolesError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  if (rolesError) {
    console.error("Could not verify receptionist role.", rolesError);
    return { authorized: false, error: "No se pudo verificar tu acceso." };
  }

  if (!roles?.some(({ role }) => role === "receptionist")) {
    return { authorized: false, error: "No tienes permiso para realizar esta acción." };
  }

  return { authorized: true, supabase, userId };
}

export async function getReceptionDashboardData(): Promise<ActionResult<{
  today: string;
  users: {
    id: string;
    full_name: string | null;
    email: string;
    created_at: string;
    account_status: string;
    roles: string[];
  }[];
  memberships: {
    id: string;
    client_user_id: string;
    start_date: string;
    end_date: string;
  }[];
  plans: {
    id: string;
    plan_name: string;
    price: number;
    duration_in_days: number;
  }[];
  attendance: {
    id: string;
    client_user_id: string;
    attended_at: string;
  }[];
}>> {
  const context = await getReceptionContext();
  if (!context.authorized) return { data: null, error: context.error };

  const today = getBogotaDate();
  const bounds = getBogotaDayBounds(today);
  const [usersResult, membershipsResult, plansResult, attendanceResult] =
    await Promise.all([
      context.supabase
        .from("users")
        .select("id, full_name, email, created_at, account_status, user_roles!user_id(role)")
        .order("created_at", { ascending: false }),
      context.supabase
        .from("client_memberships")
        .select("id, client_user_id, start_date, end_date")
        .eq("membership_status", "active"),
      context.supabase
        .from("membership_plans")
        .select("id, plan_name, price, duration_in_days")
        .order("plan_name"),
      context.supabase
        .from("attendance_records")
        .select("id, client_user_id, attended_at")
        .gte("attended_at", bounds.start)
        .lt("attended_at", bounds.end)
        .order("attended_at", { ascending: false }),
    ]);

  const queryError =
    usersResult.error ??
    membershipsResult.error ??
    plansResult.error ??
    attendanceResult.error;
  if (queryError) {
    console.error("Could not load receptionist dashboard data.", queryError);
    return {
      data: null,
      error: "No se pudieron cargar los datos. Intenta de nuevo.",
    };
  }

  const clientUsers = (usersResult.data ?? []).filter(
    (user) =>
      user.user_roles.length === 1 && user.user_roles[0]?.role === "client",
  );

  return {
    data: {
      today,
      users: clientUsers.map((user) => ({
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        created_at: user.created_at,
        account_status: user.account_status,
        roles: user.user_roles.map(({ role }) => role),
      })),
      memberships: membershipsResult.data ?? [],
      plans: plansResult.data ?? [],
      attendance: attendanceResult.data ?? [],
    },
    error: null,
  };
}

export async function createReceptionClient(values: {
  fullName: string;
  email: string;
  temporaryPassword: string;
}): Promise<ActionResult<{ id: string }>> {
  const context = await getReceptionContext();
  if (!context.authorized) return { data: null, error: context.error };

  const fullName = values.fullName.trim();
  const email = values.email.trim().toLowerCase();
  if (!fullName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { data: null, error: "Escribe un nombre y un correo válidos." };
  }
  if (values.temporaryPassword.length < 8) {
    return { data: null, error: "La contraseña temporal debe tener al menos 8 caracteres." };
  }

  const adminClient = createAdminClient();
  if (!adminClient) {
    console.error("SUPABASE_SERVICE_ROLE_KEY is not configured for server-side user creation.");
    return {
      data: null,
      error: "La creación de usuarios no está configurada en el servidor.",
    };
  }

  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password: values.temporaryPassword,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (error) {
    console.error("Could not create receptionist client account.", error);
    if (
      error.code === "email_exists" ||
      error.code === "user_already_exists" ||
      error.message.toLowerCase().includes("already registered")
    ) {
      return { data: null, error: "Ya existe una cuenta con ese correo." };
    }
    return {
      data: null,
      error: "No se pudo crear el usuario. Revisa los datos e intenta de nuevo.",
    };
  }

  if (!data.user) {
    return { data: null, error: "Supabase no devolvió el usuario creado." };
  }

  return { data: { id: data.user.id }, error: null };
}

export async function assignReceptionMembership(values: {
  clientUserId: string;
  planId: string;
}): Promise<ActionResult<null>> {
  const context = await getReceptionContext();
  if (!context.authorized) return { data: null, error: context.error };

  const { data: targetRoles, error: targetRoleError } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", values.clientUserId);
  if (targetRoleError) {
    console.error("Could not verify membership recipient role.", targetRoleError);
    return { data: null, error: "No se pudo verificar el cliente seleccionado." };
  }
  if (
    targetRoles?.length !== 1 ||
    targetRoles[0]?.role !== "client"
  ) {
    return { data: null, error: "Solo se puede asignar un plan a una cuenta de cliente." };
  }

  const { data: plan, error: planError } = await context.supabase
    .from("membership_plans")
    .select("id, duration_in_days")
    .eq("id", values.planId)
    .maybeSingle();
  if (planError) {
    console.error("Could not load membership plan for assignment.", planError);
    return { data: null, error: "No se pudo cargar el plan seleccionado." };
  }
  if (!plan || plan.duration_in_days <= 0) {
    return { data: null, error: "Selecciona un plan válido." };
  }

  const today = getBogotaDate();
  const { data: activeMemberships, error: membershipsError } =
    await context.supabase
      .from("client_memberships")
      .select("id, start_date, end_date")
      .eq("client_user_id", values.clientUserId)
      .eq("membership_status", "active");
  if (membershipsError) {
    console.error("Could not check the client's existing membership.", membershipsError);
    return { data: null, error: "No se pudo verificar la membresía actual." };
  }

  const expiredIds = (activeMemberships ?? [])
    .filter(({ end_date }) => end_date < today)
    .map(({ id }) => id);
  if (expiredIds.length) {
    const { error: finishError } = await context.supabase
      .from("client_memberships")
      .update({ membership_status: "finished" })
      .in("id", expiredIds);
    if (finishError) {
      console.error("Could not finish expired client memberships.", finishError);
      return {
        data: null,
        error: "No se pudo cerrar el plan vencido. Intenta de nuevo.",
      };
    }
  }

  const stillActive = (activeMemberships ?? []).some(
    ({ end_date }) => end_date >= today,
  );
  if (stillActive) {
    return {
      data: null,
      error: "El cliente ya tiene un plan activo. No se asignó otro.",
    };
  }

  const endDate = addDays(today, plan.duration_in_days);
  const { error: insertError } = await context.supabase
    .from("client_memberships")
    .insert({
      client_user_id: values.clientUserId,
      membership_plan_id: plan.id,
      assigned_by_user_id: context.userId,
      membership_status: "active",
      start_date: today,
      end_date: endDate,
    });

  if (insertError) {
    console.error("Could not assign membership to client.", insertError);
    return {
      data: null,
      error:
        insertError.code === "23505"
          ? "El cliente ya tiene un plan activo. Actualiza la lista e inténtalo de nuevo."
          : "No se pudo asignar el plan. Intenta de nuevo.",
    };
  }

  return { data: null, error: null };
}

export async function registerReceptionAttendance(
  clientUserId: string,
): Promise<ActionResult<null>> {
  const context = await getReceptionContext();
  if (!context.authorized) return { data: null, error: context.error };

  const today = getBogotaDate();
  const { data: memberships, error: membershipError } =
    await context.supabase
      .from("client_memberships")
      .select("id, start_date, end_date")
      .eq("client_user_id", clientUserId)
      .eq("membership_status", "active")
      .lte("start_date", today)
      .gte("end_date", today)
      .limit(1);
  if (membershipError) {
    console.error("Could not verify attendance client's membership.", membershipError);
    return {
      data: null,
      error: "No se pudo verificar la membresía del cliente.",
    };
  }
  if (!memberships?.length) {
    return {
      data: null,
      error: "Solo se puede registrar asistencia a clientes con plan vigente.",
    };
  }

  const { error: insertError } = await context.supabase
    .from("attendance_records")
    .insert({
      client_user_id: clientUserId,
      registered_by_user_id: context.userId,
      attended_at: new Date().toISOString(),
    });
  if (insertError) {
    console.error("Could not register manual client attendance.", insertError);
    return {
      data: null,
      error: "No se pudo registrar la asistencia. Intenta de nuevo.",
    };
  }

  return { data: null, error: null };
}

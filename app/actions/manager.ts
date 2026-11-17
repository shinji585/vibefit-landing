"use server";

import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type ManagerActionResult =
  | { error: null; id: string }
  | { error: string; id: string | null };

type ManagedRole = "client" | "coach" | "nutritionist" | "receptionist";

export async function createManagerUser(values: {
  fullName: string;
  email: string;
  temporaryPassword: string;
  role: ManagedRole;
}): Promise<ManagerActionResult> {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getClaims();
  if (authError) {
    console.error("Could not verify manager session before creating an account.", authError);
    return { error: "No se pudo verificar tu sesión.", id: null };
  }

  const managerId = authData?.claims?.sub;
  if (!managerId) {
    return { error: "Debes iniciar sesión para continuar.", id: null };
  }

  const [accountResult, rolesResult] = await Promise.all([
    supabase
      .from("users")
      .select("account_status")
      .eq("id", managerId)
      .maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", managerId),
  ]);
  if (accountResult.error || rolesResult.error) {
    console.error(
      "Could not verify manager permissions before creating an account.",
      accountResult.error ?? rolesResult.error,
    );
    return { error: "No se pudo verificar tu acceso.", id: null };
  }
  if (
    accountResult.data?.account_status !== "active" ||
    !rolesResult.data?.some(({ role }) => role === "manager")
  ) {
    return { error: "No tienes permiso para crear usuarios.", id: null };
  }

  const fullName = values.fullName.trim();
  const email = values.email.trim().toLowerCase();
  if (!fullName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Escribe un nombre y un correo válidos.", id: null };
  }
  if (values.temporaryPassword.length < 8) {
    return {
      error: "La contraseña temporal debe tener al menos 8 caracteres.",
      id: null,
    };
  }
  if (
    !["client", "coach", "nutritionist", "receptionist"].includes(values.role)
  ) {
    return { error: "Selecciona un rol válido.", id: null };
  }

  const adminClient = createAdminClient();
  if (!adminClient) {
    console.error("SUPABASE_SERVICE_ROLE_KEY is not configured for server-side user creation.");
    return {
      error: "La creación de usuarios no está configurada en el servidor.",
      id: null,
    };
  }

  const { data: createData, error: createError } =
    await adminClient.auth.admin.createUser({
      email,
      password: values.temporaryPassword,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
  if (createError) {
    console.error("Could not create manager-managed account.", createError);
    if (
      createError.code === "email_exists" ||
      createError.code === "user_already_exists" ||
      createError.message.toLowerCase().includes("already registered")
    ) {
      return { error: "Ya existe una cuenta con ese correo.", id: null };
    }
    return {
      error: "No se pudo crear el usuario. Revisa los datos e intenta de nuevo.",
      id: null,
    };
  }

  const createdUser = createData.user;
  if (!createdUser) {
    return {
      error: "Supabase no devolvió el usuario creado.",
      id: null,
    };
  }

  const { data: assignedRoles, error: assignedRolesError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", createdUser.id);
  if (assignedRolesError) {
    console.error("Could not load the new user's default role.", assignedRolesError);
    return {
      error: "La cuenta se creó, pero no se pudo verificar el rol asignado.",
      id: createdUser.id,
    };
  }

  const hasDefaultClientRole = assignedRoles?.some(
    ({ role }) => role === "client",
  );
  if (hasDefaultClientRole && values.role !== "client") {
    const { error: insertRoleError } = await supabase.from("user_roles").insert({
      user_id: createdUser.id,
      role: values.role,
      assigned_by_user_id: managerId,
    });
    if (insertRoleError) {
      console.error("Could not assign the requested role to new account.", insertRoleError);
      return {
        error:
          "La cuenta se creó, pero no se pudo asignar el rol seleccionado. Revisa el usuario en la lista.",
        id: createdUser.id,
      };
    }

    const { error: removeDefaultRoleError } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", createdUser.id)
      .eq("role", "client");
    if (removeDefaultRoleError) {
      console.error(
        "Account was created with the requested role, but its default client role could not be removed.",
        removeDefaultRoleError,
      );
      return {
        error:
          "La cuenta se creó y recibió el rol solicitado, pero no se pudo quitar el rol cliente automático. Revisa el usuario en la lista.",
        id: createdUser.id,
      };
    }
  } else if (!hasDefaultClientRole) {
    const { error: insertRoleError } = await supabase.from("user_roles").insert({
      user_id: createdUser.id,
      role: values.role,
      assigned_by_user_id: managerId,
    });
    if (insertRoleError) {
      console.error(
        "Account was created but its requested role could not be assigned.",
        insertRoleError,
      );
      return {
        error:
          "La cuenta se creó, pero no se pudo asignar el rol seleccionado. Revisa el usuario en la lista.",
        id: createdUser.id,
      };
    }
  }

  return { error: null, id: createdUser.id };
}

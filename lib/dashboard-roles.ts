export const dashboardRoleChoices = [
  {
    role: "manager",
    label: "Gerente",
    title: "Dashboard del gerente",
    description: "Administra VibeFit y acompaña la operación del gimnasio.",
    href: "/manager-dashboard",
    animation: "office",
  },
  {
    role: "receptionist",
    label: "Recepcionista",
    title: "Dashboard de recepción",
    description: "Gestiona la atención y las tareas de recepción.",
    href: "/receptionist-dashboard",
    animation: "office",
  },
  {
    role: "coach",
    label: "Coach",
    title: "Dashboard del coach",
    description: "Consulta tus clientes y administra sus rutinas.",
    href: "/coach-dashboard",
    animation: "creating",
  },
  {
    role: "nutritionist",
    label: "Nutricionista",
    title: "Dashboard del nutricionista",
    description: "Acompaña a tus clientes con sus planes de alimentación.",
    href: "/nutritionist-dashboard",
    animation: "lifestyle",
  },
  {
    role: "client",
    label: "Cliente",
    title: "Dashboard del cliente",
    description: "Consulta tus planes y sigue tu progreso.",
    href: "/client-dashboard",
    animation: "fitness",
  },
] as const;

export type DashboardRoleChoice = (typeof dashboardRoleChoices)[number];
export type DashboardEntryPath =
  | DashboardRoleChoice["href"]
  | "/choose-dashboard"
  | "/user-dashboard";

export function getDashboardRoleChoices(roles: readonly string[]) {
  return dashboardRoleChoices.filter(({ role }) => roles.includes(role));
}

export function getDashboardEntryPath(
  roles: readonly string[],
): DashboardEntryPath {
  const choices = getDashboardRoleChoices(roles);

  if (choices.length > 1) {
    return "/choose-dashboard";
  }

  return choices[0]?.href ?? "/user-dashboard";
}

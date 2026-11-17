"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Image from "next/image";
import {
  assignReceptionMembership,
  createReceptionClient,
  getReceptionDashboardData,
  registerReceptionAttendance,
} from "@/app/actions/reception";
import { logout } from "@/app/actions/auth";
import {
  BellIcon,
  CalendarIcon,
  PieChartIcon,
  TableIcon,
  UsersIcon,
} from "@/components/dashboard-icons";
import {
  MembershipStatusChart,
  type MembershipStatusDay,
} from "@/components/manager-dashboard-data";

type ReceptionUser = {
  id: string;
  full_name: string | null;
  email: string;
  created_at: string;
  account_status: string;
  roles: string[];
};

type ReceptionDashboardData = {
  today: string;
  users: ReceptionUser[];
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
};

type Feedback = { ok: boolean; text: string };

function formatBogotaDate(date: string) {
  return new Date(`${date}T12:00:00-05:00`).toLocaleDateString("es-CO", {
    timeZone: "America/Bogota",
    dateStyle: "long",
  });
}

function formatBogotaDateTime(date: string) {
  return new Date(date).toLocaleString("es-CO", {
    timeZone: "America/Bogota",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function addCalendarDays(date: string, days: number) {
  const [year, month, day] = date.split("-").map(Number);
  const value = new Date(Date.UTC(year, month - 1, day + days));
  return [
    value.getUTCFullYear(),
    String(value.getUTCMonth() + 1).padStart(2, "0"),
    String(value.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function getBogotaDate(date: Date) {
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

function formatBogotaDayLabel(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    weekday: "short",
    day: "2-digit",
  }).format(new Date(Date.UTC(year, month - 1, day, 17)));
}

function Modal({
  title,
  description,
  onClose,
  children,
}: {
  title: string;
  description: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/45 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="reception-modal-title"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl sm:p-8"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          VibeFit · Recepción
        </p>
        <h2
          id="reception-modal-title"
          className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950"
        >
          {title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-zinc-500">{description}</p>
        <div className="mt-6">{children}</div>
      </section>
    </div>
  );
}

export function ReceptionDashboard({
  receptionistName,
}: {
  receptionistName: string | null;
}) {
  const [data, setData] = useState<ReceptionDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pendingClient, setPendingClient] = useState<ReceptionUser | null>(null);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const loadData = useCallback(async () => {
    setLoadError(null);
    try {
      const result = await getReceptionDashboardData();
      if (result.error) {
        setLoadError(result.error);
        setData(null);
      } else {
        setData(result.data);
      }
    } catch (error) {
      console.error("Could not request receptionist dashboard data.", error);
      setLoadError("No se pudieron cargar los datos. Intenta de nuevo.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialLoadId = window.setTimeout(() => void loadData(), 0);
    const intervalId = window.setInterval(() => void loadData(), 60_000);
    return () => {
      window.clearTimeout(initialLoadId);
      window.clearInterval(intervalId);
    };
  }, [loadData]);

  const clientUsers = useMemo(
    () =>
      (data?.users ?? []).filter(
        (user) =>
          user.roles.length === 1 &&
          user.roles[0] === "client" &&
          user.account_status === "active",
      ),
    [data],
  );
  const clientUserIds = useMemo(
    () => new Set(clientUsers.map(({ id }) => id)),
    [clientUsers],
  );
  const activeTodayUserIds = useMemo(
    () =>
      new Set(
        (data?.memberships ?? [])
          .filter(
            ({ start_date, end_date }) =>
              start_date <= (data?.today ?? "") &&
              end_date >= (data?.today ?? ""),
          )
          .map(({ client_user_id }) => client_user_id),
      ),
    [data],
  );
  const enrolledUserIds = useMemo(
    () =>
      new Set(
        [...activeTodayUserIds].filter((userId) => clientUserIds.has(userId)),
      ),
    [activeTodayUserIds, clientUserIds],
  );
  const pendingUsers = useMemo(
    () => clientUsers.filter((user) => !enrolledUserIds.has(user.id)),
    [clientUsers, enrolledUserIds],
  );
  const membershipStatusDays = useMemo<MembershipStatusDay[]>(() => {
    if (!data) return [];

    const days = Array.from({ length: 7 }, (_, index) => {
      const date = addCalendarDays(data.today, index - 6);
      return {
        date,
        label: formatBogotaDayLabel(date),
        pending: 0,
        enrolled: 0,
      };
    });
    const dayByDate = new Map(days.map((day) => [day.date, day]));

    for (const user of clientUsers) {
      const day = dayByDate.get(getBogotaDate(new Date(user.created_at)));
      if (!day) continue;
      if (enrolledUserIds.has(user.id)) day.enrolled += 1;
      else day.pending += 1;
    }

    return days;
  }, [clientUsers, data, enrolledUserIds]);
  const expiringUsersCount = useMemo(() => {
    if (!data) return 0;
    const lastExpiringDay = new Date(`${data.today}T12:00:00Z`);
    lastExpiringDay.setUTCDate(lastExpiringDay.getUTCDate() + 7);
    const lastDate = lastExpiringDay.toISOString().slice(0, 10);
    return new Set(
      data.memberships
        .filter(
          ({ start_date, end_date }) =>
            start_date <= data.today &&
            end_date >= data.today &&
            end_date <= lastDate,
        )
        .map(({ client_user_id }) => client_user_id),
    ).size;
  }, [data]);
  const searchResults = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase("es");
    if (!normalized) return [];
    return clientUsers.filter((user) => {
      const hasCurrentPlan = activeTodayUserIds.has(user.id);
      return (
        hasCurrentPlan &&
        `${user.full_name ?? ""} ${user.email}`
          .toLocaleLowerCase("es")
          .includes(normalized)
      );
    });
  }, [activeTodayUserIds, clientUsers, search]);
  const chartMetrics = [
    { label: "Clientes inscritos", value: enrolledUserIds.size },
    { label: "Planes por vencer · 7 días", value: expiringUsersCount },
    { label: "Preinscripciones pendientes", value: pendingUsers.length },
  ];

  async function handleAssignMembership(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!pendingClient || !selectedPlanId) {
      setFeedback({ ok: false, text: "Selecciona un plan para continuar." });
      return;
    }
    setBusy(true);
    setFeedback(null);
    const result = await assignReceptionMembership({
      clientUserId: pendingClient.id,
      planId: selectedPlanId,
    });
    setBusy(false);
    if (result.error) {
      setFeedback({ ok: false, text: result.error });
      return;
    }
    setPendingClient(null);
    setSelectedPlanId("");
    setShowNotifications(false);
    setFeedback({
      ok: true,
      text: `Plan asignado a ${pendingClient.full_name || pendingClient.email}.`,
    });
    await loadData();
  }

  async function handleCreateClient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setBusy(true);
    setFeedback(null);
    const result = await createReceptionClient({
      fullName: String(formData.get("fullName") ?? ""),
      email: String(formData.get("email") ?? ""),
      temporaryPassword: String(formData.get("temporaryPassword") ?? ""),
    });
    setBusy(false);
    if (result.error) {
      setFeedback({ ok: false, text: result.error });
      return;
    }
    setShowCreateUser(false);
    setFeedback({
      ok: true,
      text: "Cuenta creada. Entrega la contraseña temporal al cliente de forma segura.",
    });
    form.reset();
    await loadData();
  }

  async function handleAttendance(client: ReceptionUser) {
    setBusy(true);
    setFeedback(null);
    const result = await registerReceptionAttendance(client.id);
    setBusy(false);
    if (result.error) {
      setFeedback({ ok: false, text: result.error });
      return;
    }
    setFeedback({
      ok: true,
      text: `Asistencia registrada para ${client.full_name || client.email}.`,
    });
    await loadData();
  }

  const userById = useMemo(
    () => new Map((data?.users ?? []).map((user) => [user.id, user])),
    [data],
  );

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-zinc-900">
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-8">
          <a href="#inicio" className="flex items-center gap-2">
            <Image
              src="/logorecojido.svg"
              alt=""
              width={34}
              height={34}
              className="size-[34px]"
            />
            <span className="font-semibold tracking-tight">VibeFit</span>
            <span className="hidden rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-medium text-zinc-600 sm:inline-flex">
              Recepción
            </span>
          </a>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">{receptionistName || "Recepción"}</p>
              <p className="text-xs text-zinc-500">Panel de recepción</p>
            </div>
            <div className="relative">
              <button
                type="button"
                aria-label={`Preinscripciones pendientes: ${pendingUsers.length}`}
                aria-expanded={showNotifications}
                onClick={() => setShowNotifications((open) => !open)}
                className="relative flex size-11 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 transition hover:bg-zinc-50"
              >
                <BellIcon className="size-5" />
                {pendingUsers.length > 0 && (
                  <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-semibold text-white ring-2 ring-white">
                    {pendingUsers.length > 99 ? "99+" : pendingUsers.length}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 top-full z-50 mt-3 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_16px_48px_rgba(24,24,27,0.16)]">
                  <div className="border-b border-zinc-100 px-5 py-4">
                    <h2 className="text-sm font-semibold">Preinscripciones pendientes</h2>
                    <p className="mt-1 text-xs text-zinc-500">
                      Selecciona un cliente para asignarle su plan.
                    </p>
                  </div>
                  {pendingUsers.length ? (
                    <ul className="max-h-80 divide-y divide-zinc-100 overflow-y-auto">
                      {pendingUsers.map((user) => (
                        <li key={user.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setPendingClient(user);
                              setSelectedPlanId(data?.plans[0]?.id ?? "");
                              setShowNotifications(false);
                            }}
                            className="w-full px-5 py-3.5 text-left transition hover:bg-zinc-50"
                          >
                            <span className="block truncate text-sm font-medium text-zinc-900">
                              {user.full_name?.trim() || "Nombre pendiente"}
                            </span>
                            <span className="mt-0.5 block truncate text-xs text-zinc-500">
                              {user.email}
                            </span>
                            <span className="mt-1 block text-[11px] text-zinc-400">
                              Preinscripción · {formatBogotaDateTime(user.created_at)}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="px-5 py-7 text-center text-sm text-zinc-500">
                      No hay preinscripciones pendientes.
                    </p>
                  )}
                </div>
              )}
            </div>
            <form action={logout}>
              <button
                type="submit"
                className="rounded-xl border border-zinc-200 px-3 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
              >
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>

      <div id="inicio" className="mx-auto max-w-[1440px] px-4 py-8 sm:px-8 sm:py-10">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              {data ? formatBogotaDate(data.today) : "Panel de control"}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Hola{receptionistName ? `, ${receptionistName.split(" ")[0]}` : ""}
            </h1>
            <p className="mt-2 text-sm text-zinc-500">
              Gestiona preinscripciones, membresías y asistencia desde un solo lugar.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setFeedback(null);
              setShowCreateUser(true);
            }}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-zinc-950 px-5 text-sm font-medium text-white transition hover:bg-zinc-800"
          >
            + Registrar usuario
          </button>
        </div>

        {feedback && (
          <p
            role={feedback.ok ? "status" : "alert"}
            className={`mt-6 rounded-xl px-4 py-3 text-sm ${
              feedback.ok
                ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {feedback.text}
          </p>
        )}
        {loadError && (
          <p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {loadError}
          </p>
        )}

        <section aria-labelledby="statistics-title" className="mt-8">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700">
              <PieChartIcon className="size-5" />
            </div>
            <div>
              <h2 id="statistics-title" className="text-base font-semibold">
                Estado de clientes
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Resumen de membresías y preinscripciones.
              </p>
            </div>
          </div>

          {loading ? (
            <p className="rounded-2xl border border-zinc-200 bg-white py-12 text-center text-sm text-zinc-500">
              Cargando estadísticas…
            </p>
          ) : data ? (
            <div className="grid gap-5 lg:grid-cols-2">
              <MembershipStatusChart
                title="Preinscripciones pendientes"
                description="Clientes que aún no tienen una membresía vigente."
                status="pending"
                total={pendingUsers.length}
                days={membershipStatusDays}
                color="#00c78a"
                fill="rgba(0,199,138,0.18)"
              />
              <MembershipStatusChart
                title="Usuarios inscritos"
                description="Clientes con una membresía vigente."
                status="enrolled"
                total={enrolledUserIds.size}
                days={membershipStatusDays}
                color="#00c78a"
                fill="rgba(0,199,138,0.18)"
              />
            </div>
          ) : null}

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {chartMetrics.map((metric) => (
              <article
                key={metric.label}
                className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
              >
                <p className="text-sm text-zinc-500">{metric.label}</p>
                <p className="mt-3 text-3xl font-semibold tabular-nums tracking-tight">
                  {loading ? "—" : metric.value}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section
          id="preinscripciones"
          className="mt-8 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-orange-50 text-orange-700">
                <UsersIcon className="size-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold">Preinscripciones pendientes</h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Abre un registro para revisar sus datos y asignarle un plan.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowNotifications(true)}
              className="text-sm font-medium text-zinc-700 hover:text-zinc-950"
            >
              Ver campana ({pendingUsers.length})
            </button>
          </div>
          {loading ? (
            <p className="py-8 text-center text-sm text-zinc-500">Cargando clientes…</p>
          ) : pendingUsers.length ? (
            <div className="mt-5 divide-y divide-zinc-100">
              {pendingUsers.slice(0, 8).map((user) => (
                <div
                  key={user.id}
                  className="flex flex-col justify-between gap-3 py-4 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {user.full_name?.trim() || "Nombre pendiente"}
                    </p>
                    <p className="mt-1 truncate text-xs text-zinc-500">{user.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPendingClient(user);
                      setSelectedPlanId(data?.plans[0]?.id ?? "");
                    }}
                    className="shrink-0 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50"
                  >
                    Revisar y asignar plan
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-zinc-500">
              {loadError ? "No se pudieron cargar las preinscripciones." : "No hay preinscripciones pendientes."}
            </p>
          )}
          {pendingUsers.length > 8 && (
            <p className="mt-2 text-center text-xs text-zinc-400">
              Hay {pendingUsers.length - 8} más. Revisa la campana para verlas todas.
            </p>
          )}
        </section>

        <section
          id="usuarios"
          className="mt-8 grid gap-5 lg:grid-cols-2"
        >
          <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                <UsersIcon className="size-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold">Registrar asistencia</h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Solo clientes con membresía vigente.
                </p>
              </div>
            </div>
            <label className="mt-5 block text-xs font-medium text-zinc-600">
              Buscar cliente por nombre o correo
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Ej. María o correo@dominio.com"
                className="mt-2 h-11 w-full rounded-xl border border-zinc-200 px-3 text-sm outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
              />
            </label>
            {search.trim() && (
              <ul className="mt-3 max-h-56 divide-y divide-zinc-100 overflow-y-auto rounded-xl border border-zinc-100">
                {searchResults.length ? (
                  searchResults.map((user) => (
                    <li
                      key={user.id}
                      className="flex items-center justify-between gap-3 px-3 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {user.full_name || "Nombre pendiente"}
                        </p>
                        <p className="truncate text-xs text-zinc-500">{user.email}</p>
                      </div>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void handleAttendance(user)}
                        className="shrink-0 rounded-lg bg-zinc-900 px-3 py-2 text-xs font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
                      >
                        Registrar
                      </button>
                    </li>
                  ))
                ) : (
                  <li className="px-3 py-5 text-center text-sm text-zinc-500">
                    No hay clientes activos que coincidan.
                  </li>
                )}
              </ul>
            )}
          </article>

          <article id="asistencia" className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <CalendarIcon className="size-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold">Asistencias de hoy</h2>
                <p className="mt-1 text-sm text-zinc-500">
                  {data ? formatBogotaDate(data.today) : "Hora de Colombia"}
                </p>
              </div>
            </div>
            {data?.attendance.length ? (
              <ul className="mt-5 max-h-72 divide-y divide-zinc-100 overflow-y-auto">
                {data.attendance.map((attendance) => {
                  const client = userById.get(attendance.client_user_id);
                  return (
                    <li
                      key={attendance.id}
                      className="flex items-center justify-between gap-3 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {client?.full_name || client?.email || "Cliente"}
                        </p>
                        {client?.full_name && (
                          <p className="truncate text-xs text-zinc-500">{client.email}</p>
                        )}
                      </div>
                      <time
                        className="shrink-0 text-xs tabular-nums text-zinc-500"
                        dateTime={attendance.attended_at}
                      >
                        {new Date(attendance.attended_at).toLocaleTimeString("es-CO", {
                          timeZone: "America/Bogota",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </time>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="py-8 text-center text-sm text-zinc-500">
                {loading ? "Cargando asistencias…" : "Aún no hay asistencias registradas hoy."}
              </p>
            )}
          </article>
        </section>

        <section id="planes" className="mt-8 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700">
              <TableIcon className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Planes disponibles</h2>
              <p className="mt-1 text-sm text-zinc-500">
                El plan se activa cuando recepción completa la asignación.
              </p>
            </div>
          </div>
          {data?.plans.length ? (
            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {data.plans.map((plan) => (
                <article key={plan.id} className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4">
                  <p className="font-medium">{plan.plan_name}</p>
                  <p className="mt-2 text-xl font-semibold">${Number(plan.price).toLocaleString("es-CO")}</p>
                  <p className="mt-1 text-xs text-zinc-500">{plan.duration_in_days} días</p>
                </article>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-zinc-500">
              {loading ? "Cargando planes…" : "No hay planes disponibles. Crea uno antes de asignar membresías."}
            </p>
          )}
        </section>
      </div>

      {pendingClient && (
        <Modal
          title="Asignar plan de membresía"
          description="Revisa los datos de preinscripción y elige el plan para activar la membresía."
          onClose={() => {
            if (!busy) {
              setPendingClient(null);
              setFeedback(null);
            }
          }}
        >
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-sm font-semibold text-zinc-900">
              {pendingClient.full_name?.trim() || "Nombre pendiente"}
            </p>
            <p className="mt-1 break-all text-sm text-zinc-500">{pendingClient.email}</p>
            <p className="mt-2 text-xs text-zinc-400">
              Se preinscribió el {formatBogotaDateTime(pendingClient.created_at)}
            </p>
          </div>
          <form onSubmit={handleAssignMembership} className="mt-5 space-y-4">
            <label className="block text-sm font-medium text-zinc-700">
              Plan
              <select
                value={selectedPlanId}
                onChange={(event) => setSelectedPlanId(event.target.value)}
                required
                disabled={!data?.plans.length || busy}
                className="mt-2 h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
              >
                {!data?.plans.length && <option value="">No hay planes disponibles</option>}
                {data?.plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.plan_name} · ${Number(plan.price).toLocaleString("es-CO")} ·{" "}
                    {plan.duration_in_days} días
                  </option>
                ))}
              </select>
            </label>
            <div className="rounded-xl bg-zinc-50 px-4 py-3 text-xs leading-5 text-zinc-700">
              La membresía iniciará hoy ({data ? formatBogotaDate(data.today) : "hora Colombia"}) y
              se activará al guardar.
            </div>
            {feedback && !feedback.ok && (
              <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
                {feedback.text}
              </p>
            )}
            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={busy}
                onClick={() => setPendingClient(null)}
                className="h-11 rounded-xl border border-zinc-200 px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={busy || !data?.plans.length}
                className="h-11 rounded-xl bg-zinc-950 px-5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
              >
                {busy ? "Asignando…" : "Asignar y activar plan"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showCreateUser && (
        <Modal
          title="Registrar nuevo usuario"
          description="Crea una cuenta de cliente con una contraseña temporal para entregar en recepción."
          onClose={() => {
            if (!busy) {
              setShowCreateUser(false);
              setFeedback(null);
            }
          }}
        >
          <form onSubmit={handleCreateClient} className="space-y-4">
            <label className="block text-sm font-medium text-zinc-700">
              Nombre completo
              <input
                name="fullName"
                required
                autoComplete="name"
                className="mt-2 h-11 w-full rounded-xl border border-zinc-200 px-3 text-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
              />
            </label>
            <label className="block text-sm font-medium text-zinc-700">
              Correo electrónico
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                className="mt-2 h-11 w-full rounded-xl border border-zinc-200 px-3 text-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
              />
            </label>
            <label className="block text-sm font-medium text-zinc-700">
              Contraseña temporal
              <input
                name="temporaryPassword"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className="mt-2 h-11 w-full rounded-xl border border-zinc-200 px-3 text-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
              />
              <span className="mt-1 block text-xs font-normal text-zinc-500">
                Mínimo 8 caracteres. Entrégala al cliente de forma segura.
              </span>
            </label>
            {feedback && !feedback.ok && (
              <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
                {feedback.text}
              </p>
            )}
            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={busy}
                onClick={() => setShowCreateUser(false)}
                className="h-11 rounded-xl border border-zinc-200 px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={busy}
                className="h-11 rounded-xl bg-zinc-950 px-5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
              >
                {busy ? "Creando cuenta…" : "Crear cuenta"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </main>
  );
}

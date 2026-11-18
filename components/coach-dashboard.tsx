"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  assignRoutineToClient,
  finishRoutineAssignment,
  getCoachDashboardData,
  saveCoachRoutine,
} from "@/app/actions/coach";
import { logout } from "@/app/actions/auth";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { CreatingAnimation } from "@/components/creating-animation";
import {
  DashboardLoadingOverlay,
  DashboardMascot,
} from "@/components/dashboard-experience";
import {
  MenuTwoIcon,
  TableIcon,
  UsersIcon,
  XIcon,
} from "@/components/dashboard-icons";
import { AnimatedIcon } from "@/components/animated-icon";

type RoutineDayForm = {
  dayNumber: number;
  title: string;
  exercisesDetails: string;
};

type Feedback = {
  ok: boolean;
  text: string;
};

const navigation = [
  { label: "Mis clientes", href: "#clientes", icon: UsersIcon },
  { label: "Rutinas", href: "#rutinas", icon: TableIcon },
];

const emptyRoutineDay: RoutineDayForm = {
  dayNumber: 1,
  title: "Día 1",
  exercisesDetails: "",
};

export function CoachDashboard({
  coachName,
  coachEmail,
}: {
  coachName: string | null;
  coachEmail: string;
}) {
  const [data, setData] = useState<
    Awaited<ReturnType<typeof getCoachDashboardData>>["data"]
  >(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("resumen");
  const [routineId, setRoutineId] = useState("");
  const [clientId, setClientId] = useState("");
  const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null);
  const [routineTitle, setRoutineTitle] = useState("");
  const [routineDescription, setRoutineDescription] = useState("");
  const [routineDays, setRoutineDays] = useState<RoutineDayForm[]>([
    emptyRoutineDay,
  ]);

  const isExpanded = !collapsed || hovered;
  const currentSection =
    activeSection === "clientes"
      ? "Mis clientes"
      : activeSection === "rutinas"
        ? "Rutinas"
        : "Resumen";

  const loadData = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    setLoadError(null);
    try {
      const result = await getCoachDashboardData();
      if (result.error || !result.data) {
        setLoadError(result.error ?? "No se pudieron cargar los datos.");
        setData(null);
      } else {
        const dashboardData = result.data;
        setData(dashboardData);
        setClientId((current) =>
          dashboardData.clients.some(({ id }) => id === current)
            ? current
            : (dashboardData.clients[0]?.id ?? ""),
        );
        setRoutineId((current) =>
          dashboardData.routines.some(({ id }) => id === current)
            ? current
            : (dashboardData.routines[0]?.id ?? ""),
        );
      }
    } catch (error) {
      console.error("Could not request coach dashboard data.", error);
      setLoadError("No se pudieron cargar los datos. Intenta de nuevo.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadData(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadData]);

  useEffect(() => {
    function syncSectionFromHash() {
      const sectionId = window.location.hash.slice(1);
      if (["resumen", "clientes", "rutinas"].includes(sectionId)) {
        setActiveSection(sectionId);
      }
    }
    syncSectionFromHash();
    window.addEventListener("hashchange", syncSectionFromHash);
    window.addEventListener("popstate", syncSectionFromHash);
    return () => {
      window.removeEventListener("hashchange", syncSectionFromHash);
      window.removeEventListener("popstate", syncSectionFromHash);
    };
  }, []);

  const clients = data?.clients ?? [];
  const routines = data?.routines ?? [];
  const activeRoutines = clients.filter(({ activeRoutine }) => activeRoutine).length;

  function navigateToSection(href: string) {
    const sectionId = href.slice(1);
    if (!["resumen", "clientes", "rutinas"].includes(sectionId)) return;
    setActiveSection(sectionId);
    window.history.pushState(null, "", href);
    setMobileOpen(false);
  }

  function toggleSidebar() {
    if (window.matchMedia("(min-width: 1024px)").matches) {
      setCollapsed((value) => !value);
      return;
    }
    setMobileOpen((value) => !value);
  }

  function resetRoutineForm() {
    setEditingRoutineId(null);
    setRoutineTitle("");
    setRoutineDescription("");
    setRoutineDays([emptyRoutineDay]);
  }

  function editRoutine(routine: NonNullable<typeof data>["routines"][number]) {
    setEditingRoutineId(routine.id);
    setRoutineTitle(routine.routine_title);
    setRoutineDescription(routine.routine_description ?? "");
    setRoutineDays(
      routine.days.map((day) => ({
        dayNumber: day.day_number,
        title: day.day_title,
        exercisesDetails: day.exercises_details,
      })),
    );
    setActiveSection("rutinas");
    window.history.pushState(null, "", "#rutinas");
  }

  function updateRoutineDay(
    index: number,
    field: keyof RoutineDayForm,
    value: string,
  ) {
    setRoutineDays((days) =>
      days.map((day, dayIndex) =>
        dayIndex === index
          ? {
              ...day,
              [field]: field === "dayNumber" ? Number(value) : value,
            }
          : day,
      ),
    );
  }

  async function handleSaveRoutine(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setFeedback(null);
    try {
      const result = await saveCoachRoutine({
        routineId: editingRoutineId ?? undefined,
        title: routineTitle,
        description: routineDescription,
        days: routineDays,
      });
      if (result.error) {
        setFeedback({ ok: false, text: result.error });
        return;
      }

      setFeedback({
        ok: true,
        text: editingRoutineId ? "Rutina actualizada." : "Rutina creada.",
      });
      resetRoutineForm();
      await loadData();
    } catch (error) {
      console.error("Could not save coach routine.", error);
      setFeedback({
        ok: false,
        text: "No se pudo guardar la rutina. Intenta de nuevo.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleAssignRoutine(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setFeedback(null);
    try {
      const result = await assignRoutineToClient({ routineId, clientId });
      if (result.error) {
        setFeedback({ ok: false, text: result.error });
        return;
      }
      setFeedback({ ok: true, text: "Rutina asignada correctamente." });
      await loadData();
    } catch (error) {
      console.error("Could not assign coach routine.", error);
      setFeedback({
        ok: false,
        text: "No se pudo asignar la rutina. Intenta de nuevo.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleFinishAssignment(assignmentId: string) {
    setBusy(true);
    setFeedback(null);
    try {
      const result = await finishRoutineAssignment(assignmentId);
      if (result.error) {
        setFeedback({ ok: false, text: result.error });
        return;
      }
      setFeedback({ ok: true, text: "Rutina finalizada." });
      await loadData();
    } catch (error) {
      console.error("Could not finish coach routine.", error);
      setFeedback({
        ok: false,
        text: "No se pudo finalizar la rutina. Intenta de nuevo.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f8fa] text-zinc-900">
      <DashboardLoadingOverlay ready={!loading} />
      <DashboardMascot />
      <DashboardSidebar
        items={navigation}
        activeSection={activeSection}
        footerLabel="Panel de coach"
        expanded={isExpanded}
        mobileOpen={mobileOpen}
        onNavigate={navigateToSection}
        onMobileOpenChange={setMobileOpen}
        onHoverChange={(value) => {
          if (window.matchMedia("(min-width: 1024px)").matches && collapsed) {
            setHovered(value);
          }
        }}
      />

      <div
        className={`min-h-screen transition-[padding] duration-500 ease-in-out ${
          isExpanded ? "lg:pl-[18.125rem]" : "lg:pl-[5.625rem]"
        }`}
      >
        <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-zinc-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={toggleSidebar}
              aria-label={mobileOpen ? "Cerrar menú" : "Abrir o contraer menú"}
              className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 text-zinc-600 transition hover:bg-zinc-50 sm:size-12"
            >
              <AnimatedIcon className="size-5">
                {mobileOpen ? (
                  <XIcon className="size-5" />
                ) : (
                  <MenuTwoIcon className="size-5" />
                )}
              </AnimatedIcon>
            </button>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-zinc-900">
                {currentSection}
              </p>
              <p className="hidden truncate text-xs text-zinc-500 sm:block">
                {coachName || coachEmail}
              </p>
            </div>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-xl border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
            >
              Cerrar sesión
            </button>
          </form>
        </header>

        <main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {loadError && (
            <div
              role="alert"
              className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            >
              <span>{loadError}</span>
              <button
                type="button"
                onClick={() => void loadData(true)}
                className="rounded-lg border border-red-200 px-3 py-1.5 font-medium hover:bg-red-100"
              >
                Reintentar
              </button>
            </div>
          )}

          {feedback && (
            <p
              role={feedback.ok ? "status" : "alert"}
              className={`mb-5 rounded-xl px-4 py-3 text-sm ${
                feedback.ok
                  ? "bg-emerald-50 text-emerald-800"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {feedback.text}
            </p>
          )}

          <div id="resumen" hidden={activeSection !== "resumen"}>
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                VibeFit / Coaching
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
                Bienvenido, {coachName?.trim() || "coach"}
              </h1>
              <p className="mt-1 text-sm text-zinc-500">
                Acompaña el progreso de tus clientes y organiza sus rutinas.
              </p>
            </div>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(430px,550px)]">
              <section className="flex flex-col justify-center rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                  Tu equipo
                </p>
                <h2 className="mt-3 max-w-xl text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
                  Entrena con propósito. Avanza con constancia.
                </h2>
                <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-600">
                  Revisa a tus clientes, crea sus rutinas y acompaña cada etapa
                  de su entrenamiento desde un solo lugar.
                </p>
                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  {[
                    { label: "Mis clientes", value: clients.length },
                    { label: "Rutinas activas", value: activeRoutines },
                    { label: "Rutinas creadas", value: routines.length },
                  ].map((item) => (
                    <article
                      key={item.label}
                      className="rounded-xl border border-zinc-200 bg-zinc-50 p-4"
                    >
                      <p className="text-xs text-zinc-500">{item.label}</p>
                      <p className="mt-2 text-2xl font-semibold text-zinc-950">
                        {item.value}
                      </p>
                    </article>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => navigateToSection("#clientes")}
                  className="mt-6 w-fit rounded-xl bg-zinc-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-zinc-800"
                >
                  Ver mis clientes
                </button>
              </section>
              <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
                <CreatingAnimation />
              </div>
            </div>
          </div>

          <section
            id="clientes"
            hidden={activeSection !== "clientes"}
            className="scroll-mt-24"
          >
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                VibeFit / Coaching
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
                Mis clientes
              </h1>
              <p className="mt-1 text-sm text-zinc-500">
                Clientes asignados a tu equipo y su rutina actual.
              </p>
            </div>
            {!clients.length && !loadError ? (
              <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center">
                <h2 className="text-lg font-semibold text-zinc-900">
                  Aún no tienes clientes asignados
                </h2>
                <p className="mt-2 text-sm text-zinc-500">
                  Cuando el gerente te asigne clientes, aparecerán aquí.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {clients.map((client) => {
                  const activeRoutine = client.activeRoutine;
                  return (
                    <article
                      key={client.id}
                      className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h2 className="truncate font-semibold text-zinc-900">
                            {client.full_name?.trim() || "Cliente"}
                          </h2>
                          <p className="mt-1 truncate text-sm text-zinc-500">
                            {client.email}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                            activeRoutine
                              ? "bg-emerald-50 text-emerald-800"
                              : "bg-zinc-100 text-zinc-600"
                          }`}
                        >
                          {activeRoutine
                            ? "Rutina activa"
                            : "Sin rutina activa"}
                        </span>
                      </div>
                      {activeRoutine && (
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-zinc-50 p-4">
                          <div>
                            <p className="text-sm font-medium text-zinc-800">
                              {activeRoutine.title}
                            </p>
                            <p className="mt-1 text-xs text-zinc-500">
                              Inició{" "}
                              {new Date(
                                `${activeRoutine.startDate}T12:00:00-05:00`,
                              ).toLocaleDateString("es-CO", {
                                timeZone: "America/Bogota",
                                dateStyle: "long",
                              })}
                            </p>
                          </div>
                          {activeRoutine.canFinish && (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                void handleFinishAssignment(
                                  activeRoutine.assignmentId,
                                )
                              }
                              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50"
                            >
                              Finalizar rutina
                            </button>
                          )}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <section
            id="rutinas"
            hidden={activeSection !== "rutinas"}
            className="scroll-mt-24"
          >
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                VibeFit / Coaching
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
                Rutinas
              </h1>
              <p className="mt-1 text-sm text-zinc-500">
                Crea y actualiza rutinas, y asígnalas a tus clientes.
              </p>
            </div>

            <form
              onSubmit={handleAssignRoutine}
              className="mb-6 grid gap-4 rounded-2xl border border-zinc-200 bg-white p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
            >
              <label className="text-sm font-medium text-zinc-700">
                Rutina
                <select
                  value={routineId}
                  onChange={(event) => setRoutineId(event.target.value)}
                  className="mt-1.5 h-11 w-full rounded-lg border border-zinc-200 bg-white px-3"
                  required
                  disabled={!routines.length}
                >
                  <option value="">Selecciona una rutina</option>
                  {routines.map((routine) => (
                    <option key={routine.id} value={routine.id}>
                      {routine.routine_title}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium text-zinc-700">
                Cliente
                <select
                  value={clientId}
                  onChange={(event) => setClientId(event.target.value)}
                  className="mt-1.5 h-11 w-full rounded-lg border border-zinc-200 bg-white px-3"
                  required
                  disabled={!clients.length}
                >
                  <option value="">Selecciona un cliente</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.full_name?.trim() || client.email}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="submit"
                disabled={busy || !routines.length || !clients.length}
                className="h-11 rounded-xl bg-zinc-950 px-5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Asignar rutina
              </button>
            </form>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.8fr)]">
              <form
                onSubmit={handleSaveRoutine}
                className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-zinc-900">
                      {editingRoutineId ? "Editar rutina" : "Crear rutina"}
                    </h2>
                    <p className="mt-1 text-sm text-zinc-500">
                      Agrega entre uno y siete días, sin repetir números.
                    </p>
                  </div>
                  {editingRoutineId && (
                    <button
                      type="button"
                      onClick={resetRoutineForm}
                      className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                    >
                      Cancelar edición
                    </button>
                  )}
                </div>
                <label className="mt-5 block text-sm font-medium text-zinc-700">
                  Título
                  <input
                    value={routineTitle}
                    onChange={(event) => setRoutineTitle(event.target.value)}
                    required
                    maxLength={120}
                    className="mt-1.5 h-11 w-full rounded-lg border border-zinc-200 px-3"
                  />
                </label>
                <label className="mt-4 block text-sm font-medium text-zinc-700">
                  Descripción (opcional)
                  <textarea
                    value={routineDescription}
                    onChange={(event) =>
                      setRoutineDescription(event.target.value)
                    }
                    rows={3}
                    className="mt-1.5 w-full rounded-lg border border-zinc-200 px-3 py-2"
                  />
                </label>

                <div className="mt-5 space-y-4">
                  {routineDays.map((day, index) => (
                    <fieldset
                      key={index}
                      className="rounded-xl border border-zinc-200 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <legend className="text-sm font-semibold text-zinc-800">
                          Día {index + 1}
                        </legend>
                        {routineDays.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setRoutineDays((days) =>
                                days.filter((_, dayIndex) => dayIndex !== index),
                              )
                            }
                            className="text-xs font-medium text-zinc-500 hover:text-red-700"
                          >
                            Quitar día
                          </button>
                        )}
                      </div>
                      <div className="mt-3 grid gap-3 sm:grid-cols-[120px_1fr]">
                        <label className="text-xs font-medium text-zinc-600">
                          Número
                          <select
                            value={day.dayNumber}
                            onChange={(event) =>
                              updateRoutineDay(index, "dayNumber", event.target.value)
                            }
                            className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-2 text-sm"
                          >
                            {Array.from({ length: 7 }, (_, dayIndex) => (
                              <option key={dayIndex + 1} value={dayIndex + 1}>
                                {dayIndex + 1}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="text-xs font-medium text-zinc-600">
                          Título del día
                          <input
                            value={day.title}
                            onChange={(event) =>
                              updateRoutineDay(index, "title", event.target.value)
                            }
                            required
                            className="mt-1 h-10 w-full rounded-lg border border-zinc-200 px-3 text-sm"
                          />
                        </label>
                      </div>
                      <label className="mt-3 block text-xs font-medium text-zinc-600">
                        Ejercicios
                        <textarea
                          value={day.exercisesDetails}
                          onChange={(event) =>
                            updateRoutineDay(
                              index,
                              "exercisesDetails",
                              event.target.value,
                            )
                          }
                          required
                          rows={3}
                          className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                        />
                      </label>
                    </fieldset>
                  ))}
                </div>
                {routineDays.length < 7 && (
                  <button
                    type="button"
                    onClick={() =>
                      setRoutineDays((days) => {
                        const dayNumber =
                          Array.from({ length: 7 }, (_, index) => index + 1).find(
                            (number) =>
                              !days.some((day) => day.dayNumber === number),
                          ) ?? 1;
                        return [
                          ...days,
                          {
                            ...emptyRoutineDay,
                            dayNumber,
                            title: `Día ${dayNumber}`,
                          },
                        ];
                      })
                    }
                    className="mt-4 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                  >
                    Agregar día
                  </button>
                )}
                <button
                  type="submit"
                  disabled={busy}
                  className="mt-5 block h-11 rounded-xl bg-zinc-950 px-5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50"
                >
                  {busy
                    ? "Guardando…"
                    : editingRoutineId
                      ? "Guardar cambios"
                      : "Crear rutina"}
                </button>
              </form>

              <div className="space-y-4">
                {routines.map((routine) => (
                  <article
                    key={routine.id}
                    className="rounded-2xl border border-zinc-200 bg-white p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold text-zinc-900">
                          {routine.routine_title}
                        </h3>
                        {routine.routine_description && (
                          <p className="mt-1 text-sm text-zinc-500">
                            {routine.routine_description}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => editRoutine(routine)}
                        className="shrink-0 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                      >
                        Editar
                      </button>
                    </div>
                    <ol className="mt-4 space-y-3">
                      {routine.days.map((day) => (
                        <li
                          key={day.id}
                          className="rounded-xl bg-zinc-50 p-3"
                        >
                          <p className="text-sm font-medium text-zinc-800">
                            Día {day.day_number}: {day.day_title}
                          </p>
                          <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-zinc-600">
                            {day.exercises_details}
                          </p>
                        </li>
                      ))}
                    </ol>
                  </article>
                ))}
                {!routines.length && (
                  <div className="rounded-2xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500">
                    Todavía no has creado rutinas.
                  </div>
                )}
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { logout } from "@/app/actions/auth";
import {
  createDailyLog,
  getClientDashboardData,
} from "@/app/actions/client";
import { AnimatedIcon } from "@/components/animated-icon";
import {
  DashboardLoadingOverlay,
  DashboardMascot,
} from "@/components/dashboard-experience";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import {
  CalendarIcon,
  MenuTwoIcon,
  PieChartIcon,
  TableIcon,
  UserCircleIcon,
  UsersIcon,
  XIcon,
} from "@/components/dashboard-icons";
import { FitnessAnimation } from "@/components/fitness-animation";
import type {
  ClientDashboardData,
  DailyLog,
} from "@/lib/client-dashboard-data";

const navigation = [
  { label: "Seguimiento diario", href: "#seguimiento", icon: CalendarIcon },
  { label: "Mi rutina", href: "#rutina", icon: TableIcon },
  { label: "Mi alimentación", href: "#alimentacion", icon: UsersIcon },
  { label: "Mi membresía", href: "#membresia", icon: UserCircleIcon },
  { label: "Mi evolución", href: "#evolucion", icon: PieChartIcon },
];

type Feedback = { ok: boolean; text: string };
type DailyLogInput = {
  weightKg: number;
  sleepHours: number;
  caloriesConsumed: number;
  caloriesBurned: number;
};
type ProgressSeries = {
  label: string;
  color: string;
  values: number[];
};
type ProgressPeriod = 7 | 30 | 90 | "2024" | "2025";

function formatBogotaDate(date: string) {
  return new Date(`${date}T12:00:00-05:00`).toLocaleDateString("es-CO", {
    timeZone: "America/Bogota",
    dateStyle: "long",
  });
}

function formatMoney(value: number | null) {
  if (value === null) return "No disponible";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

function addDays(date: string, days: number) {
  const [year, month, day] = date.split("-").map(Number);
  const value = new Date(Date.UTC(year, month - 1, day + days));
  return [
    value.getUTCFullYear(),
    String(value.getUTCMonth() + 1).padStart(2, "0"),
    String(value.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function DailyLogForm({
  today,
  alreadyLogged,
  busy,
  onSave,
}: {
  today: string;
  alreadyLogged: boolean;
  busy: boolean;
  onSave: (values: DailyLogInput) => void;
}) {
  const [weight, setWeight] = useState("");
  const [sleep, setSleep] = useState("");
  const [caloriesConsumed, setCaloriesConsumed] = useState("");
  const [caloriesBurned, setCaloriesBurned] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = {
      weightKg: Number(weight),
      sleepHours: Number(sleep),
      caloriesConsumed: Number(caloriesConsumed),
      caloriesBurned: Number(caloriesBurned),
    };

    if ([weight, sleep, caloriesConsumed, caloriesBurned].some((value) => !value.trim())) {
      setValidationError("Completa todos los campos para guardar tu seguimiento.");
      return;
    }
    if (!Number.isFinite(values.weightKg) || values.weightKg < 20 || values.weightKg > 300) {
      setValidationError("El peso debe estar entre 20 y 300 kg.");
      return;
    }
    if (!Number.isFinite(values.sleepHours) || values.sleepHours < 0 || values.sleepHours > 24) {
      setValidationError("Las horas de sueño deben estar entre 0 y 24.");
      return;
    }
    if (
      !Number.isInteger(values.caloriesConsumed) ||
      values.caloriesConsumed < 0 ||
      !Number.isInteger(values.caloriesBurned) ||
      values.caloriesBurned < 0
    ) {
      setValidationError("Las calorías deben ser números enteros no negativos.");
      return;
    }

    setValidationError(null);
    onSave(values);
  }

  if (alreadyLogged) {
    return (
      <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
        Ya registraste tu seguimiento de hoy
      </p>
    );
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className="grid gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:grid-cols-2 sm:p-6"
    >
      <div className="sm:col-span-2">
        <p className="text-sm font-semibold text-zinc-950">Seguimiento de hoy</p>
        <p className="mt-1 text-sm text-zinc-700">{formatBogotaDate(today)}</p>
      </div>
      <label className="text-sm font-medium text-zinc-800">
        Peso (kg)
        <input
          type="number"
          min="20"
          max="300"
          step="0.1"
          value={weight}
          onChange={(event) => setWeight(event.target.value)}
          required
          disabled={busy}
          className="mt-1.5 h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-100"
        />
      </label>
      <label className="text-sm font-medium text-zinc-800">
        Horas de sueño
        <input
          type="number"
          min="0"
          max="24"
          step="0.1"
          value={sleep}
          onChange={(event) => setSleep(event.target.value)}
          required
          disabled={busy}
          className="mt-1.5 h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-100"
        />
      </label>
      <label className="text-sm font-medium text-zinc-800">
        Calorías consumidas
        <input
          type="number"
          min="0"
          step="1"
          value={caloriesConsumed}
          onChange={(event) => setCaloriesConsumed(event.target.value)}
          required
          disabled={busy}
          className="mt-1.5 h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-100"
        />
      </label>
      <label className="text-sm font-medium text-zinc-800">
        Calorías quemadas
        <input
          type="number"
          min="0"
          step="1"
          value={caloriesBurned}
          onChange={(event) => setCaloriesBurned(event.target.value)}
          required
          disabled={busy}
          className="mt-1.5 h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-100"
        />
      </label>
      {validationError && (
        <p role="alert" className="text-sm text-red-700 sm:col-span-2">
          {validationError}
        </p>
      )}
      <div className="flex justify-end sm:col-span-2">
        <button
          type="submit"
          disabled={busy}
          className="h-11 rounded-xl bg-zinc-950 px-5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50"
        >
          {busy ? "Guardando…" : "Guardar seguimiento"}
        </button>
      </div>
    </form>
  );
}

function ProgressChart({
  logs,
  series,
  label,
  suffix,
  emptyText,
}: {
  logs: DailyLog[];
  series: ProgressSeries[];
  label: string;
  suffix: string;
  emptyText: string;
}) {
  const values = series.flatMap(({ values: currentValues }) => currentValues);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const xStart = 44;
  const xEnd = 700;
  const yTop = 18;
  const yBottom = 148;
  const xAt = (index: number) =>
    logs.length < 2
      ? (xStart + xEnd) / 2
      : xStart + (index * (xEnd - xStart)) / (logs.length - 1);
  const yAt = (value: number) =>
    yBottom - ((value - min) / range) * (yBottom - yTop);

  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
      <h3 className="font-semibold text-zinc-950">{label}</h3>
      {!logs.length ? (
        <p className="py-12 text-center text-sm text-zinc-600">{emptyText}</p>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
            {series.map((item) => (
              <span
                key={item.label}
                className="inline-flex items-center gap-2 text-xs text-zinc-700"
              >
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                {item.label}
              </span>
            ))}
          </div>
          <svg
            role="img"
            aria-label={`Gráfica de ${label.toLocaleLowerCase("es")}`}
            viewBox="0 0 744 190"
            className="mt-3 w-full overflow-visible"
          >
            <title>{label}</title>
            {[0, 1, 2, 3].map((line) => {
              const y = yTop + (line * (yBottom - yTop)) / 3;
              return (
                <line
                  key={line}
                  x1={xStart}
                  x2={xEnd}
                  y1={y}
                  y2={y}
                  stroke="#e4e4e7"
                  strokeDasharray="4 5"
                />
              );
            })}
            {series.map((item) => {
              const points = item.values
                .map((value, index) => `${xAt(index)},${yAt(value)}`)
                .join(" ");
              return (
                <g key={item.label}>
                  <polyline
                    points={points}
                    fill="none"
                    stroke={item.color}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {item.values.map((value, index) => (
                    <circle
                      key={`${item.label}-${logs[index].id}`}
                      cx={xAt(index)}
                      cy={yAt(value)}
                      r="4"
                      fill="white"
                      stroke={item.color}
                      strokeWidth="2"
                    >
                      <title>
                        {formatBogotaDate(logs[index].log_date)}: {value}
                        {suffix}
                      </title>
                    </circle>
                  ))}
                </g>
              );
            })}
            <text x={xStart} y="178" fill="#52525b" fontSize="11">
              {logs[0]?.log_date.slice(5)}
            </text>
            <text x={xEnd} y="178" textAnchor="end" fill="#52525b" fontSize="11">
              {logs.at(-1)?.log_date.slice(5)}
            </text>
          </svg>
          <div className="mt-1 flex justify-end text-xs text-zinc-600">
            Unidad: {suffix || "valor"}
          </div>
        </>
      )}
    </article>
  );
}

export function ClientDashboard({
  clientName,
  clientEmail,
  initialData,
}: {
  clientName: string | null;
  clientEmail: string;
  initialData: ClientDashboardData;
}) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [busy, setBusy] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("resumen");
  const [period, setPeriod] = useState<ProgressPeriod>(30);
  const [alreadyLoggedToday, setAlreadyLoggedToday] = useState(
    initialData.dailyLogs.some(({ log_date }) => log_date === initialData.today),
  );

  const isExpanded = !collapsed || hovered;
  const currentSection =
    activeSection === "seguimiento"
      ? "Seguimiento diario"
      : activeSection === "rutina"
        ? "Mi rutina"
        : activeSection === "alimentacion"
          ? "Mi alimentación"
          : activeSection === "membresia"
            ? "Mi membresía"
            : activeSection === "evolucion"
              ? "Mi evolución"
              : "Resumen";

  const reloadData = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    setLoadError(null);
    try {
      const result = await getClientDashboardData();
      if (result.error || !result.data) {
        setLoadError(result.error ?? "No se pudieron cargar los datos.");
        return false;
      }
      if (!result.data.hasActiveMembership) {
        window.location.assign("/client-dashboard");
        return false;
      }

      setData(result.data);
      setAlreadyLoggedToday(
        result.data.dailyLogs.some(
          ({ log_date }) => log_date === result.data.today,
        ),
      );
      return true;
    } catch (error) {
      console.error("Could not request client dashboard data.", error);
      setLoadError("No se pudieron cargar los datos. Intenta de nuevo.");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    function syncSectionFromHash() {
      const sectionId = window.location.hash.slice(1);
      if (
        [
          "resumen",
          "seguimiento",
          "rutina",
          "alimentacion",
          "membresia",
          "evolucion",
        ].includes(sectionId)
      ) {
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

  const logsOldestFirst = useMemo(
    () => [...data.dailyLogs].sort((a, b) => a.log_date.localeCompare(b.log_date)),
    [data.dailyLogs],
  );
  const periodLogs = logsOldestFirst.filter(
    ({ log_date }) => {
      if (period === "2024" || period === "2025") {
        return log_date.startsWith(period);
      }

      const cutoffDate = addDays(data.today, -(period - 1));
      return log_date >= cutoffDate && log_date <= data.today;
    },
  );

  function navigateToSection(href: string) {
    const sectionId = href.slice(1);
    if (
      ![
        "resumen",
        "seguimiento",
        "rutina",
        "alimentacion",
        "membresia",
        "evolucion",
      ].includes(sectionId)
    ) {
      return;
    }
    setActiveSection(sectionId);
    window.history.pushState(null, "", href);
    setMobileOpen(false);
    setFeedback(null);
  }

  function toggleSidebar() {
    if (window.matchMedia("(min-width: 1024px)").matches) {
      setCollapsed((value) => !value);
      return;
    }
    setMobileOpen((value) => !value);
  }

  async function handleSaveDailyLog(values: DailyLogInput) {
    setBusy(true);
    setFeedback(null);
    try {
      const result = await createDailyLog(values);
      if (result.error) {
        setFeedback({ ok: false, text: result.error });
        return;
      }

      setAlreadyLoggedToday(true);
      setFeedback({ ok: true, text: "Seguimiento diario guardado." });
      await reloadData();
    } catch (error) {
      console.error("Could not save client daily log.", error);
      setFeedback({
        ok: false,
        text: "No se pudo guardar el seguimiento. Intenta de nuevo.",
      });
    } finally {
      setBusy(false);
    }
  }

  const clientLabel = clientName?.trim() || "cliente";

  return (
    <div className="min-h-screen bg-[#f7f8fa] text-zinc-900">
      <DashboardLoadingOverlay ready={!loading} />
      <DashboardMascot />
      <DashboardSidebar
        items={navigation}
        activeSection={activeSection}
        footerLabel="Panel de cliente"
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
              <p className="truncate text-sm font-semibold text-zinc-950">
                {currentSection}
              </p>
              <p className="hidden truncate text-xs text-zinc-600 sm:block">
                {clientName || clientEmail}
              </p>
            </div>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-xl border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
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
                onClick={() => void reloadData(true)}
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

          <section id="resumen" hidden={activeSection !== "resumen"}>
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-600">
                VibeFit / Mi espacio
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
                Bienvenido, {clientLabel}
              </h1>
              <p className="mt-1 text-sm text-zinc-700">
                Tu actividad, rutina y progreso en un solo lugar.
              </p>
            </div>
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(400px,520px)]">
              <section className="flex flex-col justify-center rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-600">
                  Tu progreso
                </p>
                <h2 className="mt-3 max-w-xl text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
                  Cada día cuenta. Sigue avanzando.
                </h2>
                <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-700">
                  Revisa tu plan, registra tus hábitos y mira cómo evoluciona tu entrenamiento.
                </p>
                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  {[
                    {
                      label: "Peso más reciente",
                      value: data.dailyLogs[0]
                        ? `${data.dailyLogs[0].weight_kg} kg`
                        : "Sin registro",
                    },
                    {
                      label: "Rutina",
                      value: data.routine ? "Asignada" : "Pendiente",
                    },
                    {
                      label: "Alimentación",
                      value: data.mealPlan ? "Plan activo" : "Sin plan",
                    },
                  ].map((item) => (
                    <article
                      key={item.label}
                      className="rounded-xl border border-zinc-200 bg-zinc-50 p-4"
                    >
                      <p className="text-xs text-zinc-600">{item.label}</p>
                      <p className="mt-2 text-lg font-semibold text-zinc-950">
                        {item.value}
                      </p>
                    </article>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => navigateToSection("#seguimiento")}
                  className="mt-6 w-fit rounded-xl bg-zinc-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-zinc-800"
                >
                  Registrar seguimiento
                </button>
              </section>
              <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
                <FitnessAnimation className="h-full" />
              </div>
            </div>
          </section>

          <section
            id="seguimiento"
            hidden={activeSection !== "seguimiento"}
            className="scroll-mt-24"
          >
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-600">
                VibeFit / Mi progreso
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
                Seguimiento diario
              </h1>
              <p className="mt-1 text-sm text-zinc-700">
                Registra una vez al día tus medidas y actividad.
              </p>
            </div>
            <DailyLogForm
              key={alreadyLoggedToday ? "logged-today" : "new-log"}
              today={data.today}
              alreadyLogged={alreadyLoggedToday}
              busy={busy}
              onSave={(values) => void handleSaveDailyLog(values)}
            />
            <div className="mt-8">
              <h2 className="mb-4 text-lg font-semibold text-zinc-950">
                Tus registros
              </h2>
              {!data.dailyLogs.length ? (
                <p className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-700">
                  Aún no tienes seguimientos guardados.
                </p>
              ) : (
                <div className="space-y-3">
                  {data.dailyLogs.map((log) => (
                    <article
                      key={log.id}
                      className="grid gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:grid-cols-5 sm:items-center"
                    >
                      <p className="font-medium text-zinc-950">
                        {formatBogotaDate(log.log_date)}
                      </p>
                      <p className="text-sm text-zinc-700">
                        Peso: <strong>{log.weight_kg} kg</strong>
                      </p>
                      <p className="text-sm text-zinc-700">
                        Sueño: <strong>{log.sleep_hours} h</strong>
                      </p>
                      <p className="text-sm text-zinc-700">
                        Consumidas: <strong>{log.calories_consumed} kcal</strong>
                      </p>
                      <p className="text-sm text-zinc-700">
                        Quemadas: <strong>{log.calories_burned} kcal</strong>
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section
            id="rutina"
            hidden={activeSection !== "rutina"}
            className="scroll-mt-24"
          >
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-600">
                VibeFit / Entrenamiento
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
                Mi rutina
              </h1>
            </div>
            {data.routine ? (
              <div className="space-y-5">
                <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
                  <h2 className="text-xl font-semibold text-zinc-950">
                    {data.routine.routine_title}
                  </h2>
                  {data.routine.routine_description && (
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-700">
                      {data.routine.routine_description}
                    </p>
                  )}
                </article>
                <div className="grid gap-4 lg:grid-cols-2">
                  {data.routine.days.map((day) => (
                    <article
                      key={day.id}
                      className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-600">
                        Día {day.day_number}
                      </p>
                      <h3 className="mt-2 font-semibold text-zinc-950">
                        {day.day_title}
                      </h3>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-700">
                        {day.exercises_details}
                      </p>
                    </article>
                  ))}
                </div>
              </div>
            ) : (
              <p className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-700">
                Tu coach aún no te asignó una rutina
              </p>
            )}
          </section>

          <section
            id="alimentacion"
            hidden={activeSection !== "alimentacion"}
            className="scroll-mt-24"
          >
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-600">
                VibeFit / Nutrición
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
                Mi alimentación
              </h1>
            </div>
            {data.mealPlan ? (
              <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-600">
                      Plan activo
                    </p>
                    <p className="mt-2 text-sm text-zinc-700">
                      Nutricionista:{" "}
                      <strong className="text-zinc-950">
                        {data.mealPlan.nutritionist_name || "No disponible"}
                      </strong>
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
                    Activo
                  </span>
                </div>
                <p className="mt-4 whitespace-pre-wrap rounded-xl bg-zinc-50 p-4 text-sm leading-6 text-zinc-800">
                  {data.mealPlan.plan_details}
                </p>
                <p className="mt-4 text-xs text-zinc-700">
                  Inicio: {formatBogotaDate(data.mealPlan.start_date)} · Fin:{" "}
                  {data.mealPlan.end_date
                    ? formatBogotaDate(data.mealPlan.end_date)
                    : "Sin fecha de fin"}
                </p>
              </article>
            ) : (
              <p className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-700">
                Aún no tienes un plan de alimentación
              </p>
            )}
          </section>

          <section
            id="membresia"
            hidden={activeSection !== "membresia"}
            className="scroll-mt-24"
          >
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-600">
                VibeFit / Mi cuenta
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
                Mi membresía
              </h1>
            </div>
            {data.membership ? (
              <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <h2 className="text-xl font-semibold text-zinc-950">
                    {data.membership.plan_name || "Plan de membresía"}
                  </h2>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
                    Activa
                  </span>
                </div>
                <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    ["Costo", formatMoney(data.membership.price)],
                    [
                      "Duración",
                      data.membership.duration_in_days === null
                        ? "No disponible"
                        : `${data.membership.duration_in_days} días`,
                    ],
                    ["Fecha de inicio", formatBogotaDate(data.membership.start_date)],
                    ["Fecha de fin", formatBogotaDate(data.membership.end_date)],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl bg-zinc-50 p-4">
                      <dt className="text-xs text-zinc-600">{label}</dt>
                      <dd className="mt-2 text-sm font-semibold text-zinc-950">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </article>
            ) : (
              <p className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-700">
                No se encontró información de tu membresía activa.
              </p>
            )}
          </section>

          <section
            id="evolucion"
            hidden={activeSection !== "evolucion"}
            className="scroll-mt-24"
          >
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-600">
                  VibeFit / Mi progreso
                </p>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
                  Mi evolución
                </h1>
                <p className="mt-1 text-sm text-zinc-700">
                  Observa tus registros diarios a lo largo del tiempo.
                </p>
              </div>
              <label className="text-sm font-medium text-zinc-800">
                Periodo
                <select
                  value={period}
                  onChange={(event) => {
                    const value = event.target.value;
                    if (value === "2024" || value === "2025") {
                      setPeriod(value);
                    } else if (value === "7") {
                      setPeriod(7);
                    } else if (value === "30") {
                      setPeriod(30);
                    } else if (value === "90") {
                      setPeriod(90);
                    }
                  }}
                  className="mt-1 block h-10 rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-950"
                >
                  <option value={7}>Últimos 7 días</option>
                  <option value={30}>Últimos 30 días</option>
                  <option value={90}>Últimos 90 días</option>
                  <option value="2024">Año 2024</option>
                  <option value="2025">Año 2025</option>
                </select>
              </label>
            </div>
            {!data.dailyLogs.length ? (
              <p className="mb-5 rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-700">
                Guarda tus seguimientos diarios para ver aquí tu evolución.
              </p>
            ) : (
              <div className="mb-5 grid gap-4 xl:grid-cols-2">
                <ProgressChart
                  logs={periodLogs}
                  series={[
                    {
                      label: "Peso",
                      color: "#18181b",
                      values: periodLogs.map(({ weight_kg }) => weight_kg),
                    },
                  ]}
                  label="Peso"
                  suffix=" kg"
                  emptyText="No hay registros de peso en este periodo."
                />
                <ProgressChart
                  logs={periodLogs}
                  series={[
                    {
                      label: "Consumidas",
                      color: "#7c3aed",
                      values: periodLogs.map(({ calories_consumed }) => calories_consumed),
                    },
                    {
                      label: "Quemadas",
                      color: "#059669",
                      values: periodLogs.map(({ calories_burned }) => calories_burned),
                    },
                  ]}
                  label="Calorías"
                  suffix=" kcal"
                  emptyText="No hay registros de calorías en este periodo."
                />
                <ProgressChart
                  logs={periodLogs}
                  series={[
                    {
                      label: "Sueño",
                      color: "#2563eb",
                      values: periodLogs.map(({ sleep_hours }) => sleep_hours),
                    },
                  ]}
                  label="Horas de sueño"
                  suffix=" h"
                  emptyText="No hay registros de sueño en este periodo."
                />
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

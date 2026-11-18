"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { logout } from "@/app/actions/auth";
import {
  createNutritionistMealPlan,
  finishNutritionistMealPlan,
  getNutritionistDashboardData,
  updateNutritionistMealPlan,
  type NutritionistDashboardData,
  type NutritionistMealPlan,
} from "@/app/actions/nutritionist";
import { AnimatedIcon } from "@/components/animated-icon";
import {
  DashboardLoadingOverlay,
  DashboardMascot,
} from "@/components/dashboard-experience";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import {
  MenuTwoIcon,
  SearchIcon,
  TableIcon,
  UsersIcon,
  XIcon,
} from "@/components/dashboard-icons";
import { LifestyleAnimation } from "@/components/lifestyle-animation";

const navigation = [
  { label: "Clientes", href: "#clientes", icon: UsersIcon },
  {
    label: "Planes de alimentación",
    href: "#planes-alimentacion",
    icon: TableIcon,
  },
];

type Feedback = { ok: boolean; text: string };

function formatBogotaDate(date: string | null) {
  if (!date) return "Sin fecha de fin";
  return new Date(`${date}T12:00:00-05:00`).toLocaleDateString("es-CO", {
    timeZone: "America/Bogota",
    dateStyle: "long",
  });
}

function MealPlanForm({
  clientId,
  clients,
  startDate,
  plan,
  busy,
  onClientChange,
  onStartDateChange,
  onSave,
  onCancel,
}: {
  clientId: string;
  clients: NutritionistDashboardData["clients"];
  startDate: string;
  plan?: NutritionistMealPlan;
  busy: boolean;
  onClientChange?: (value: string) => void;
  onStartDateChange: (value: string) => void;
  onSave: (values: {
    planDetails: string;
    startDate: string;
    endDate: string;
  }) => void;
  onCancel?: () => void;
}) {
  const [planDetails, setPlanDetails] = useState(plan?.plan_details ?? "");
  const [endDate, setEndDate] = useState(plan?.end_date ?? "");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave({ planDetails, startDate, endDate });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6"
    >
      {onClientChange && (
        <label className="text-sm font-medium text-zinc-800">
          Cliente
          <select
            value={clientId}
            onChange={(event) => onClientChange(event.target.value)}
            required
            disabled={!clients.length || busy}
            className="mt-1.5 h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-100"
          >
            <option value="">Selecciona un cliente</option>
            {clients
              .filter(({ hasActiveMealPlan }) => !hasActiveMealPlan)
              .map((client) => (
                <option key={client.id} value={client.id}>
                  {client.full_name?.trim() || client.email} · {client.email}
                </option>
              ))}
          </select>
          {!clients.some(({ hasActiveMealPlan }) => !hasActiveMealPlan) && (
            <span className="mt-1 block text-xs font-normal text-zinc-600">
              Todos los clientes tienen un plan activo.
            </span>
          )}
        </label>
      )}
      <label className="text-sm font-medium text-zinc-800">
        Detalle del plan de alimentación
        <textarea
          value={planDetails}
          onChange={(event) => setPlanDetails(event.target.value)}
          required
          rows={6}
          disabled={busy}
          placeholder="Describe el plan de alimentación..."
          className="mt-1.5 w-full resize-y rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-950 outline-none placeholder:text-zinc-500 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-100"
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-zinc-800">
          Fecha de inicio
          <input
            type="date"
            value={startDate}
            onChange={(event) => onStartDateChange(event.target.value)}
            required
            disabled={busy}
            className="mt-1.5 h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-950"
          />
        </label>
        <label className="text-sm font-medium text-zinc-800">
          Fecha de fin · opcional
          <input
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            min={startDate}
            disabled={busy}
            className="mt-1.5 h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-950"
          />
        </label>
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        {onCancel && (
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="h-10 rounded-xl border border-zinc-300 px-4 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 disabled:opacity-50"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={busy || (Boolean(onClientChange) && !clientId)}
          className="h-10 rounded-xl bg-zinc-950 px-4 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50"
        >
          {busy ? "Guardando…" : plan ? "Guardar cambios" : "Cargar plan"}
        </button>
      </div>
    </form>
  );
}

export function NutritionistDashboard({
  nutritionistName,
  nutritionistEmail,
}: {
  nutritionistName: string | null;
  nutritionistEmail: string;
}) {
  const [data, setData] = useState<NutritionistDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [busy, setBusy] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("resumen");
  const [search, setSearch] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);

  const isExpanded = !collapsed || hovered;
  const currentSection =
    activeSection === "clientes"
      ? "Clientes"
      : activeSection === "planes-alimentacion"
        ? "Planes de alimentación"
        : "Resumen";

  const loadData = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    setLoadError(null);
    try {
      const result = await getNutritionistDashboardData();
      if (result.error || !result.data) {
        setLoadError(result.error ?? "No se pudieron cargar los datos.");
        setData(null);
        return;
      }

      setData(result.data);
      setSelectedClientId((current) =>
        result.data.clients.some(
          ({ id, hasActiveMealPlan }) => id === current && !hasActiveMealPlan,
        )
          ? current
          : (result.data.clients.find(({ hasActiveMealPlan }) => !hasActiveMealPlan)
              ?.id ?? ""),
      );
      setStartDate((current) => current || result.data.today);
    } catch (error) {
      console.error("Could not request nutritionist dashboard data.", error);
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
      if (
        ["resumen", "clientes", "planes-alimentacion"].includes(sectionId)
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

  const clients = useMemo(() => data?.clients ?? [], [data]);
  const plans = data?.plans ?? [];
  const clientsById = useMemo(
    () => new Map(clients.map((client) => [client.id, client])),
    [clients],
  );
  const filteredClients = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("es");
    if (!query) return clients;
    return clients.filter(({ full_name, email }) =>
      `${full_name ?? ""} ${email}`.toLocaleLowerCase("es").includes(query),
    );
  }, [clients, search]);
  const activePlansCount = plans.filter(
    ({ meal_plan_status }) => meal_plan_status === "active",
  ).length;
  const clientsWithoutPlanCount = clients.filter(
    ({ hasActiveMealPlan }) => !hasActiveMealPlan,
  ).length;

  function navigateToSection(href: string) {
    const sectionId = href.slice(1);
    if (
      !["resumen", "clientes", "planes-alimentacion"].includes(sectionId)
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

  function startPlanForClient(clientId: string) {
    setSelectedClientId(clientId);
    setStartDate(data?.today ?? "");
    setEditingPlanId(null);
    setActiveSection("planes-alimentacion");
    window.history.pushState(null, "", "#planes-alimentacion");
  }

  function editPlan(plan: NutritionistMealPlan) {
    setEditingPlanId(plan.id);
    setSelectedClientId(plan.client_user_id);
    setStartDate(plan.start_date);
    setActiveSection("planes-alimentacion");
    window.history.pushState(null, "", "#planes-alimentacion");
  }

  async function handleCreatePlan(
    values: { planDetails: string; startDate: string; endDate: string },
  ) {
    if (!selectedClientId) {
      setFeedback({ ok: false, text: "Selecciona un cliente." });
      return;
    }
    setBusy(true);
    setFeedback(null);
    try {
      const result = await createNutritionistMealPlan({
        clientUserId: selectedClientId,
        ...values,
      });
      if (result.error) {
        setFeedback({ ok: false, text: result.error });
        return;
      }
      setFeedback({ ok: true, text: "Plan de alimentación cargado." });
      await loadData();
    } catch (error) {
      console.error("Could not create nutritionist meal plan.", error);
      setFeedback({
        ok: false,
        text: "No se pudo guardar el plan de alimentación. Intenta de nuevo.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleUpdatePlan(
    planId: string,
    values: { planDetails: string; startDate: string; endDate: string },
  ) {
    setBusy(true);
    setFeedback(null);
    try {
      const result = await updateNutritionistMealPlan({ planId, ...values });
      if (result.error) {
        setFeedback({ ok: false, text: result.error });
        return;
      }
      setEditingPlanId(null);
      setFeedback({ ok: true, text: "Plan de alimentación actualizado." });
      await loadData();
    } catch (error) {
      console.error("Could not update nutritionist meal plan.", error);
      setFeedback({
        ok: false,
        text: "No se pudo actualizar el plan de alimentación. Intenta de nuevo.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleFinishPlan(planId: string) {
    setBusy(true);
    setFeedback(null);
    try {
      const result = await finishNutritionistMealPlan(planId);
      if (result.error) {
        setFeedback({ ok: false, text: result.error });
        return;
      }
      setFeedback({ ok: true, text: "Plan de alimentación finalizado." });
      await loadData();
    } catch (error) {
      console.error("Could not finish nutritionist meal plan.", error);
      setFeedback({
        ok: false,
        text: "No se pudo finalizar el plan de alimentación. Intenta de nuevo.",
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
        footerLabel="Panel de nutrición"
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
              <p className="hidden truncate text-xs text-zinc-600 sm:block">
                {nutritionistName || nutritionistEmail}
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

          <section id="resumen" hidden={activeSection !== "resumen"}>
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-600">
                VibeFit / Nutrición
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
                Bienvenido, {nutritionistName?.trim() || "nutricionista"}
              </h1>
              <p className="mt-1 text-sm text-zinc-700">
                Organiza los planes de alimentación y acompaña el progreso de tus clientes.
              </p>
            </div>
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(400px,520px)]">
              <section className="flex flex-col justify-center rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-600">
                  Seguimiento nutricional
                </p>
                <h2 className="mt-3 max-w-xl text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
                  Hábitos saludables, progreso constante.
                </h2>
                <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-700">
                  Consulta a tus clientes, carga sus planes y actualiza cada etapa de su seguimiento.
                </p>
                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {[
                    { label: "Planes activos", value: activePlansCount },
                    {
                      label: "Clientes sin plan activo",
                      value: clientsWithoutPlanCount,
                    },
                  ].map((item) => (
                    <article
                      key={item.label}
                      className="rounded-xl border border-zinc-200 bg-zinc-50 p-4"
                    >
                      <p className="text-xs text-zinc-600">{item.label}</p>
                      <p className="mt-2 text-2xl font-semibold text-zinc-950">
                        {loading ? "—" : item.value}
                      </p>
                    </article>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => navigateToSection("#clientes")}
                  className="mt-6 w-fit rounded-xl bg-zinc-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-zinc-800"
                >
                  Ver clientes
                </button>
              </section>
              <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
                <LifestyleAnimation className="h-full" />
              </div>
            </div>
          </section>

          <section
            id="clientes"
            hidden={activeSection !== "clientes"}
            className="scroll-mt-24"
          >
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-600">
                VibeFit / Nutrición
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
                Clientes
              </h1>
              <p className="mt-1 text-sm text-zinc-700">
                Busca clientes y revisa el estado de su plan de alimentación.
              </p>
            </div>
            <label className="mb-5 flex h-12 items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 shadow-sm">
              <SearchIcon className="size-5 shrink-0 text-zinc-600" />
              <span className="sr-only">Buscar cliente por nombre o correo</span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nombre o correo"
                className="w-full bg-transparent text-sm text-zinc-950 outline-none placeholder:text-zinc-500"
              />
            </label>
            {!filteredClients.length && !loading && !loadError ? (
              <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center">
                <h2 className="text-lg font-semibold text-zinc-900">
                  {search ? "No encontramos clientes" : "No hay clientes disponibles"}
                </h2>
                <p className="mt-2 text-sm text-zinc-600">
                  {search
                    ? "Prueba con otro nombre o correo."
                    : "Cuando haya clientes visibles para tu cuenta, aparecerán aquí."}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {filteredClients.map((client) => (
                  <article
                    key={client.id}
                    className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h2 className="truncate font-semibold text-zinc-950">
                          {client.full_name?.trim() || "Cliente"}
                        </h2>
                        <p className="mt-1 truncate text-sm text-zinc-700">
                          {client.email}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                          client.hasActiveMealPlan
                            ? "bg-emerald-50 text-emerald-800"
                            : "bg-zinc-100 text-zinc-700"
                        }`}
                      >
                        {client.hasActiveMealPlan
                          ? "Plan activo"
                          : "Sin plan activo"}
                      </span>
                    </div>
                    {!client.hasActiveMealPlan && (
                      <button
                        type="button"
                        onClick={() => startPlanForClient(client.id)}
                        className="mt-4 rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800"
                      >
                        Cargar plan
                      </button>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>

          <section
            id="planes-alimentacion"
            hidden={activeSection !== "planes-alimentacion"}
            className="scroll-mt-24"
          >
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-600">
                VibeFit / Nutrición
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
                Planes de alimentación
              </h1>
              <p className="mt-1 text-sm text-zinc-700">
                Carga, actualiza y finaliza los planes de tus clientes.
              </p>
            </div>

            {editingPlanId ? (
              (() => {
                const plan = plans.find(({ id }) => id === editingPlanId);
                if (!plan) return null;
                return (
                  <div className="mb-6">
                    <h2 className="mb-3 text-base font-semibold text-zinc-950">
                      Editar plan ·{" "}
                      {clientsById.get(plan.client_user_id)?.full_name || "Cliente"}
                    </h2>
                    <MealPlanForm
                      key={plan.id}
                      plan={plan}
                      clientId={plan.client_user_id}
                      clients={clients}
                      startDate={startDate}
                      busy={busy}
                      onStartDateChange={setStartDate}
                      onSave={(values) =>
                        void handleUpdatePlan(plan.id, values)
                      }
                      onCancel={() => {
                        setEditingPlanId(null);
                        setStartDate(data?.today ?? "");
                      }}
                    />
                  </div>
                );
              })()
            ) : (
              <div className="mb-6">
                <h2 className="mb-3 text-base font-semibold text-zinc-950">
                  Cargar plan de alimentación
                </h2>
                <MealPlanForm
                  key="create-meal-plan"
                  clientId={selectedClientId}
                  clients={clients}
                  startDate={startDate || data?.today || ""}
                  busy={busy}
                  onClientChange={setSelectedClientId}
                  onStartDateChange={setStartDate}
                  onSave={(values) => void handleCreatePlan(values)}
                />
              </div>
            )}

            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-zinc-950">Mis planes</h2>
              <span className="text-sm text-zinc-600">{plans.length} en total</span>
            </div>
            {!plans.length && !loading && !loadError ? (
              <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center">
                <p className="text-sm text-zinc-700">
                  Aún no has cargado planes de alimentación.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {plans.map((plan) => {
                  const client = clientsById.get(plan.client_user_id);
                  const isActive = plan.meal_plan_status === "active";
                  return (
                    <article
                      key={plan.id}
                      className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-zinc-950">
                            {client?.full_name?.trim() || "Cliente"}
                          </h3>
                          <p className="mt-1 text-sm text-zinc-700">
                            {client?.email || "Correo no disponible"}
                          </p>
                          <p className="mt-2 text-xs text-zinc-600">
                            Inicio: {formatBogotaDate(plan.start_date)} · Fin:{" "}
                            {formatBogotaDate(plan.end_date)}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            isActive
                              ? "bg-emerald-50 text-emerald-800"
                              : "bg-zinc-100 text-zinc-700"
                          }`}
                        >
                          {isActive ? "Activo" : "Finalizado"}
                        </span>
                      </div>
                      <p className="mt-4 whitespace-pre-wrap rounded-xl bg-zinc-50 p-4 text-sm leading-6 text-zinc-800">
                        {plan.plan_details}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => editPlan(plan)}
                          className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 disabled:opacity-50"
                        >
                          Editar
                        </button>
                        {isActive && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void handleFinishPlan(plan.id)}
                            className="rounded-xl bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50"
                          >
                            Finalizar plan
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import type { ComponentType, SVGProps } from "react";
import Image from "next/image";
import { logout } from "@/app/actions/auth";
import {
  BellIcon,
  CalendarIcon,
  ChevronDownIcon,
  LayoutGridIcon,
  MenuTwoIcon,
  PieChartIcon,
  SearchIcon,
  TableIcon,
  UserCircleIcon,
  UsersIcon,
  XIcon,
} from "@/components/dashboard-icons";

type DashboardIcon = ComponentType<SVGProps<SVGSVGElement>>;

const navigation = [
  { label: "Usuarios y roles", href: "#usuarios", icon: UsersIcon },
  { label: "Planes de membresía", href: "#planes", icon: TableIcon },
  { label: "Asistencia", href: "#asistencia", icon: CalendarIcon },
  { label: "Auditoría", href: "#auditoria", icon: PieChartIcon },
];

const metrics = [
  { label: "Usuarios registrados", icon: UsersIcon },
  { label: "Trabajadores", icon: UserCircleIcon },
  { label: "Membresías activas", icon: TableIcon },
  { label: "Asistencias de hoy", icon: CalendarIcon },
];

function EmptyPanel({
  icon: Icon,
  title,
  description,
}: {
  icon: DashboardIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50/70 px-6 py-8 text-center">
      <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-white text-zinc-500 shadow-sm ring-1 ring-zinc-200">
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <p className="text-sm font-semibold text-zinc-800">{title}</p>
      <p className="mt-1 max-w-sm text-sm leading-6 text-zinc-500">
        {description}
      </p>
      <span className="mt-4 rounded-full bg-white px-3 py-1 text-xs font-medium text-zinc-500 ring-1 ring-zinc-200">
        Próximamente
      </span>
    </div>
  );
}

export function ManagerDashboard() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  function toggleSidebar() {
    if (window.matchMedia("(min-width: 1024px)").matches) {
      setCollapsed((value) => !value);
      return;
    }

    setMobileOpen((value) => !value);
  }

  return (
    <div className="min-h-screen bg-[#f7f8fa] text-zinc-900">
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-zinc-950/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Cerrar menú"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[18.125rem] flex-col border-r border-zinc-200 bg-white transition-[width,transform] duration-300 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "lg:w-[5.625rem]" : "lg:w-[18.125rem]"}`}
      >
        <div
          className={`flex h-[72px] shrink-0 items-center border-b border-zinc-100 px-5 ${
            collapsed ? "lg:justify-center lg:px-3" : ""
          }`}
        >
          <a
            href="#resumen"
            className="flex min-w-0 items-center"
            onClick={() => setMobileOpen(false)}
          >
            {collapsed ? (
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#24180f] lg:size-9">
                <Image
                  src="/vibefit-mark.svg"
                  alt="VibeFit"
                  width={26}
                  height={29}
                  priority
                />
              </span>
            ) : (
              <span className="flex h-11 items-center rounded-xl bg-[#24180f] px-3">
                <Image
                  src="/logo.svg"
                  alt="VITEFIT"
                  width={119}
                  height={35}
                  priority
                  className="h-[30px] w-auto"
                />
              </span>
            )}
          </a>
          <button
            type="button"
            className="flex size-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Cerrar menú"
          >
            <XIcon className="size-5" aria-hidden="true" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-6">
          <p
            className={`mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-400 ${
              collapsed ? "lg:hidden" : ""
            }`}
          >
            Menu
          </p>
          <ul className="space-y-1.5">
            <li>
              <a
                href="#resumen"
                onClick={() => setMobileOpen(false)}
                title={collapsed ? "Dashboard" : undefined}
                aria-current="page"
                className={`flex min-h-11 items-center gap-3 rounded-xl bg-zinc-100 px-3 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200 ${
                  collapsed ? "lg:justify-center lg:px-0" : ""
                }`}
              >
                <LayoutGridIcon
                  className="size-6 shrink-0"
                  aria-hidden="true"
                />
                <span className={collapsed ? "lg:hidden" : ""}>Dashboard</span>
                <ChevronDownIcon
                  className={`ml-auto size-4 transition-transform ${
                    collapsed ? "lg:hidden" : "-rotate-180"
                  }`}
                  aria-hidden="true"
                />
              </a>
              <a
                href="#resumen"
                onClick={() => setMobileOpen(false)}
                className={`mt-1 flex min-h-10 items-center rounded-lg bg-zinc-100 px-3 text-sm font-medium text-zinc-800 transition hover:bg-zinc-200 ${
                  collapsed ? "lg:hidden" : "ml-9"
                }`}
              >
                Resumen
              </a>
            </li>
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <a
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    title={collapsed ? item.label : undefined}
                    className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950 ${
                      collapsed ? "lg:justify-center lg:px-0" : ""
                    }`}
                  >
                    <Icon className="size-6 shrink-0" aria-hidden="true" />
                    <span className={collapsed ? "lg:hidden" : ""}>
                      {item.label}
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-zinc-100 p-4">
          <div
            className={`flex items-center gap-2 ${
              collapsed ? "lg:flex-col" : ""
            }`}
          >
            <div
              className={`flex min-w-0 flex-1 items-center gap-3 rounded-xl bg-zinc-50 p-3 ${
                collapsed
                  ? "lg:w-full lg:flex-none lg:justify-center lg:p-2"
                  : ""
              }`}
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-zinc-700">
                <UserCircleIcon className="size-6" aria-hidden="true" />
              </span>
              <div className={`min-w-0 ${collapsed ? "lg:hidden" : ""}`}>
                <p className="truncate text-xs font-semibold text-zinc-800">
                  VibeFit
                </p>
                <p className="mt-0.5 truncate text-xs text-zinc-500">
                  Panel de gerente
                </p>
              </div>
            </div>
            <form action={logout} className={collapsed ? "lg:w-full" : ""}>
              <button
                type="submit"
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
                className={`whitespace-nowrap rounded-lg px-2 py-2 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950 ${
                  collapsed ? "lg:w-full lg:px-1" : ""
                }`}
              >
                <span className={collapsed ? "lg:hidden" : ""}>
                  Cerrar sesión
                </span>
                {collapsed && <span className="hidden lg:inline">Salir</span>}
              </button>
            </form>
          </div>
        </div>
      </aside>

      <div
        className={`min-h-screen transition-[padding] duration-300 ${
          collapsed ? "lg:pl-[5.625rem]" : "lg:pl-[18.125rem]"
        }`}
      >
        <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-zinc-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 text-zinc-600 transition hover:bg-zinc-50 sm:size-12 lg:size-14"
              onClick={toggleSidebar}
              aria-label={
                mobileOpen
                  ? "Cerrar menú"
                  : collapsed
                    ? "Expandir menú"
                    : "Abrir o contraer menú"
              }
            >
              {mobileOpen ? (
                <XIcon className="size-5" aria-hidden="true" />
              ) : (
                <MenuTwoIcon className="size-5" aria-hidden="true" />
              )}
            </button>
            <div className="hidden h-10 w-[min(34rem,45vw)] flex-none items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-400 sm:flex sm:h-12 sm:px-4 lg:h-14">
              <SearchIcon className="size-5 shrink-0" aria-hidden="true" />
              <span className="flex-1">Buscar o escribe un comando...</span>
              <kbd className="rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-zinc-500">
                Ctrl K
              </kbd>
            </div>
            <span className="flex items-center gap-2 text-sm font-bold tracking-wide text-zinc-800 sm:hidden">
              <Image
                src="/vibefit-mark.svg"
                alt=""
                width={20}
                height={22}
                className="rounded bg-[#24180f] p-0.5"
              />
              VITEFIT
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <span
              className="relative flex size-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 sm:size-12 lg:size-14"
              aria-label="Notificaciones"
              title="Notificaciones"
            >
              <BellIcon className="size-5" aria-hidden="true" />
              <span className="absolute right-2 top-2 size-2 rounded-full bg-orange-400 ring-2 ring-white" />
            </span>
            <span className="hidden h-8 w-px bg-zinc-200 sm:block" />
            <div className="hidden items-center gap-2 sm:flex">
              <span className="flex size-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 sm:size-12">
                <UserCircleIcon className="size-6" aria-hidden="true" />
              </span>
              <div className="hidden leading-tight md:block">
                <p className="text-sm font-semibold text-zinc-800">Gerencia</p>
                <p className="text-xs text-zinc-500">VibeFit</p>
              </div>
              <ChevronDownIcon
                className="hidden size-5 text-zinc-400 md:block"
                aria-hidden="true"
              />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <section id="resumen" className="scroll-mt-24">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                  VibeFit / Administración
                </p>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
                  Dashboard del gerente
                </h1>
                <p className="mt-1 text-sm text-zinc-500">
                  Resumen general de la operación del gimnasio.
                </p>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600">
                <span className="size-1.5 rounded-full bg-zinc-400" />
                Vista visual · datos pendientes
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {metrics.map((metric) => {
                const Icon = metric.icon;
                return (
                  <article
                    key={metric.label}
                    className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm shadow-zinc-950/[0.02]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700">
                        <Icon className="size-[19px]" aria-hidden="true" />
                      </div>
                      <span className="rounded-full bg-zinc-50 px-2.5 py-1 text-[11px] font-medium text-zinc-500">
                        Sin datos
                      </span>
                    </div>
                    <p className="mt-5 text-sm text-zinc-500">{metric.label}</p>
                    <p className="mt-1 text-2xl font-bold tracking-tight text-zinc-900">
                      —
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">
                      Se mostrará al conectar la información.
                    </p>
                  </article>
                );
              })}
            </div>
          </section>

          <section
            id="asistencia"
            className="mt-6 grid scroll-mt-24 gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.9fr)]"
          >
            <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm shadow-zinc-950/[0.02] sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold text-zinc-900">
                    Asistencia por franja
                  </h2>
                  <p className="mt-1 text-sm text-zinc-500">
                    Resumen de mañana, tarde y noche.
                  </p>
                </div>
                <CalendarIcon
                  className="size-6 text-zinc-400"
                  aria-hidden="true"
                />
              </div>
              <div className="mt-6 grid min-h-52 place-items-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50/70 px-4 py-8 text-center">
                <div>
                  <div className="mx-auto flex size-11 items-center justify-center rounded-xl bg-white text-zinc-500 shadow-sm ring-1 ring-zinc-200">
                    <PieChartIcon className="size-6" aria-hidden="true" />
                  </div>
                  <p className="mt-3 text-sm font-medium text-zinc-700">
                    El reporte aparecerá aquí
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Aún no hay datos conectados para generar el gráfico.
                  </p>
                </div>
              </div>
            </article>

            <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm shadow-zinc-950/[0.02] sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold text-zinc-900">
                    Membresías
                  </h2>
                  <p className="mt-1 text-sm text-zinc-500">
                    Estado general de los planes.
                  </p>
                </div>
                <TableIcon
                  className="size-6 text-zinc-400"
                  aria-hidden="true"
                />
              </div>
              <div className="mt-6 space-y-4">
                {["Activas", "Finalizadas", "Total de planes"].map((label) => (
                  <div
                    key={label}
                    className="flex items-center justify-between border-b border-zinc-100 pb-4 last:border-0 last:pb-0"
                  >
                    <span className="text-sm text-zinc-600">{label}</span>
                    <span className="text-sm font-semibold text-zinc-400">—</span>
                  </div>
                ))}
                <p className="rounded-xl bg-zinc-50 px-3 py-2.5 text-xs leading-5 text-zinc-500">
                  Los indicadores se conectarán al implementar la gestión de
                  membresías.
                </p>
              </div>
            </article>
          </section>

          <section
            id="usuarios"
            className="mt-6 grid scroll-mt-24 gap-5 xl:grid-cols-2"
          >
            <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm shadow-zinc-950/[0.02] sm:p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700">
                  <UsersIcon className="size-6" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-zinc-900">
                    Usuarios y trabajadores
                  </h2>
                  <p className="mt-1 text-sm text-zinc-500">
                    Cuentas, datos y roles del equipo.
                  </p>
                </div>
              </div>
              <EmptyPanel
                icon={UsersIcon}
                title="Gestión de usuarios pendiente"
                description="Aquí el gerente podrá crear trabajadores y asignarles roles. Esta etapa prepara solo la estructura visual."
              />
            </article>

            <article
              id="planes"
              className="scroll-mt-24 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm shadow-zinc-950/[0.02] sm:p-6"
            >
              <div className="mb-5 flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700">
                  <TableIcon className="size-6" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-zinc-900">
                    Planes de membresía
                  </h2>
                  <p className="mt-1 text-sm text-zinc-500">
                    Configuración de precios y duración.
                  </p>
                </div>
              </div>
              <EmptyPanel
                icon={TableIcon}
                title="Planes por configurar"
                description="La creación y edición de planes se conectará en una siguiente etapa."
              />
            </article>
          </section>

          <section
            id="auditoria"
            className="mt-6 scroll-mt-24 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm shadow-zinc-950/[0.02] sm:p-6"
          >
            <div className="mb-5 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700">
                <PieChartIcon className="size-6" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-zinc-900">
                  Registro de auditoría
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Historial de cambios realizados en el sistema.
                </p>
              </div>
            </div>
            <EmptyPanel
              icon={PieChartIcon}
              title="El historial aparecerá aquí"
              description="Todavía no se muestran registros. La consulta de auditoría se implementará después."
            />
          </section>
        </main>
      </div>
    </div>
  );
}

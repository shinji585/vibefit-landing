"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Image from "next/image";
import type { FormEvent } from "react";
import { motion } from "framer-motion";
import {
  Globe,
  Info,
  LogOut,
  Settings,
  UserCircle,
} from "lucide-react";
import { logout } from "@/app/actions/auth";
import { createClient } from "@/lib/supabase/client";
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
import { AnimatedIcon } from "@/components/animated-icon";
import {
  AttendanceReportSection,
  AuditLogSection,
  ManagerOverviewSection,
  ManagerUsersSection,
  MembershipPlansSection,
} from "@/components/manager-dashboard-data";

type ManagerDashboardProps = {
  managerId: string;
  managerName: string;
  managerEmail: string;
};

const navigation = [
  {
    label: "Usuarios y roles",
    href: "#usuarios",
    icon: UsersIcon,
    aliases: ["usuarios", "cuentas", "roles", "trabajadores"],
  },
  {
    label: "Planes de membresía",
    href: "#planes",
    icon: TableIcon,
    aliases: ["planes", "membresía", "precios", "duración"],
  },
  {
    label: "Asistencia",
    href: "#asistencia",
    icon: CalendarIcon,
    aliases: ["asistencia", "reporte", "franjas", "turnos", "mañana", "tarde", "noche"],
  },
  {
    label: "Auditoría",
    href: "#auditoria",
    icon: PieChartIcon,
    aliases: ["auditoría", "historial", "cambios"],
  },
];

const sections = [
  {
    label: "Resumen",
    href: "#resumen",
    icon: LayoutGridIcon,
    aliases: ["dashboard", "inicio", "resumen", "inscripciones"],
  },
  ...navigation,
];

type ManagerNotification = {
  id: string;
  full_name: string | null;
  email: string;
  created_at: string;
};

const unavailableNotificationStorage = "__notification_storage_unavailable__";

function ManagerNotifications({ managerId }: { managerId: string }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<ManagerNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [storageWriteError, setStorageWriteError] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const storageKey = `vibefit.manager.${managerId}.notifications.lastOpenedAt`;

  const subscribeToStorage = useCallback((listener: () => void) => {
    const handleStorageChange = () => listener();
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("vibefit-notifications-updated", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(
        "vibefit-notifications-updated",
        handleStorageChange,
      );
    };
  }, []);

  const getLastOpenedAt = useCallback(() => {
    try {
      return window.localStorage.getItem(storageKey) ?? "";
    } catch (error) {
      console.error("Could not read the manager notification timestamp.", error);
      return unavailableNotificationStorage;
    }
  }, [storageKey]);
  const lastOpenedAt = useSyncExternalStore(
    subscribeToStorage,
    getLastOpenedAt,
    () => "",
  );

  useEffect(() => {
    let cancelled = false;

    async function loadNotifications() {
      setLoading(true);
      setError(null);
      try {
        const { data, error: queryError } = await createClient()
          .from("users")
          .select("id, full_name, email, created_at")
          .order("created_at", { ascending: false })
          .limit(10);

        if (queryError) throw queryError;
        if (!cancelled) setNotifications(data ?? []);
      } catch (loadError) {
        console.error("Could not load manager notifications.", loadError);
        const message =
          loadError instanceof Error
            ? loadError.message
            : typeof loadError === "object" &&
                loadError !== null &&
                "message" in loadError &&
                typeof loadError.message === "string"
              ? loadError.message
              : "Error inesperado.";
        if (!cancelled) {
          setError(`No se pudieron cargar los usuarios recientes: ${message}`);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadNotifications();
    const intervalId = window.setInterval(() => {
      void loadNotifications();
    }, 60_000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !panelRef.current?.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const lastOpenedTime = lastOpenedAt ? Date.parse(lastOpenedAt) : null;
  const unreadCount = notifications.filter((notification) => {
    if (lastOpenedTime === null) return true;
    const createdTime = Date.parse(notification.created_at);
    return Number.isFinite(createdTime) && createdTime > lastOpenedTime;
  }).length;

  function toggleNotifications() {
    const nextOpen = !open;
    setOpen(nextOpen);
    if (!nextOpen) return;

    const timestamp = new Date().toISOString();
    try {
      window.localStorage.setItem(storageKey, timestamp);
      window.dispatchEvent(new Event("vibefit-notifications-updated"));
      setStorageWriteError(false);
    } catch (error) {
      console.error("Could not save the manager notification timestamp.", error);
      setStorageWriteError(true);
    }
  }

  return (
    <div className="relative" ref={panelRef}>
      <motion.button
        type="button"
        whileHover="hover"
        whileTap="tap"
        aria-label={`Notificaciones${unreadCount ? `, ${unreadCount} nuevas` : ""}`}
        aria-expanded={open}
        aria-controls="manager-notifications"
        onClick={toggleNotifications}
        className="relative flex size-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 transition hover:bg-zinc-50 sm:size-12 lg:size-14"
      >
        <AnimatedIcon effect="ring" className="size-5" trigger="parent">
          <BellIcon className="size-5" />
        </AnimatedIcon>
        {unreadCount > 0 && (
          <span className="absolute right-2 top-2 size-2 rounded-full bg-orange-400 ring-2 ring-white" />
        )}
      </motion.button>

      {open && (
        <div
          id="manager-notifications"
          role="dialog"
          aria-label="Notificaciones de nuevos usuarios"
          className="absolute right-0 top-full z-50 mt-3 w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_16px_48px_rgba(24,24,27,0.16)]"
        >
          <div className="border-b border-zinc-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-zinc-900">
              Notificaciones
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              Registros recientes de nuevos usuarios.
            </p>
          </div>
          {loading ? (
            <p className="px-5 py-6 text-center text-sm text-zinc-500">
              Cargando notificaciones…
            </p>
          ) : error ? (
            <p role="alert" className="m-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : (
            <>
              {(lastOpenedAt === unavailableNotificationStorage ||
                storageWriteError) && (
                <p
                  role="alert"
                  className="m-4 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800"
                >
                  No se pudo guardar el estado de lectura en este navegador.
                </p>
              )}
              {notifications.length === 0 ? (
                <p className="px-5 py-6 text-center text-sm text-zinc-500">
                  No hay usuarios registrados recientemente.
                </p>
              ) : (
                <ul className="max-h-96 divide-y divide-zinc-100 overflow-y-auto">
                  {notifications.map((notification) => (
                    <li key={notification.id} className="px-5 py-3.5">
                      <p className="text-sm font-medium text-zinc-800">
                        Nuevo usuario:{" "}
                        {notification.full_name?.trim() || notification.email}
                      </p>
                      {notification.full_name?.trim() && (
                        <p className="mt-0.5 truncate text-xs text-zinc-500">
                          {notification.email}
                        </p>
                      )}
                      <time
                        className="mt-1 block text-xs text-zinc-400"
                        dateTime={notification.created_at}
                      >
                        {new Date(notification.created_at).toLocaleString(
                          "es-CO",
                          {
                            timeZone: "America/Bogota",
                            dateStyle: "medium",
                            timeStyle: "short",
                          },
                        )}
                      </time>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function ManagerDashboard({
  managerId,
  managerName,
  managerEmail,
}: ManagerDashboardProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("resumen");
  const userMenuRef = useRef<HTMLDivElement>(null);
  const isExpanded = !collapsed || hovered;
  const currentSection =
    sections.find((section) => section.href === `#${activeSection}`) ??
    sections[0];
  const normalizedQuery = searchQuery
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const searchTerms = normalizedQuery
    .split(/\s+/)
    .filter((term) => !["a", "de", "el", "en", "la", "las", "los", "por", "y"].includes(term));
  const searchResults = searchTerms.length
    ? sections.filter((item) => {
        const searchableText = [item.label, ...item.aliases]
          .join(" ")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase();
        return searchTerms.every((term) => searchableText.includes(term));
      })
    : [];

  useEffect(() => {
    if (!userMenuOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !userMenuRef.current?.contains(event.target)
      ) {
        setUserMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setUserMenuOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [userMenuOpen]);

  function toggleSidebar() {
    if (window.matchMedia("(min-width: 1024px)").matches) {
      setCollapsed((value) => !value);
      return;
    }

    setMobileOpen((value) => !value);
  }

  useEffect(() => {
    function syncSectionFromHash() {
      const sectionId = window.location.hash.slice(1);
      if (sections.some((section) => section.href === `#${sectionId}`)) {
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

  function navigateToSection(href: string) {
    const section = sections.find((item) => item.href === href);
    if (!section) return;
    setActiveSection(href.slice(1));
    window.history.pushState(null, "", href);
    setSearchQuery("");
    setSearchOpen(false);
    setMobileOpen(false);
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (searchResults[0]) navigateToSection(searchResults[0].href);
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
        onMouseEnter={() => {
          if (window.matchMedia("(min-width: 1024px)").matches && collapsed) {
            setHovered(true);
          }
        }}
        onMouseLeave={() => setHovered(false)}
        className={`fixed inset-y-0 left-0 z-50 flex w-[18.125rem] flex-col border-r border-zinc-200 bg-white transition-[width,transform] duration-300 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${isExpanded ? "lg:w-[18.125rem]" : "lg:w-[5.625rem]"}`}
      >
        <div
          className={`flex h-[72px] shrink-0 items-center border-b border-zinc-100 px-5 ${
            isExpanded ? "" : "lg:justify-center lg:px-3"
          }`}
        >
          <a
            href="#resumen"
            className="flex min-w-0 items-center"
            onClick={(event) => {
              event.preventDefault();
              navigateToSection("#resumen");
            }}
          >
            {!isExpanded ? (
              <Image
                src="/logorecojido.svg?v=2"
                alt="VibeFit"
                width={44}
                height={44}
                priority
                className="size-11 shrink-0"
              />
            ) : (
              <span className="flex h-11 items-center rounded-xl bg-black px-3">
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
            <AnimatedIcon className="size-5">
              <XIcon className="size-5" />
            </AnimatedIcon>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-6">
          <p
            className={`mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-400 ${
              !isExpanded ? "lg:hidden" : ""
            }`}
          >
            Menu
          </p>
          <ul className="space-y-1.5">
            <li>
              <motion.a
                href="#resumen"
                whileHover="hover"
                whileTap="tap"
                onClick={(event) => {
                  event.preventDefault();
                  navigateToSection("#resumen");
                }}
                title={!isExpanded ? "Dashboard" : undefined}
                aria-current={activeSection === "resumen" ? "page" : undefined}
                className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition hover:bg-zinc-100 hover:text-zinc-950 ${
                  activeSection === "resumen"
                    ? "bg-zinc-100 text-zinc-950"
                    : "text-zinc-600"
                } ${
                  isExpanded ? "" : "lg:justify-center lg:px-0"
                }`}
              >
                <AnimatedIcon className="size-6 shrink-0" trigger="parent">
                  <LayoutGridIcon className="size-6" />
                </AnimatedIcon>
                <span className={!isExpanded ? "lg:hidden" : ""}>Dashboard</span>
                <AnimatedIcon
                  effect="rotate"
                  className={`ml-auto size-4 ${
                    !isExpanded ? "lg:hidden" : ""
                  }`}
                  trigger="parent"
                >
                  <ChevronDownIcon
                    className={`size-4 transition-transform ${
                      !isExpanded ? "" : "-rotate-180"
                    }`}
                  />
                </AnimatedIcon>
              </motion.a>
              <a
                href="#resumen"
                onClick={(event) => {
                  event.preventDefault();
                  navigateToSection("#resumen");
                }}
                aria-current={activeSection === "resumen" ? "page" : undefined}
                className={`mt-1 flex min-h-10 items-center rounded-lg px-3 text-sm font-medium transition hover:bg-zinc-100 ${
                  activeSection === "resumen"
                    ? "bg-zinc-100 text-zinc-800"
                    : "text-zinc-600"
                } ${
                  !isExpanded ? "lg:hidden" : "ml-9"
                }`}
              >
                Resumen
              </a>
            </li>
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <motion.a
                    href={item.href}
                    whileHover="hover"
                    whileTap="tap"
                    onClick={(event) => {
                      event.preventDefault();
                      navigateToSection(item.href);
                    }}
                    title={!isExpanded ? item.label : undefined}
                    aria-current={activeSection === item.href.slice(1) ? "page" : undefined}
                    className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition hover:bg-zinc-100 hover:text-zinc-950 ${
                      activeSection === item.href.slice(1)
                        ? "bg-zinc-100 text-zinc-950"
                        : "text-zinc-600"
                    } ${
                      isExpanded ? "" : "lg:justify-center lg:px-0"
                    }`}
                  >
                    <AnimatedIcon className="size-6 shrink-0" trigger="parent">
                      <Icon className="size-6" />
                    </AnimatedIcon>
                    <span className={!isExpanded ? "lg:hidden" : ""}>
                      {item.label}
                    </span>
                  </motion.a>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-zinc-100 p-4">
          <div
            className={`rounded-xl bg-zinc-50 p-3 ${
              !isExpanded ? "lg:hidden" : ""
            }`}
          >
            <p className="truncate text-xs font-semibold text-zinc-800">
              VibeFit
            </p>
            <p className="mt-0.5 truncate text-xs text-zinc-500">
              Panel de gerente
            </p>
          </div>
        </div>
      </aside>

      <div
        className={`min-h-screen transition-[padding] duration-300 ${
          isExpanded ? "lg:pl-[18.125rem]" : "lg:pl-[5.625rem]"
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
                <AnimatedIcon className="size-5">
                  <XIcon className="size-5" />
                </AnimatedIcon>
              ) : (
                <AnimatedIcon className="size-5">
                  <MenuTwoIcon className="size-5" />
                </AnimatedIcon>
              )}
            </button>
            <div className="relative hidden w-[min(34rem,45vw)] flex-none sm:block">
              <form
                onSubmit={handleSearchSubmit}
                className="flex h-12 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-400 lg:h-14 lg:px-4"
              >
                <AnimatedIcon className="size-5 shrink-0">
                  <SearchIcon className="size-5" />
                </AnimatedIcon>
                <input
                  type="search"
                  value={searchQuery}
                  onFocus={() => setSearchOpen(true)}
                  onChange={(event) => {
                    setSearchQuery(event.target.value);
                    setSearchOpen(true);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") setSearchOpen(false);
                  }}
                  aria-label="Buscar una sección del dashboard"
                  aria-controls="manager-search-results"
                  placeholder="Buscar usuarios, planes, asistencia..."
                  className="min-w-0 flex-1 bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
                />
                <kbd className="rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-zinc-500">
                  Enter
                </kbd>
              </form>
              {searchOpen && searchQuery.trim() && (
                <div
                  id="manager-search-results"
                  className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-zinc-200 bg-white py-1 shadow-lg"
                >
                  {searchResults.length ? (
                    searchResults.map((item) => (
                      <button
                        key={item.href}
                        type="button"
                        onClick={() => navigateToSection(item.href)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-zinc-700 transition hover:bg-zinc-50"
                      >
                        <AnimatedIcon className="size-4 text-zinc-500">
                          <item.icon className="size-4" />
                        </AnimatedIcon>
                        {item.label}
                      </button>
                    ))
                  ) : (
                    <p className="px-4 py-3 text-sm text-zinc-500">
                      No se encontró una sección para “{searchQuery}”.
                    </p>
                  )}
                </div>
              )}
            </div>
            <span className="flex items-center gap-2 text-sm font-bold tracking-wide text-zinc-800 sm:hidden">
              <Image
                src="/vibefit-mark.svg"
                alt=""
                width={20}
                height={22}
                className="rounded bg-black p-0.5"
              />
              VITEFIT
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <ManagerNotifications managerId={managerId} />
            <span className="hidden h-8 w-px bg-zinc-200 sm:block" />
            <div className="relative" ref={userMenuRef}>
              <motion.button
                type="button"
                whileHover="hover"
                whileTap="tap"
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
                aria-controls="manager-user-menu"
                aria-label="Abrir opciones de Gerencia"
                onClick={() => setUserMenuOpen((open) => !open)}
                className="flex items-center gap-2 rounded-xl p-1.5 text-left transition hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400 sm:gap-3 sm:px-2"
              >
                <span className="flex size-10 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 text-zinc-600 sm:size-11">
                  <AnimatedIcon className="size-6" trigger="parent">
                    <UserCircleIcon className="size-6" />
                  </AnimatedIcon>
                </span>
                <span className="hidden leading-tight sm:block">
                  <span className="block text-sm font-semibold text-zinc-800">
                    Gerencia
                  </span>
                  <span className="mt-0.5 block text-xs text-zinc-500">
                    VibeFit
                  </span>
                </span>
                <AnimatedIcon
                  effect="rotate"
                  className="size-5 text-zinc-500"
                  trigger="parent"
                >
                  <ChevronDownIcon
                    className={`size-5 transition-transform ${
                      userMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </AnimatedIcon>
              </motion.button>

              {userMenuOpen && (
                <div
                  id="manager-user-menu"
                  role="menu"
                  aria-label="Menú de cuenta"
                  className="absolute right-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_16px_48px_rgba(24,24,27,0.16)]"
                >
                  <div className="border-b border-zinc-100 px-5 py-4">
                    <p className="truncate text-sm font-semibold text-zinc-800">
                      {managerName}
                    </p>
                    <p className="mt-1 truncate text-xs text-zinc-500">
                      {managerEmail}
                    </p>
                  </div>
                  <div className="space-y-1 p-2">
                    <div
                      role="menuitem"
                      aria-disabled="true"
                      className="flex min-h-12 items-center gap-4 rounded-xl px-3 text-sm font-medium text-zinc-800"
                    >
                      <AnimatedIcon className="size-6 text-zinc-500">
                        <UserCircle className="size-6" />
                      </AnimatedIcon>
                      Editar perfil
                    </div>
                    <div
                      role="menuitem"
                      aria-disabled="true"
                      className="flex min-h-12 items-center gap-4 rounded-xl px-3 text-sm font-medium text-zinc-800"
                    >
                      <AnimatedIcon effect="rotate" className="size-6 text-zinc-500">
                        <Settings className="size-6" />
                      </AnimatedIcon>
                      Configuración de cuenta
                    </div>
                    <div
                      role="menuitem"
                      aria-disabled="true"
                      className="flex min-h-12 items-center gap-4 rounded-xl px-3 text-sm font-medium text-zinc-800"
                    >
                      <AnimatedIcon className="size-6 text-zinc-500">
                        <Info className="size-6" />
                      </AnimatedIcon>
                      Soporte
                    </div>
                    <div
                      role="menuitem"
                      aria-disabled="true"
                      className="flex min-h-12 items-center gap-4 rounded-xl px-3 text-sm font-medium text-zinc-800"
                    >
                      <AnimatedIcon effect="rotate" className="size-6 text-zinc-500">
                        <Globe className="size-6" />
                      </AnimatedIcon>
                      <span>Idioma</span>
                      <span className="ml-auto rounded-lg border border-zinc-200 px-2.5 py-1 text-xs">
                        Español
                      </span>
                    </div>
                  </div>
                  <div className="border-t border-zinc-100 p-2">
                    <form action={logout}>
                      <button
                        type="submit"
                        role="menuitem"
                        className="flex min-h-12 w-full items-center gap-4 rounded-xl px-3 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-red-300"
                      >
                        <AnimatedIcon className="size-6">
                          <LogOut className="size-6" />
                        </AnimatedIcon>
                        Cerrar sesión
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                VibeFit / Administración
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
                {currentSection.label === "Resumen"
                  ? "Dashboard del gerente"
                  : currentSection.label}
              </h1>
              <p className="mt-1 text-sm text-zinc-500">
                {activeSection === "resumen"
                  ? "Resumen de inscripciones, asistencias y planes."
                  : activeSection === "usuarios"
                    ? "Administra las cuentas, sus roles y su estado."
                    : activeSection === "planes"
                      ? "Consulta y administra los planes de membresía."
                      : activeSection === "asistencia"
                        ? "Consulta la asistencia por fecha y franja horaria."
                        : "Consulta el historial de cambios del sistema."}
              </p>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Panel de gestión
            </span>
          </div>

          <div hidden={activeSection !== "resumen"}>
            <ManagerOverviewSection />
          </div>
          <div hidden={activeSection !== "usuarios"}>
            <ManagerUsersSection managerId={managerId} />
          </div>
          <div hidden={activeSection !== "planes"}>
            <MembershipPlansSection />
          </div>
          <div hidden={activeSection !== "asistencia"}>
            <AttendanceReportSection />
          </div>
          <div hidden={activeSection !== "auditoria"}>
            <AuditLogSection />
          </div>
        </main>
      </div>
    </div>
  );
}

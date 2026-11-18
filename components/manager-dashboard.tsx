"use client";

import {
  useCallback,
  useEffect,
  useMemo,
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
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import {
  DashboardLoadingOverlay,
  DashboardMascot,
} from "@/components/dashboard-experience";
import { OfficeAnimation } from "@/components/office-animation";
import {
  AttendanceReportSection,
  AuditLogSection,
  ManagerCoachesSection,
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
  {
    label: "Coaches y clientes",
    href: "#coaches",
    icon: UserCircleIcon,
    aliases: ["coaches", "entrenadores", "clientes", "asignaciones"],
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
type ManagerInitialLoadKey =
  | "notifications"
  | "overview"
  | "users"
  | "plans"
  | "attendance"
  | "audit"
  | "coaches";

const managerInitialLoadKeys: ManagerInitialLoadKey[] = [
  "notifications",
  "overview",
  "users",
  "plans",
  "attendance",
  "audit",
  "coaches",
];

function ManagerNotifications({
  managerId,
  onInitialLoad,
}: {
  managerId: string;
  onInitialLoad: () => void;
}) {
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
    let initialLoadReported = false;

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
        if (!cancelled) {
          setLoading(false);
          if (!initialLoadReported) {
            initialLoadReported = true;
            onInitialLoad();
          }
        }
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
  }, [onInitialLoad]);

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
  const [loadedInitialSections, setLoadedInitialSections] = useState<
    ReadonlySet<ManagerInitialLoadKey>
  >(() => new Set());
  const [collapsed, setCollapsed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedSearchResult, setSelectedSearchResult] = useState(0);
  const [activeSection, setActiveSection] = useState("resumen");
  const userMenuRef = useRef<HTMLDivElement>(null);
  const markInitialSectionLoaded = useCallback(
    (section: ManagerInitialLoadKey) => {
      setLoadedInitialSections((loaded) => {
        if (loaded.has(section)) return loaded;
        const next = new Set(loaded);
        next.add(section);
        return next;
      });
    },
    [],
  );
  const initialLoadCallbacks = useMemo(
    () => ({
      notifications: () => markInitialSectionLoaded("notifications"),
      overview: () => markInitialSectionLoaded("overview"),
      users: () => markInitialSectionLoaded("users"),
      plans: () => markInitialSectionLoaded("plans"),
      attendance: () => markInitialSectionLoaded("attendance"),
      audit: () => markInitialSectionLoaded("audit"),
      coaches: () => markInitialSectionLoaded("coaches"),
    }),
    [markInitialSectionLoaded],
  );
  const dashboardDataReady = managerInitialLoadKeys.every((key) =>
    loadedInitialSections.has(key),
  );
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
    const selectedResult =
      searchResults[selectedSearchResult] ?? searchResults[0];
    if (selectedResult) navigateToSection(selectedResult.href);
  }

  return (
    <div className="min-h-screen bg-[#f7f8fa] text-zinc-900">
      <DashboardLoadingOverlay ready={dashboardDataReady} />
      <DashboardMascot />
      <DashboardSidebar
        items={navigation}
        activeSection={activeSection}
        footerLabel="Panel de gerente"
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
                    setSelectedSearchResult(0);
                    setSearchOpen(true);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      setSearchOpen(false);
                      return;
                    }

                    if (
                      (event.key === "ArrowDown" ||
                        event.key === "ArrowUp") &&
                      searchResults.length > 0
                    ) {
                      event.preventDefault();
                      setSearchOpen(true);
                      setSelectedSearchResult((current) => {
                        const direction = event.key === "ArrowDown" ? 1 : -1;
                        return (
                          (current + direction + searchResults.length) %
                          searchResults.length
                        );
                      });
                    }
                  }}
                  role="combobox"
                  aria-autocomplete="list"
                  aria-haspopup="listbox"
                  aria-label="Buscar una sección del dashboard"
                  aria-controls="manager-search-results"
                  aria-expanded={Boolean(searchOpen && searchQuery.trim())}
                  aria-activedescendant={
                    searchOpen &&
                    searchQuery.trim() &&
                    searchResults[selectedSearchResult]
                      ? `manager-search-option-${selectedSearchResult}`
                      : undefined
                  }
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
                  role="listbox"
                  aria-label="Resultados de búsqueda"
                  className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-zinc-200 bg-white py-1 shadow-lg"
                >
                  {searchResults.length ? (
                    searchResults.map((item, index) => {
                      const isSelected = selectedSearchResult === index;

                      return (
                        <button
                          key={item.href}
                          id={`manager-search-option-${index}`}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          onMouseEnter={() => setSelectedSearchResult(index)}
                          onClick={() => navigateToSection(item.href)}
                          className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-900 ${
                            isSelected
                              ? "bg-zinc-100 text-zinc-950"
                              : "text-zinc-700 hover:bg-zinc-50"
                          }`}
                        >
                          <AnimatedIcon className="size-4 text-zinc-500">
                            <item.icon className="size-4" />
                          </AnimatedIcon>
                          {item.label}
                        </button>
                      );
                    })
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
            <ManagerNotifications
              managerId={managerId}
              onInitialLoad={initialLoadCallbacks.notifications}
            />
            <span className="hidden h-8 w-px bg-zinc-200 sm:block" />
            <div className="relative" ref={userMenuRef}>
              <motion.button
                type="button"
                whileHover="hover"
                whileTap="tap"
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
                aria-controls="manager-user-menu"
                aria-label={`Abrir opciones de ${managerName?.trim() || "Admin"}`}
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
                    {managerName?.trim() || "Admin"}
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
          {activeSection === "resumen" ? (
            <div className="mb-6 overflow-hidden rounded-[28px] border border-zinc-200 bg-white">
              <div
                className="grid"
                style={{
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(min(100%, 360px), 1fr))",
                  minHeight: 500,
                }}
              >
                <div className="flex flex-col justify-center p-5 sm:p-8 lg:p-10">
                  <div className="flex items-center gap-3">
                    <span
                      className="h-px w-8 bg-zinc-950"
                      aria-hidden="true"
                    />
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                      VibeFit / Administración
                    </p>
                  </div>
                  <h1 className="mt-5 text-[clamp(3rem,5.5vw,5rem)] font-bold leading-[0.88] tracking-[-0.065em] text-zinc-950">
                    Bienvenido, {managerName?.trim() || "gerente"}
                  </h1>
                  <div className="mt-6 grid grid-cols-[auto_1fr] items-start gap-x-3">
                    <span className="pt-0.5 text-[10px] font-medium tracking-[0.12em] text-zinc-500">
                      01
                    </span>
                    <div>
                      <span
                        className="mb-2 block h-px w-full bg-zinc-950/30"
                        aria-hidden="true"
                      />
                      <p className="text-sm text-zinc-500">
                        Resumen de inscripciones, asistencias y planes.
                      </p>
                    </div>
                  </div>
                </div>
                <OfficeAnimation />
              </div>
            </div>
          ) : (
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                VibeFit / Administración
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
                {currentSection.label}
              </h1>
              <p className="mt-1 text-sm text-zinc-500">
                {activeSection === "usuarios"
                  ? "Administra las cuentas, sus roles y su estado."
                  : activeSection === "planes"
                    ? "Consulta y administra los planes de membresía."
                    : activeSection === "asistencia"
                      ? "Consulta la asistencia por fecha y franja horaria."
                      : activeSection === "coaches"
                        ? "Administra la asignación de coaches a clientes."
                      : "Consulta el historial de cambios del sistema."}
              </p>
            </div>
          )}

          <div hidden={activeSection !== "resumen"}>
            <ManagerOverviewSection onInitialLoad={initialLoadCallbacks.overview} />
          </div>
          <div hidden={activeSection !== "usuarios"}>
            <ManagerUsersSection
              managerId={managerId}
              onInitialLoad={initialLoadCallbacks.users}
            />
          </div>
          <div hidden={activeSection !== "planes"}>
            <MembershipPlansSection onInitialLoad={initialLoadCallbacks.plans} />
          </div>
          <div hidden={activeSection !== "asistencia"}>
            <AttendanceReportSection
              onInitialLoad={initialLoadCallbacks.attendance}
            />
          </div>
          <div hidden={activeSection !== "auditoria"}>
            <AuditLogSection onInitialLoad={initialLoadCallbacks.audit} />
          </div>
          <div hidden={activeSection !== "coaches"}>
            <ManagerCoachesSection onInitialLoad={initialLoadCallbacks.coaches} />
          </div>
        </main>
      </div>
    </div>
  );
}

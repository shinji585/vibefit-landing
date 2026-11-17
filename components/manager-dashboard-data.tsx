"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createManagerUser } from "@/app/actions/manager";
import { createClient } from "@/lib/supabase/client";
import {
  CalendarIcon,
  PieChartIcon,
  TableIcon,
  UsersIcon,
} from "@/components/dashboard-icons";
import { AnimatedIcon } from "@/components/animated-icon";

type RoleName = "receptionist" | "manager" | "coach" | "client" | "nutritionist";
type AccountStatus = "active" | "suspended";

type ManagerUser = {
  id: string;
  full_name: string;
  email: string;
  account_status: AccountStatus;
  user_roles: { role: RoleName }[];
};

type MembershipPlan = {
  id: string;
  plan_name: string;
  price: number;
  duration_in_days: number;
};

type AttendanceTotals = {
  morning: number;
  afternoon: number;
  evening: number;
};

type SignupDay = {
  date: string;
  label: string;
  count: number;
};

export type MembershipStatusDay = {
  date: string;
  label: string;
  pending: number;
  enrolled: number;
};

type ChartPoint = {
  x: number;
  y: number;
};

function smoothLinePath(points: ChartPoint[], minY: number, maxY: number) {
  if (!points.length) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  const clampY = (value: number) => Math.min(maxY, Math.max(minY, value));

  return points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;

    const previous = points[index - 1];
    const beforePrevious = points[index - 2] ?? previous;
    const next = points[index + 1] ?? point;
    const control1X = previous.x + (point.x - beforePrevious.x) / 6;
    const control1Y = clampY(previous.y + (point.y - beforePrevious.y) / 6);
    const control2X = point.x - (next.x - previous.x) / 6;
    const control2Y = clampY(point.y - (next.y - previous.y) / 6);

    return `${path} C ${control1X} ${control1Y}, ${control2X} ${control2Y}, ${point.x} ${point.y}`;
  }, "");
}

async function loadAttendanceTotals(date: string): Promise<AttendanceTotals> {
  const supabase = createClient();
  const { data: memberships, error: membershipError } = await supabase
    .from("client_memberships")
    .select("client_user_id")
    .eq("membership_status", "active")
    .lte("start_date", date)
    .gte("end_date", date);
  if (membershipError) throw membershipError;

  const activeClientIds = new Set(
    (memberships ?? []).map(({ client_user_id }) => client_user_id),
  );
  const totals: AttendanceTotals = { morning: 0, afternoon: 0, evening: 0 };
  if (!activeClientIds.size) return totals;

  const start = new Date(`${date}T00:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  const { data: records, error: attendanceError } = await supabase
    .from("attendance_records")
    .select("client_user_id, attended_at")
    .gte("attended_at", start.toISOString())
    .lt("attended_at", end.toISOString());
  if (attendanceError) throw attendanceError;

  for (const record of records ?? []) {
    if (!activeClientIds.has(record.client_user_id)) continue;
    const hour = new Date(record.attended_at).getHours();
    if (hour >= 6 && hour < 12) totals.morning += 1;
    else if (hour >= 12 && hour < 18) totals.afternoon += 1;
    else totals.evening += 1;
  }
  return totals;
}

type AuditEntry = {
  id: string;
  changed_by_user_id: string;
  entity_name: string;
  entity_id: string;
  action_performed: "create" | "update" | "delete";
  previous_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  changed_at: string;
};

const roles: { value: Exclude<RoleName, "manager">; label: string }[] = [
  { value: "client", label: "Cliente" },
  { value: "coach", label: "Coach" },
  { value: "nutritionist", label: "Nutricionista" },
  { value: "receptionist", label: "Recepcionista" },
];

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }
  return "Ocurrió un error inesperado.";
}

function localDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function bogotaDateValue(date: Date) {
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

function addCalendarDays(date: string, days: number) {
  const [year, month, day] = date.split("-").map(Number);
  const value = new Date(Date.UTC(year, month - 1, day + days));
  return [
    value.getUTCFullYear(),
    String(value.getUTCMonth() + 1).padStart(2, "0"),
    String(value.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function membershipDayLabel(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    weekday: "short",
    day: "2-digit",
  }).format(new Date(Date.UTC(year, month - 1, day, 17)));
}

function formatDuration(days: number) {
  return `${days} ${days === 1 ? "día" : "días"}`;
}

function SectionMessage({
  error,
  loading,
  empty,
  emptyMessage = "No hay registros para mostrar.",
}: {
  error: string | null;
  loading: boolean;
  empty: boolean;
  emptyMessage?: string;
}) {
  if (loading) {
    return <p className="py-8 text-center text-sm text-zinc-500">Cargando datos…</p>;
  }
  if (error) {
    return (
      <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
        No se pudieron cargar los datos: {error}
      </p>
    );
  }
  if (empty) {
    return <p className="py-8 text-center text-sm text-zinc-500">{emptyMessage}</p>;
  }
  return null;
}

function SectionHeading({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof UsersIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <AnimatedIcon className="size-10 rounded-xl bg-zinc-100 text-zinc-700">
        <Icon className="size-5" />
      </AnimatedIcon>
      <div>
        <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
        <p className="mt-1 text-sm text-zinc-500">{description}</p>
      </div>
    </div>
  );
}

export function MembershipStatusChart({
  title,
  description,
  status,
  total,
  days,
  color,
  fill,
}: {
  title: string;
  description: string;
  status: "pending" | "enrolled";
  total: number;
  days: MembershipStatusDay[];
  color: string;
  fill: string;
}) {
  const width = 640;
  const height = 220;
  const top = 20;
  const bottom = 174;
  const maxCount = Math.max(1, ...days.map((day) => day[status]));
  const points = days.map((day, index) => ({
    x: 24 + (index * (width - 48)) / Math.max(1, days.length - 1),
    y: bottom - (day[status] / maxCount) * (bottom - top),
  }));
  const line = smoothLinePath(points, top, bottom);
  const area = points.length
    ? `${line} L ${points[points.length - 1].x} ${bottom} L ${points[0].x} ${bottom} Z`
    : "";

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm shadow-zinc-950/[0.02] sm:p-6">
      <SectionHeading icon={UsersIcon} title={title} description={description} />
      <div className="grid gap-3 sm:grid-cols-[minmax(120px,0.42fr)_minmax(0,1.58fr)] sm:items-center">
        <div>
          <span className="text-4xl font-semibold tabular-nums tracking-tight text-zinc-950">
            {total}
          </span>
          <span className="mt-1 block text-xs text-zinc-500">
            actualmente
          </span>
        </div>
        <div className="min-w-0">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label={`${title} por fecha de registro durante los últimos 7 días`}
            className="h-48 w-full overflow-visible sm:h-56"
          >
            {points.length > 1 && (
              <>
                <path d={area} fill={fill} />
                <path
                  d={line}
                  fill="none"
                  stroke={color}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </>
            )}
            {points.map((point, index) => (
              <circle
                key={days[index].date}
                cx={point.x}
                cy={point.y}
                r="4"
                fill={color}
                stroke="white"
                strokeWidth="2"
              />
            ))}
          </svg>
          <div className="flex justify-between px-3 pb-3 text-[11px] capitalize text-zinc-500">
            {days.map((day) => (
              <span key={day.date} className="text-center">
                {day.label}
              </span>
            ))}
          </div>
        </div>
      </div>
      <p className="mt-4 border-t border-zinc-100 pt-3 text-xs text-zinc-500">
        Estado actual de clientes registrados durante los últimos 7 días.
      </p>
    </section>
  );
}

function auditFieldLabel(key: string) {
  const labels: Record<string, string> = {
    plan_name: "Nombre del plan",
    price: "Precio",
    duration_in_days: "Duración",
    created_at: "Fecha de creación",
    full_name: "Nombre",
    email: "Correo",
    account_status: "Estado de la cuenta",
    role: "Rol",
    user_id: "Usuario",
    client_user_id: "Cliente",
    membership_plan_id: "Plan de membresía",
    membership_status: "Estado de la membresía",
    start_date: "Inicio",
    end_date: "Vencimiento",
  };
  return labels[key] ?? key.replaceAll("_", " ");
}

function auditValueText(value: unknown): string {
  if (value === null || value === undefined) return "Sin dato";
  if (typeof value === "boolean") return value ? "Sí" : "No";
  if (typeof value === "string") {
    const date = new Date(value);
    if (
      value.length >= 10 &&
      !Number.isNaN(date.getTime()) &&
      /^\d{4}-\d{2}-\d{2}/.test(value)
    ) {
      return date.toLocaleString();
    }
    return value;
  }
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(auditValueText).join(", ");
  if (typeof value === "object") {
    return Object.entries(value)
      .map(([key, item]) => `${auditFieldLabel(key)}: ${auditValueText(item)}`)
      .join(" · ");
  }
  return "Sin dato";
}

function AuditSnapshot({
  title,
  values,
}: {
  title: string;
  values: Record<string, unknown> | null;
}) {
  const entries = Object.entries(values ?? {}).filter(([key]) => key !== "id");
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {title}
      </h4>
      {entries.length ? (
        <dl className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
          {entries.map(([key, value]) => (
            <div key={key} className="min-w-0">
              <dt className="text-xs capitalize text-zinc-500">
                {auditFieldLabel(key)}
              </dt>
              <dd className="mt-1 break-words text-sm font-medium text-zinc-800">
                {key === "price" && typeof value === "number"
                  ? `$${value.toFixed(2)}`
                  : key === "duration_in_days" && typeof value === "number"
                    ? formatDuration(value)
                    : auditValueText(value)}
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="text-sm text-zinc-500">Sin valores anteriores.</p>
      )}
    </div>
  );
}

export function ManagerOverviewSection() {
  const [signupDays, setSignupDays] = useState<SignupDay[]>([]);
  const [membershipStatusDays, setMembershipStatusDays] = useState<
    MembershipStatusDay[]
  >([]);
  const [membershipStatusTotals, setMembershipStatusTotals] = useState({
    pending: 0,
    enrolled: 0,
  });
  const [membershipStatusLoading, setMembershipStatusLoading] = useState(true);
  const [membershipStatusError, setMembershipStatusError] = useState<
    string | null
  >(null);
  const [hoveredSignupIndex, setHoveredSignupIndex] = useState<number | null>(
    null,
  );
  const [signupsLoading, setSignupsLoading] = useState(true);
  const [signupsError, setSignupsError] = useState<string | null>(null);
  const [attendance, setAttendance] = useState<AttendanceTotals>({
    morning: 0,
    afternoon: 0,
    evening: 0,
  });
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSignups() {
      setSignupsLoading(true);
      setSignupsError(null);
      try {
        const today = new Date();
        const dates = Array.from({ length: 7 }, (_, index) => {
          const date = new Date(today);
          date.setDate(today.getDate() - (6 - index));
          return date;
        });
        const supabase = createClient();
        const counts = await Promise.all(
          dates.map(async (date) => {
            const start = new Date(date);
            start.setHours(0, 0, 0, 0);
            const end = new Date(start);
            end.setDate(end.getDate() + 1);
            const { count, error } = await supabase
              .from("users")
              .select("id", { count: "exact", head: true })
              .gte("created_at", start.toISOString())
              .lt("created_at", end.toISOString());
            if (error) throw error;
            return {
              date: localDateValue(date),
              label: new Intl.DateTimeFormat("es", {
                weekday: "short",
                day: "2-digit",
              }).format(date),
              count: count ?? 0,
            };
          }),
        );
        if (!cancelled) setSignupDays(counts);
      } catch (error) {
        console.error("Could not load daily user registrations.", error);
        if (!cancelled) setSignupsError(getErrorMessage(error));
      } finally {
        if (!cancelled) setSignupsLoading(false);
      }
    }

    async function loadMembershipStatus() {
      setMembershipStatusError(null);
      try {
        const today = bogotaDateValue(new Date());
        const dates = Array.from({ length: 7 }, (_, index) =>
          addCalendarDays(today, index - 6),
        );
        const dateCounts = new Map(
          dates.map((date) => [
            date,
            { date, label: membershipDayLabel(date), pending: 0, enrolled: 0 },
          ]),
        );
        const supabase = createClient();
        const [usersResult, membershipsResult] = await Promise.all([
          supabase
            .from("users")
            .select("id, created_at, account_status, user_roles!user_id(role)"),
          supabase
            .from("client_memberships")
            .select("client_user_id")
            .eq("membership_status", "active")
            .lte("start_date", today)
            .gte("end_date", today),
        ]);
        if (usersResult.error) throw usersResult.error;
        if (membershipsResult.error) throw membershipsResult.error;

        const clientUsers = (usersResult.data ?? []).filter(
          (user) =>
            user.account_status === "active" &&
            user.user_roles.length === 1 &&
            user.user_roles[0]?.role === "client",
        );
        const activeMemberships = new Set(
          (membershipsResult.data ?? []).map(
            ({ client_user_id }) => client_user_id,
          ),
        );
        const activeClientIds = new Set(
          clientUsers.map(({ id }) => id).filter((id) => activeMemberships.has(id)),
        );

        let pending = 0;
        for (const user of clientUsers) {
          const isEnrolled = activeClientIds.has(user.id);
          if (!isEnrolled) pending += 1;

          const registeredDate = bogotaDateValue(new Date(user.created_at));
          const day = dateCounts.get(registeredDate);
          if (day) {
            if (isEnrolled) day.enrolled += 1;
            else day.pending += 1;
          }
        }

        if (!cancelled) {
          setMembershipStatusDays([...dateCounts.values()]);
          setMembershipStatusTotals({
            pending,
            enrolled: activeClientIds.size,
          });
        }
      } catch (error) {
        console.error("Could not load client membership status charts.", error);
        if (!cancelled) setMembershipStatusError(getErrorMessage(error));
      } finally {
        if (!cancelled) setMembershipStatusLoading(false);
      }
    }

    async function loadTodayAttendance() {
      setAttendanceLoading(true);
      setAttendanceError(null);
      try {
        const totals = await loadAttendanceTotals(localDateValue(new Date()));
        if (!cancelled) setAttendance(totals);
      } catch (error) {
        console.error("Could not load today's attendance summary.", error);
        if (!cancelled) setAttendanceError(getErrorMessage(error));
      } finally {
        if (!cancelled) setAttendanceLoading(false);
      }
    }

    async function loadRecentPlans() {
      setPlansLoading(true);
      setPlansError(null);
      try {
        const { data, error } = await createClient()
          .from("membership_plans")
          .select("id, plan_name, price, duration_in_days")
          .order("created_at", { ascending: false })
          .limit(6);
        if (error) throw error;
        if (!cancelled) setPlans(data ?? []);
      } catch (error) {
        console.error("Could not load recent membership plans.", error);
        if (!cancelled) setPlansError(getErrorMessage(error));
      } finally {
        if (!cancelled) setPlansLoading(false);
      }
    }

    void loadSignups();
    void loadMembershipStatus();
    void loadTodayAttendance();
    void loadRecentPlans();
    const membershipStatusIntervalId = window.setInterval(
      () => void loadMembershipStatus(),
      60_000,
    );
    return () => {
      cancelled = true;
      window.clearInterval(membershipStatusIntervalId);
    };
  }, []);

  const chartWidth = 640;
  const chartHeight = 220;
  const chartTop = 20;
  const chartBottom = 174;
  const maxSignupCount = Math.max(1, ...signupDays.map(({ count }) => count));
  const points = signupDays.map(({ count }, index) => ({
    x: 24 + (index * (chartWidth - 48)) / Math.max(1, signupDays.length - 1),
    y:
      chartBottom -
      (count / maxSignupCount) * (chartBottom - chartTop),
  }));
  const signupLine = smoothLinePath(points, chartTop, chartBottom);
  const signupArea = points.length
    ? `${signupLine} L ${points[points.length - 1].x} ${chartBottom} L ${points[0].x} ${chartBottom} Z`
    : "";
  const totalSignups = signupDays.reduce((sum, day) => sum + day.count, 0);
  const peakSignups = Math.max(0, ...signupDays.map(({ count }) => count));
  const lowSignups = signupDays.length
    ? Math.min(...signupDays.map(({ count }) => count))
    : 0;
  const averageSignups = signupDays.length
    ? (totalSignups / signupDays.length).toFixed(1)
    : "0";
  const hoveredPoint =
    hoveredSignupIndex === null ? null : points[hoveredSignupIndex];
  const maxAttendance = Math.max(
    1,
    attendance.morning,
    attendance.afternoon,
    attendance.evening,
  );
  const attendanceRows = [
    { label: "Mañana", hours: "06:00–12:00", value: attendance.morning },
    { label: "Tarde", hours: "12:00–18:00", value: attendance.afternoon },
    { label: "Noche", hours: "18:00–06:00", value: attendance.evening },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.9fr)]">
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm shadow-zinc-950/[0.02] sm:p-6">
          <SectionHeading
            icon={UsersIcon}
            title="Nuevos usuarios"
            description="Inscripciones registradas por día durante los últimos 7 días."
          />
          {signupsLoading ? (
            <SectionMessage error={null} loading empty={false} />
          ) : signupsError ? (
            <SectionMessage error={signupsError} loading={false} empty={false} />
          ) : (
            <div className="grid gap-5 lg:grid-cols-[minmax(120px,0.42fr)_minmax(0,1.58fr)] lg:items-center">
              <div className="flex items-center gap-3 lg:block">
                <span className="text-5xl font-semibold tabular-nums tracking-tight text-zinc-950">
                  {totalSignups}
                </span>
                <span className="text-sm text-zinc-600 lg:mt-3 lg:block">
                  inscripciones
                  <br className="hidden lg:block" /> en 7 días
                </span>
              </div>
              <div
                className="relative min-w-0 bg-white"
                onPointerLeave={() => setHoveredSignupIndex(null)}
              >
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  role="group"
                  aria-label="Gráfico de nuevas inscripciones de usuarios en los últimos 7 días"
                  className="h-48 w-full overflow-visible sm:h-56"
                >
                  {points.length > 1 && (
                    <>
                      <path d={signupArea} fill="#00c78a" fillOpacity="0.18" />
                      <path
                        d={signupLine}
                        fill="none"
                        stroke="#00c78a"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </>
                  )}
                  {points.map((point, index) => (
                    <g key={signupDays[index].date}>
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r="16"
                        fill="transparent"
                        tabIndex={0}
                        role="button"
                        aria-label={`${signupDays[index].label}: ${signupDays[index].count} usuarios`}
                        onPointerEnter={() => setHoveredSignupIndex(index)}
                        onFocus={() => setHoveredSignupIndex(index)}
                        onBlur={() => setHoveredSignupIndex(null)}
                      />
                      {hoveredSignupIndex === index && (
                        <circle
                          cx={point.x}
                          cy={point.y}
                          r="5"
                          fill="#00c78a"
                          stroke="#ffffff"
                          strokeWidth="3"
                          pointerEvents="none"
                        />
                      )}
                    </g>
                  ))}
                </svg>
                {hoveredPoint && hoveredSignupIndex !== null && (
                  <div
                    className="pointer-events-none absolute z-10 rounded-xl border border-white/10 bg-[#282331] px-3 py-2 shadow-lg"
                    style={{
                      left: `${(hoveredPoint.x / chartWidth) * 100}%`,
                      top: `${(hoveredPoint.y / chartHeight) * 100}%`,
                      transform:
                        hoveredPoint.y / chartHeight > 0.35
                          ? "translate(-50%, calc(-100% - 10px))"
                          : "translate(-50%, 10px)",
                    }}
                  >
                    <p className="whitespace-nowrap text-sm font-semibold text-white">
                      {signupDays[hoveredSignupIndex].count} usuarios
                    </p>
                    <p className="whitespace-nowrap text-xs capitalize text-violet-200/70">
                      {signupDays[hoveredSignupIndex].label}
                    </p>
                  </div>
                )}
                <div className="flex justify-between px-3 pb-3 text-[11px] capitalize text-zinc-500">
                  {signupDays.map((day) => (
                    <span key={day.date} className="text-center">
                      {day.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
          {!signupsLoading && !signupsError && (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 pt-4 text-xs text-zinc-600">
              <span>
                <span className="font-semibold text-zinc-800">
                  +{signupDays.at(-1)?.count ?? 0}
                </span>{" "}
                hoy
              </span>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                <span>{peakSignups} pico</span>
                <span className="text-zinc-400">·</span>
                <span>{lowSignups} mínimo</span>
                <span className="text-zinc-400">·</span>
                <span>{averageSignups} promedio</span>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm shadow-zinc-950/[0.02] sm:p-6">
          <SectionHeading
            icon={CalendarIcon}
            title="Asistencias por franja"
            description={`Registros de hoy · ${new Intl.DateTimeFormat("es", {
              dateStyle: "medium",
            }).format(new Date())}`}
          />
          {attendanceLoading ? (
            <SectionMessage error={null} loading empty={false} />
          ) : attendanceError ? (
            <SectionMessage error={attendanceError} loading={false} empty={false} />
          ) : (
            <div className="space-y-5">
              {attendanceRows.map((row) => (
                <div key={row.label}>
                  <div className="mb-2 flex items-baseline justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-zinc-800">{row.label}</p>
                      <p className="text-xs text-zinc-500">{row.hours}</p>
                    </div>
                    <span className="text-lg font-semibold tabular-nums text-zinc-900">
                      {row.value}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                    <div
                      className="h-full rounded-full bg-zinc-700 transition-[width]"
                      style={{
                        width: `${(row.value / maxAttendance) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {membershipStatusLoading ? (
          <>
            <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm shadow-zinc-950/[0.02] sm:p-6">
              <SectionMessage error={null} loading empty={false} />
            </section>
            <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm shadow-zinc-950/[0.02] sm:p-6">
              <SectionMessage error={null} loading empty={false} />
            </section>
          </>
        ) : membershipStatusError ? (
          <section className="lg:col-span-2">
            <SectionMessage
              error={membershipStatusError}
              loading={false}
              empty={false}
            />
          </section>
        ) : (
          <>
            <MembershipStatusChart
              title="Preinscripciones pendientes"
              description="Clientes que aún no tienen una membresía vigente."
              status="pending"
              total={membershipStatusTotals.pending}
              days={membershipStatusDays}
              color="#f59e0b"
              fill="rgba(245,158,11,0.16)"
            />
            <MembershipStatusChart
              title="Usuarios inscritos"
              description="Clientes con una membresía vigente."
              status="enrolled"
              total={membershipStatusTotals.enrolled}
              days={membershipStatusDays}
              color="#00c78a"
              fill="rgba(0,199,138,0.18)"
            />
          </>
        )}
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm shadow-zinc-950/[0.02] sm:p-6">
        <SectionHeading
          icon={TableIcon}
          title="Planes de membresía"
          description="Planes creados en el sistema."
        />
        {plansLoading ? (
          <SectionMessage error={null} loading empty={false} />
        ) : plansError ? (
          <SectionMessage error={plansError} loading={false} empty={false} />
        ) : plans.length === 0 ? (
          <SectionMessage error={null} loading={false} empty />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {plans.map((plan) => (
              <article
                key={plan.id}
                className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-white text-zinc-600 ring-1 ring-zinc-200">
                    <AnimatedIcon className="size-5">
                      <TableIcon className="size-5" />
                    </AnimatedIcon>
                  </div>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-zinc-500 ring-1 ring-zinc-200">
                    {formatDuration(plan.duration_in_days)}
                  </span>
                </div>
                <h3 className="mt-5 line-clamp-2 text-base font-semibold text-zinc-900">
                  {plan.plan_name}
                </h3>
                <p className="mt-2 text-2xl font-bold tracking-tight text-zinc-950">
                  ${Number(plan.price).toFixed(2)}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function UserAccountRow({
  user,
  managerId,
  busy,
  onSave,
  onToggleStatus,
}: {
  user: ManagerUser;
  managerId: string;
  busy: boolean;
  onSave: (fullName: string, selectedRoles: RoleName[]) => Promise<void>;
  onToggleStatus: () => Promise<void>;
}) {
  const [fullName, setFullName] = useState(user.full_name);
  const [selectedRoles, setSelectedRoles] = useState<RoleName[]>(
    user.user_roles
      .map(({ role }) => role)
      .filter((role) => role !== "manager"),
  );
  const isManagerAccount = user.id === managerId;
  const [validationError, setValidationError] = useState<string | null>(null);

  function toggleRole(role: RoleName) {
    setValidationError(null);
    setSelectedRoles((current) =>
      current.includes(role)
        ? current.filter((value) => value !== role)
        : [...current, role],
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const hasReadOnlyManagerRole = user.user_roles.some(
      ({ role }) => role === "manager",
    );
    if (selectedRoles.length === 0 && !hasReadOnlyManagerRole) {
      setValidationError("La cuenta debe conservar al menos un rol.");
      return;
    }
    if (!fullName.trim()) {
      setValidationError("El nombre no puede quedar vacío.");
      return;
    }
    setValidationError(null);
    await onSave(fullName.trim(), selectedRoles);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-4 border-b border-zinc-100 py-5 last:border-0 sm:grid-cols-[minmax(0,1.3fr)_minmax(180px,1fr)_auto] sm:items-start"
    >
      <div className="min-w-0">
        <label className="block text-xs font-medium text-zinc-500">
          Nombre
          <input
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className="mt-1 h-10 w-full rounded-lg border border-zinc-200 px-3 text-sm text-zinc-900 focus-visible:outline-2 focus-visible:outline-zinc-400"
          />
        </label>
        <p className="mt-1 truncate text-xs text-zinc-500">{user.email}</p>
        <p className="mt-2 text-xs">
          <span
            className={
              user.account_status === "active"
                ? "rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700"
                : "rounded-full bg-red-50 px-2.5 py-1 font-medium text-red-700"
            }
          >
            {user.account_status === "active" ? "Activa" : "Suspendida"}
          </span>
        </p>
      </div>
      <fieldset className="grid grid-cols-2 gap-x-3 gap-y-2">
        <legend className="mb-2 text-xs font-medium text-zinc-500">Roles</legend>
        {isManagerAccount && (
          <p className="col-span-2 text-xs text-zinc-500">
            Tus roles no se pueden modificar desde esta pantalla.
          </p>
        )}
        {roles.map((role) => (
          <label key={role.value} className="flex items-center gap-2 text-xs text-zinc-700">
            <input
              type="checkbox"
              checked={selectedRoles.includes(role.value)}
              onChange={() => toggleRole(role.value)}
              disabled={isManagerAccount || busy}
              className="size-4 accent-zinc-900"
            />
            {role.label}
          </label>
        ))}
      </fieldset>
      <div className="flex flex-wrap gap-2 sm:flex-col">
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-zinc-900 px-3 py-2 text-xs font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50"
        >
          Guardar cambios
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onToggleStatus}
          className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50"
        >
          {user.account_status === "active" ? "Suspender" : "Reactivar"}
        </button>
      </div>
      {validationError && (
        <p role="alert" className="text-xs text-red-600 sm:col-span-3">
          {validationError}
        </p>
      )}
    </form>
  );
}

export function ManagerUsersSection({ managerId }: { managerId: string }) {
  const [users, setUsers] = useState<ManagerUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function loadUsers() {
      setLoading(true);
      setError(null);
      try {
        const { data, error: queryError } = await createClient()
          .from("users")
          .select("id, full_name, email, account_status, user_roles!user_id(role)")
          .neq("id", managerId)
          .order("full_name");
        if (queryError) throw queryError;
        if (!cancelled) setUsers(data ?? []);
      } catch (loadError) {
        console.error("Could not load manager user accounts.", loadError);
        if (!cancelled) setError(getErrorMessage(loadError));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadUsers();
    return () => {
      cancelled = true;
    };
  }, [managerId, reloadKey]);

  async function handleCreateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const selectedRole = roles.find(
      ({ value }) => value === String(formData.get("role") ?? ""),
    )?.value;
    if (!selectedRole) {
      setFeedback("Selecciona un rol válido.");
      return;
    }

    setCreatingUser(true);
    setFeedback(null);
    try {
      const result = await createManagerUser({
        fullName: String(formData.get("fullName") ?? ""),
        email: String(formData.get("email") ?? ""),
        temporaryPassword: String(formData.get("temporaryPassword") ?? ""),
        role: selectedRole,
      });
      if (result.error) {
        setFeedback(result.error);
        if (result.id) setReloadKey((key) => key + 1);
        return;
      }

      const roleLabel = roles.find(({ value }) => value === selectedRole)?.label;
      setFeedback(
        `Cuenta creada con el rol ${roleLabel}. Entrega la contraseña temporal de forma segura.`,
      );
      setShowCreateForm(false);
      form.reset();
      setReloadKey((key) => key + 1);
    } catch (createError) {
      console.error("Could not create a manager-managed account.", createError);
      setFeedback(
        "No se pudo crear el usuario. Intenta de nuevo o revisa los datos.",
      );
    } finally {
      setCreatingUser(false);
    }
  }

  async function saveUser(user: ManagerUser, fullName: string, selectedRoles: RoleName[]) {
    setBusyUserId(user.id);
    setFeedback(null);
    try {
      const supabase = createClient();
      const { data: updatedUser, error: userError } = await supabase
        .from("users")
        .update({ full_name: fullName })
        .eq("id", user.id)
        .select("id")
        .maybeSingle();
      if (userError) throw userError;
      if (!updatedUser) throw new Error("La cuenta no se actualizó. Verifica los permisos de lectura en Supabase.");

      if (user.id !== managerId) {
        const currentRoles = user.user_roles
          .map(({ role }) => role)
          .filter((role) => role !== "manager");
        const rolesToAdd = selectedRoles.filter(
          (role) => role !== "manager" && !currentRoles.includes(role),
        );
        const rolesToRemove = currentRoles.filter(
          (role) => !selectedRoles.includes(role),
        );

        if (rolesToAdd.length) {
          const { error: insertError } = await supabase.from("user_roles").insert(
            rolesToAdd.map((role) => ({
              user_id: user.id,
              role,
              assigned_by_user_id: managerId,
            })),
          );
          if (insertError) throw insertError;
        }
        if (rolesToRemove.length) {
          const { error: deleteError } = await supabase
            .from("user_roles")
            .delete()
            .eq("user_id", user.id)
            .in("role", rolesToRemove);
          if (deleteError) throw deleteError;
        }
      }

      setFeedback(`Se guardaron los cambios de ${fullName}.`);
    } catch (saveError) {
      console.error("Could not update a manager-managed account.", saveError);
      setFeedback(
        `No se pudieron completar todos los cambios. La lista se actualizará para mostrar el estado real. ${getErrorMessage(saveError)}`,
      );
    } finally {
      setBusyUserId(null);
      setReloadKey((key) => key + 1);
    }
  }

  async function toggleStatus(user: ManagerUser) {
    setBusyUserId(user.id);
    setFeedback(null);
    const newStatus: AccountStatus =
      user.account_status === "active" ? "suspended" : "active";
    try {
      const { data, error: updateError } = await createClient()
        .from("users")
        .update({ account_status: newStatus })
        .eq("id", user.id)
        .select("id")
        .maybeSingle();
      if (updateError) throw updateError;
      if (!data) throw new Error("La cuenta no se actualizó. Verifica los permisos de lectura en Supabase.");
      setFeedback(
        newStatus === "suspended"
          ? `Se suspendió la cuenta de ${user.full_name}.`
          : `Se reactivó la cuenta de ${user.full_name}.`,
      );
    } catch (updateError) {
      console.error("Could not change user account status.", updateError);
      setFeedback(`No se pudo cambiar el estado de la cuenta. ${getErrorMessage(updateError)}`);
    } finally {
      setBusyUserId(null);
      setReloadKey((key) => key + 1);
    }
  }

  return (
    <section
      id="usuarios"
      className="scroll-mt-24 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm shadow-zinc-950/[0.02] sm:p-6"
    >
      <SectionHeading
        icon={UsersIcon}
        title="Usuarios y roles"
        description="Crea cuentas, asigna roles y conserva el historial al suspender una cuenta."
      />
      <p className="mb-4 text-xs text-zinc-500">
        El correo de acceso se muestra, pero no se edita aquí para evitar desincronizarlo de Supabase Auth.
      </p>
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => {
            setFeedback(null);
            setShowCreateForm((open) => !open);
          }}
          className="rounded-lg bg-zinc-900 px-4 py-2.5 text-xs font-medium text-white transition hover:bg-zinc-700"
        >
          {showCreateForm ? "Cancelar" : "Crear usuario"}
        </button>
      </div>
      {showCreateForm && (
        <form
          onSubmit={handleCreateUser}
          className="mb-6 grid gap-4 rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4 sm:grid-cols-2 sm:p-5"
        >
          <label className="block text-xs font-medium text-zinc-600">
            Nombre completo
            <input
              name="fullName"
              required
              autoComplete="name"
              className="mt-2 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus-visible:outline-2 focus-visible:outline-zinc-400"
            />
          </label>
          <label className="block text-xs font-medium text-zinc-600">
            Correo electrónico
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="mt-2 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus-visible:outline-2 focus-visible:outline-zinc-400"
            />
          </label>
          <label className="block text-xs font-medium text-zinc-600">
            Contraseña temporal
            <input
              name="temporaryPassword"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="mt-2 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus-visible:outline-2 focus-visible:outline-zinc-400"
            />
            <span className="mt-1 block font-normal text-zinc-500">
              Mínimo 8 caracteres. Entrégala de forma segura.
            </span>
          </label>
          <label className="block text-xs font-medium text-zinc-600">
            Rol
            <select
              name="role"
              required
              defaultValue="receptionist"
              className="mt-2 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus-visible:outline-2 focus-visible:outline-zinc-400"
            >
              {roles.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-center justify-end sm:col-span-2">
            <button
              type="submit"
              disabled={creatingUser}
              className="rounded-lg bg-zinc-900 px-4 py-2.5 text-xs font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50"
            >
              {creatingUser ? "Creando usuario…" : "Crear cuenta y asignar rol"}
            </button>
          </div>
        </form>
      )}
      {feedback && (
        <p role="status" className="mb-4 rounded-xl bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
          {feedback}
        </p>
      )}
      <SectionMessage
        error={error}
        loading={loading}
        empty={!users.length}
        emptyMessage="No hay otras cuentas para administrar."
      />
      {!loading && !error && users.map((user) => (
        <UserAccountRow
          key={`${user.id}-${user.account_status}-${user.full_name}-${user.user_roles
            .map(({ role }) => role)
            .sort()
            .join(",")}`}
          user={user}
          managerId={managerId}
          busy={busyUserId === user.id}
          onSave={(fullName, selectedRoles) =>
            saveUser(user, fullName, selectedRoles)
          }
          onToggleStatus={() => toggleStatus(user)}
        />
      ))}
    </section>
  );
}

function MembershipPlanForm({
  plan,
  busy,
  onSave,
  onCancel,
}: {
  plan?: MembershipPlan;
  busy: boolean;
  onSave: (values: { plan_name: string; price: number; duration_in_days: number }) => Promise<void>;
  onCancel?: () => void;
}) {
  const [name, setName] = useState(plan?.plan_name ?? "");
  const [price, setPrice] = useState(plan ? String(plan.price) : "");
  const [duration, setDuration] = useState(
    plan ? String(plan.duration_in_days) : "",
  );
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const numericPrice = Number(price);
    const numericDuration = Number(duration);
    if (!name.trim() || !Number.isFinite(numericPrice) || numericPrice <= 0) {
      setError("Ingresa un nombre y un precio mayor que cero.");
      return;
    }
    if (!Number.isInteger(numericDuration) || numericDuration <= 0) {
      setError("La duración debe ser un número entero de días mayor que cero.");
      return;
    }
    setError(null);
    await onSave({
      plan_name: name.trim(),
      price: numericPrice,
      duration_in_days: numericDuration,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_140px_160px_auto]">
      <label className="text-xs font-medium text-zinc-600">
        Nombre del plan
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          className="mt-1 h-10 w-full rounded-lg border border-zinc-200 px-3 text-sm text-zinc-900"
        />
      </label>
      <label className="text-xs font-medium text-zinc-600">
        Precio
        <input
          type="number"
          min="0.01"
          step="0.01"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          required
          className="mt-1 h-10 w-full rounded-lg border border-zinc-200 px-3 text-sm text-zinc-900"
        />
      </label>
      <label className="text-xs font-medium text-zinc-600">
        Duración (días)
        <input
          type="number"
          min="1"
          step="1"
          value={duration}
          onChange={(event) => setDuration(event.target.value)}
          required
          className="mt-1 h-10 w-full rounded-lg border border-zinc-200 px-3 text-sm text-zinc-900"
        />
      </label>
      <div className="flex items-end gap-2">
        <button
          type="submit"
          disabled={busy}
          className="h-10 rounded-lg bg-zinc-900 px-4 text-xs font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
        >
          {busy ? "Guardando…" : plan ? "Guardar" : "Crear plan"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="h-10 rounded-lg border border-zinc-200 px-3 text-xs text-zinc-600 hover:bg-zinc-50"
          >
            Cancelar
          </button>
        )}
      </div>
      {error && <p role="alert" className="text-xs text-red-600 sm:col-span-4">{error}</p>}
    </form>
  );
}

export function MembershipPlansSection() {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function loadPlans() {
      setLoading(true);
      setLoadError(null);
      try {
        const { data, error } = await createClient()
          .from("membership_plans")
          .select("id, plan_name, price, duration_in_days")
          .order("plan_name");
        if (error) throw error;
        if (!cancelled) setPlans(data ?? []);
      } catch (error) {
        console.error("Could not load membership plans.", error);
        if (!cancelled) setLoadError(getErrorMessage(error));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadPlans();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  async function savePlan(
    values: { plan_name: string; price: number; duration_in_days: number },
    planId?: string,
  ) {
    setBusy(true);
    setFeedback(null);
    try {
      const supabase = createClient();
      const query = planId
        ? supabase
            .from("membership_plans")
            .update(values)
            .eq("id", planId)
            .select("id")
            .maybeSingle()
        : supabase.from("membership_plans").insert(values).select("id").single();
      const { data, error } = await query;
      if (error) throw error;
      if (!data) throw new Error("No se guardó ningún plan. Verifica los permisos de lectura en Supabase.");
      setFeedback(planId ? "Se actualizó el plan." : "Se creó el plan.");
      setEditingId(null);
      setCreating(false);
    } catch (error) {
      console.error("Could not save membership plan.", error);
      setFeedback(`No se pudo guardar el plan. ${getErrorMessage(error)}`);
    } finally {
      setBusy(false);
      setReloadKey((key) => key + 1);
    }
  }

  return (
    <section
      id="planes"
      className="scroll-mt-24 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm shadow-zinc-950/[0.02] sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <SectionHeading
          icon={TableIcon}
          title="Planes de membresía"
          description="Crea y actualiza nombres, precios y duración de los planes."
        />
        {!creating && (
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setCreating(true);
            }}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-xs font-medium text-white hover:bg-zinc-700"
          >
            Nuevo plan
          </button>
        )}
      </div>
      {feedback && (
        <p role="status" className="mb-4 rounded-xl bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
          {feedback}
        </p>
      )}
      {creating && (
        <div className="mb-5 rounded-xl border border-zinc-200 p-4">
          <MembershipPlanForm
            busy={busy}
            onSave={(values) => savePlan(values)}
            onCancel={() => setCreating(false)}
          />
        </div>
      )}
      <SectionMessage error={loadError} loading={loading} empty={!plans.length && !creating} />
      {!loading && !loadError && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.id}
              className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-5"
            >
              {editingId === plan.id ? (
                <MembershipPlanForm
                  plan={plan}
                  busy={busy}
                  onSave={(values) => savePlan(values, plan.id)}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-white text-zinc-600 ring-1 ring-zinc-200">
                      <AnimatedIcon className="size-5">
                        <TableIcon className="size-5" />
                      </AnimatedIcon>
                    </div>
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-zinc-500 ring-1 ring-zinc-200">
                      {plan.duration_in_days} días
                    </span>
                  </div>
                  <h3 className="mt-5 line-clamp-2 text-base font-semibold text-zinc-900">
                    {plan.plan_name}
                  </h3>
                  <p className="mt-2 text-2xl font-bold tracking-tight text-zinc-950">
                    ${Number(plan.price).toFixed(2)}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setCreating(false);
                      setEditingId(plan.id);
                    }}
                    className="mt-4 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                  >
                    Editar
                  </button>
                </>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export function AttendanceReportSection() {
  const [date, setDate] = useState(() => localDateValue(new Date()));
  const [totals, setTotals] = useState<AttendanceTotals>({
    morning: 0,
    afternoon: 0,
    evening: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function loadAttendance() {
      setLoading(true);
      setError(null);
      try {
        const supabase = createClient();
        const { data: memberships, error: membershipError } = await supabase
          .from("client_memberships")
          .select("client_user_id")
          .eq("membership_status", "active")
          .lte("start_date", date)
          .gte("end_date", date);
        if (membershipError) throw membershipError;

        const activeClientIds = new Set(
          (memberships ?? []).map(({ client_user_id }) => client_user_id),
        );
        const nextTotals: AttendanceTotals = {
          morning: 0,
          afternoon: 0,
          evening: 0,
        };

        if (activeClientIds.size) {
          const start = new Date(`${date}T00:00:00`);
          const end = new Date(start);
          end.setDate(end.getDate() + 1);
          const { data: records, error: attendanceError } = await supabase
            .from("attendance_records")
            .select("client_user_id, attended_at")
            .gte("attended_at", start.toISOString())
            .lt("attended_at", end.toISOString());
          if (attendanceError) throw attendanceError;

          for (const record of records ?? []) {
            if (!activeClientIds.has(record.client_user_id)) continue;
            const hour = new Date(record.attended_at).getHours();
            if (hour >= 6 && hour < 12) nextTotals.morning += 1;
            else if (hour >= 12 && hour < 18) nextTotals.afternoon += 1;
            else nextTotals.evening += 1;
          }
        }
        if (!cancelled) setTotals(nextTotals);
      } catch (loadError) {
        console.error("Could not load attendance report.", loadError);
        if (!cancelled) setError(getErrorMessage(loadError));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadAttendance();
    return () => {
      cancelled = true;
    };
  }, [date, reloadKey]);

  return (
    <section
      id="asistencia"
      className="scroll-mt-24 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm shadow-zinc-950/[0.02] sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <SectionHeading
          icon={CalendarIcon}
          title="Asistencia por franja"
          description="Cuenta registros de clientes con membresía activa en la fecha elegida."
        />
        <label className="text-xs font-medium text-zinc-600">
          Fecha
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="mt-1 h-9 rounded-lg border border-zinc-200 px-2 text-sm"
          />
        </label>
      </div>
      <SectionMessage error={error} loading={loading} empty={false} />
      {!loading && !error && (
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: "Mañana · 06:00–12:00", value: totals.morning },
            { label: "Tarde · 12:00–18:00", value: totals.afternoon },
            { label: "Noche · 18:00–06:00", value: totals.evening },
          ].map((item) => (
            <article key={item.label} className="rounded-xl bg-zinc-50 p-4">
              <p className="text-xs text-zinc-500">{item.label}</p>
              <p className="mt-2 text-2xl font-semibold text-zinc-900">{item.value}</p>
              <p className="text-xs text-zinc-500">asistencias</p>
            </article>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={() => setReloadKey((key) => key + 1)}
        disabled={loading}
        className="mt-4 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
      >
        Actualizar reporte
      </button>
    </section>
  );
}

export function AuditLogSection() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [actorNames, setActorNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actorError, setActorError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function loadAudit() {
      setLoading(true);
      setError(null);
      setActorError(null);
      try {
        const supabase = createClient();
        const { data, error: auditError } = await supabase
          .from("audit_logs")
          .select(
            "id, changed_by_user_id, entity_name, entity_id, action_performed, previous_values, new_values, changed_at",
          )
          .order("changed_at", { ascending: false })
          .limit(100);
        if (auditError) throw auditError;
        const auditEntries = data ?? [];
        if (!cancelled) setEntries(auditEntries);
        const actorIds = [...new Set(auditEntries.map(({ changed_by_user_id }) => changed_by_user_id))];
        let names: Record<string, string> = {};
        if (actorIds.length) {
          const { data: actors, error: actorError } = await supabase
            .from("users")
            .select("id, full_name")
            .in("id", actorIds);
          if (actorError) {
            console.error("Could not load audit actor names.", actorError);
            if (!cancelled) setActorError(getErrorMessage(actorError));
          } else {
            names = Object.fromEntries(
              (actors ?? []).map(({ id, full_name }) => [id, full_name]),
            );
          }
        }
        if (!cancelled) {
          setActorNames(names);
        }
      } catch (loadError) {
        console.error("Could not load manager audit log.", loadError);
        if (!cancelled) setError(getErrorMessage(loadError));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadAudit();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  return (
    <section
      id="auditoria"
      className="scroll-mt-24 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm shadow-zinc-950/[0.02] sm:p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <SectionHeading
          icon={PieChartIcon}
          title="Registro de auditoría"
          description="Consulta los registros guardados por la base de datos; se muestran los 100 más recientes."
        />
        <button
          type="button"
          onClick={() => setReloadKey((key) => key + 1)}
          disabled={loading}
          className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
        >
          Actualizar
        </button>
      </div>
      <SectionMessage
        error={error}
        loading={loading}
        empty={!entries.length}
        emptyMessage="No hay registros visibles para esta sesión. Si sabes que audit_logs tiene filas, verifica la política RLS para el rol gerente."
      />
      {!loading && !error && actorError && (
        <p role="alert" className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Se cargaron los registros, pero no los nombres de quienes hicieron los cambios: {actorError}
        </p>
      )}
      {!loading && !error && entries.length > 0 && (
        <div className="space-y-4">
          {entries.map((entry) => (
            <article
              key={entry.id}
              className="rounded-2xl border border-zinc-200 bg-zinc-50/60 p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-zinc-200 pb-4">
                <span className="text-xs text-zinc-500">
                  {new Date(entry.changed_at).toLocaleString()}
                </span>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-zinc-700 ring-1 ring-zinc-200">
                  {actorNames[entry.changed_by_user_id] ?? entry.changed_by_user_id}
                </span>
                <span className="text-sm font-medium text-zinc-800">
                  {entry.entity_name}
                </span>
                <span className="rounded-full bg-zinc-200 px-3 py-1 text-xs font-semibold capitalize text-zinc-700">
                  {entry.action_performed === "create"
                    ? "Creó"
                    : entry.action_performed === "update"
                      ? "Actualizó"
                      : entry.action_performed === "delete"
                        ? "Eliminó"
                        : entry.action_performed}
                </span>
              </div>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <AuditSnapshot
                  title="Antes del cambio"
                  values={entry.previous_values}
                />
                <AuditSnapshot
                  title="Después del cambio"
                  values={entry.new_values}
                />
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

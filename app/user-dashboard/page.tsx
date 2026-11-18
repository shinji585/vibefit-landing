import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PendingAccount } from "@/components/pending-account";
import { getDashboardEntryPath } from "@/lib/dashboard-roles";
import {
  DashboardLoadingOverlay,
  DashboardMascot,
} from "@/components/dashboard-experience";

export const dynamic = "force-dynamic";

export default async function UserDashboardPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error) {
    throw error;
  }

  if (!data?.claims) {
    redirect("/#registro");
  }

  const userId = data.claims.sub;
  if (!userId) {
    redirect("/#registro");
  }

  const { data: roles, error: rolesError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  if (rolesError) {
    throw rolesError;
  }

  const roleNames = (roles ?? []).map(({ role }) => role);
  const entryPath = getDashboardEntryPath(roleNames);
  if (entryPath !== "/user-dashboard") {
    redirect(entryPath);
  }

  const uniqueRoles = new Set(roleNames);
  const isOnlyClient = uniqueRoles.size === 1 && uniqueRoles.has("client");

  if (!isOnlyClient) {
    return (
      <>
        <DashboardLoadingOverlay ready />
        <DashboardMascot />
        <main className="min-h-screen" />
      </>
    );
  }

  const dateParts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Bogota",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(new Date())
      .map(({ type, value }) => [type, value]),
  );
  const today = `${dateParts.year}-${dateParts.month}-${dateParts.day}`;
  const { data: membership, error: membershipError } = await supabase
    .from("client_memberships")
    .select("id")
    .eq("client_user_id", userId)
    .eq("membership_status", "active")
    .lte("start_date", today)
    .gte("end_date", today)
    .limit(1)
    .maybeSingle();

  if (membershipError) {
    throw membershipError;
  }

  if (!membership) {
    return <PendingAccount />;
  }

  return (
    <>
      <DashboardLoadingOverlay ready />
      <DashboardMascot />
      <main className="min-h-screen" />
    </>
  );
}

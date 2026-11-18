import { redirect } from "next/navigation";
import { CoachDashboard } from "@/components/coach-dashboard";
import { getDashboardEntryPath } from "@/lib/dashboard-roles";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CoachDashboardPage() {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getClaims();

  if (authError) {
    throw authError;
  }

  const userId = authData?.claims?.sub;
  if (!userId) {
    redirect("/login");
  }

  const [accountResult, rolesResult] = await Promise.all([
    supabase
      .from("users")
      .select("account_status, full_name, email")
      .eq("id", userId)
      .maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", userId),
  ]);

  if (accountResult.error) {
    throw accountResult.error;
  }
  if (rolesResult.error) {
    throw rolesResult.error;
  }

  if (accountResult.data?.account_status !== "active") {
    redirect("/login?error=inactive");
  }

  const roles = rolesResult.data ?? [];
  if (!roles.some(({ role }) => role === "coach")) {
    redirect(getDashboardEntryPath(roles.map(({ role }) => role)));
  }

  return (
    <CoachDashboard
      coachName={accountResult.data.full_name}
      coachEmail={accountResult.data.email}
    />
  );
}

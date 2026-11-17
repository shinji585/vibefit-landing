import { redirect } from "next/navigation";
import { ManagerDashboard } from "@/components/manager-dashboard";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ManagerDashboardPage() {
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
  if (!roles.some(({ role }) => role === "manager")) {
    if (roles.some(({ role }) => role === "receptionist")) {
      redirect("/receptionist-dashboard");
    }
    redirect("/user-dashboard");
  }

  return (
    <ManagerDashboard
      managerId={userId}
      managerName={accountResult.data.full_name}
      managerEmail={accountResult.data.email}
    />
  );
}

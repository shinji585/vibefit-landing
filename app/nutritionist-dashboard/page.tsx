import { redirect } from "next/navigation";
import { NutritionistDashboard } from "@/components/nutritionist-dashboard";
import { getDashboardEntryPath } from "@/lib/dashboard-roles";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function NutritionistDashboardPage() {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError) {
    throw authError;
  }
  if (!authData.user) {
    redirect("/login");
  }

  const [accountResult, rolesResult] = await Promise.all([
    supabase
      .from("users")
      .select("account_status, full_name, email")
      .eq("id", authData.user.id)
      .maybeSingle(),
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", authData.user.id),
  ]);

  if (accountResult.error) throw accountResult.error;
  if (rolesResult.error) throw rolesResult.error;

  if (accountResult.data?.account_status !== "active") {
    redirect("/login?error=inactive");
  }

  const roles = (rolesResult.data ?? []).map(({ role }) => role);
  if (!roles.includes("nutritionist")) {
    redirect(getDashboardEntryPath(roles));
  }

  return (
    <NutritionistDashboard
      nutritionistName={accountResult.data.full_name}
      nutritionistEmail={accountResult.data.email || authData.user.email || ""}
    />
  );
}

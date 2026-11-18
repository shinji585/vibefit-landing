import { redirect } from "next/navigation";
import { DashboardRoleChooser } from "@/components/dashboard-role-chooser";
import {
  getDashboardEntryPath,
  getDashboardRoleChoices,
} from "@/lib/dashboard-roles";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ChooseDashboardPage() {
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
      .select("account_status, full_name")
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

  const roleNames = (rolesResult.data ?? []).map(({ role }) => role);
  const entryPath = getDashboardEntryPath(roleNames);

  if (entryPath !== "/choose-dashboard") {
    redirect(entryPath);
  }

  return (
    <DashboardRoleChooser
      choices={getDashboardRoleChoices(roleNames)}
      accountName={accountResult.data.full_name}
    />
  );
}

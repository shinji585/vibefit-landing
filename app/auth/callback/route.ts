import { createClient } from "@/lib/supabase/server";
import { getDashboardEntryPath } from "@/lib/dashboard-roles";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const requestedPath = request.nextUrl.searchParams.get("next");
  const requestedDestination = new URL(
    requestedPath ?? "/user-dashboard",
    request.url,
  );
  const destination =
    requestedDestination.origin === request.nextUrl.origin
      ? requestedDestination
      : new URL("/user-dashboard", request.url);

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const { data: authData, error: claimsError } =
        await supabase.auth.getClaims();
      if (claimsError) {
        console.error("Could not verify the OAuth session.", claimsError);
        return NextResponse.redirect(
          new URL("/auth/auth-code-error", request.url),
        );
      }

      const userId = authData?.claims?.sub;
      if (userId) {
        const { data: roles, error: rolesError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId);
        if (rolesError) {
          console.error("Could not load roles after OAuth sign-in.", rolesError);
          return NextResponse.redirect(
            new URL("/auth/auth-code-error", request.url),
          );
        }

        const roleDestination = getDashboardEntryPath(
          (roles ?? []).map(({ role }) => role),
        );

        return NextResponse.redirect(
          destination.pathname === "/user-dashboard" ||
            roleDestination === "/choose-dashboard"
            ? new URL(roleDestination, request.url)
            : destination,
        );
      }

      return NextResponse.redirect(destination);
    }

    console.error("Could not exchange the Supabase auth code.", error);
  }

  return NextResponse.redirect(
    new URL("/auth/auth-code-error", request.url),
  );
}

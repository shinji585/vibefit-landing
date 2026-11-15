import { createClient } from "@/lib/supabase/server";
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
      return NextResponse.redirect(destination);
    }

    console.error("Could not exchange the Supabase auth code.", error);
  }

  return NextResponse.redirect(
    new URL("/auth/auth-code-error", request.url),
  );
}

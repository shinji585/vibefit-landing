import { SplitLoginForm } from "@/components/split-login-form";

type LoginPageProps = {
  searchParams: Promise<{ mode?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { mode } = await searchParams;

  return (
    <SplitLoginForm initialMode={mode === "signup" ? "signup" : "login"} />
  );
}

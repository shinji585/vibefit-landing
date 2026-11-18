"use client";

import { useEffect, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
} from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ArrowLeft, ArrowRight, MousePointer2 } from "lucide-react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import Image from "next/image";
import Link from "next/link";
import { login } from "@/app/actions/auth";
import { createClient } from "@/lib/supabase/client";
import {
  cancelDashboardLoading,
  startDashboardLoading,
} from "@/lib/dashboard-loading";
import { DashboardLoadingOverlay } from "@/components/dashboard-experience";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function GoogleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="size-5"
      viewBox="0 0 48 48"
      aria-hidden="true"
    >
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-2.641-.21-5.236-.611-7.743z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.022 35.026 44 30.038 44 24c0-2.641-.21-5.236-.611-7.743z"
      />
    </svg>
  );
}

const credentialsSchema = z.object({
  fullName: z.string(),
  email: z.string().email("Escribe un correo válido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  confirmPassword: z.string(),
});

const signupDetailsSchema = z
  .object({
    fullName: z.string().trim().min(1, "Escribe tu nombre completo"),
    password: z.string().min(8, "Mínimo 8 caracteres"),
    confirmPassword: z.string().min(8, "Mínimo 8 caracteres"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof credentialsSchema>;
type AuthMode = "login" | "signup";

type SplitLoginFormProps = {
  initialMode?: AuthMode;
};

export function SplitLoginForm({
  initialMode = "login",
}: SplitLoginFormProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [message, setMessage] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [interacted, setInteracted] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const spotlightMask = useMotionTemplate`radial-gradient(180px circle at ${mouseX}px ${mouseY}px, black, transparent)`;

  useEffect(() => {
    cancelDashboardLoading();

    function resetLoginLoading() {
      setGoogleLoading(false);
      cancelDashboardLoading();
    }

    window.addEventListener("pageshow", resetLoginLoading);
    window.addEventListener("popstate", resetLoginLoading);
    return () => {
      window.removeEventListener("pageshow", resetLoginLoading);
      window.removeEventListener("popstate", resetLoginLoading);
    };
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const isSignup = mode === "signup";
  const illustration = isSignup ? "/Lifestyle.lottie" : "/fitness.lottie";

  function toggleMode() {
    setMode((current) => (current === "login" ? "signup" : "login"));
    setMessage(null);
    form.clearErrors();
  }

  function handleMouseMove(event: React.MouseEvent<HTMLElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    mouseX.set(event.clientX - rect.left);
    mouseY.set(event.clientY - rect.top);
    if (!interacted) setInteracted(true);
  }

  async function handleGoogleSignIn() {
    setMessage(null);
    setGoogleLoading(true);
    startDashboardLoading();

    try {
      const supabase = createClient();
      const redirectTo = new URL("/auth/callback", window.location.origin);
      redirectTo.searchParams.set("next", "/user-dashboard");
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: redirectTo.toString() },
      });

      if (error) {
        console.error("Supabase Google sign-in failed.", error);
        cancelDashboardLoading();
        setMessage({
          ok: false,
          text: "No se pudo iniciar sesión con Google. Intenta de nuevo.",
        });
        setGoogleLoading(false);
      }
    } catch (error) {
      console.error("Unexpected error while signing in with Google.", error);
      cancelDashboardLoading();
      setMessage({
        ok: false,
        text: "No se pudo iniciar sesión con Google. Intenta de nuevo más tarde.",
      });
      setGoogleLoading(false);
    }
  }

  async function handleSubmit(values: FormValues) {
    setMessage(null);
    form.clearErrors();

    if (!isSignup) {
      startDashboardLoading();
      const result = await login({
        email: values.email,
        password: values.password,
      });

      if (result?.error) {
        cancelDashboardLoading();
        form.setError("root", { message: result.error });
      }
      return;
    }

    const signupDetails = signupDetailsSchema.safeParse(values);
    if (!signupDetails.success) {
      for (const issue of signupDetails.error.issues) {
        const field = issue.path[0];
        if (field === "fullName" || field === "confirmPassword") {
          form.setError(field, { message: issue.message });
        }
      }
      return;
    }

    try {
      const supabase = createClient();
      const emailRedirectTo = new URL("/auth/callback", window.location.origin);
      emailRedirectTo.searchParams.set("next", "/user-dashboard");
      const { data, error } = await supabase.auth.signUp({
        email: values.email.trim().toLowerCase(),
        password: values.password,
        options: {
          data: { full_name: signupDetails.data.fullName },
          emailRedirectTo: emailRedirectTo.toString(),
        },
      });

      if (error) {
        console.error("Supabase sign-up failed.", error);
        setMessage({
          ok: false,
          text: "No se pudo crear la cuenta. Revisa los datos e intenta de nuevo.",
        });
        return;
      }

      if (data.session) {
        startDashboardLoading();
        window.location.assign("/user-dashboard");
        return;
      }

      setMessage({
        ok: true,
        text: "Preinscripción enviada. Esto no activa una membresía ni completa tu inscripción; recepción te orientará para finalizarla. Si la plataforma solicita verificar tu correo, sigue esa indicación.",
      });
    } catch (error) {
      console.error("Unexpected error while creating an account.", error);
      setMessage({
        ok: false,
        text: "No se pudo crear la cuenta. Intenta de nuevo más tarde.",
      });
    }
  }

  const panelOrder = isSignup ? "lg:order-1" : "lg:order-2";
  const formOrder = isSignup ? "lg:order-2" : "lg:order-1";

  return (
    <main className="min-h-screen bg-white p-3 sm:p-6 lg:p-8">
      <DashboardLoadingOverlay ready={false} />
      <div className="mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-7xl grid-cols-1 overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-[0_24px_100px_rgba(0,0,0,0.08)] sm:min-h-[calc(100vh-3rem)] lg:grid-cols-2 lg:min-h-[min(820px,calc(100vh-4rem))]">
        <motion.aside
          layout
          transition={{ type: "spring", stiffness: 90, damping: 22 }}
          onMouseMove={handleMouseMove}
          className={`relative order-1 flex min-h-[360px] flex-col justify-between overflow-hidden p-6 text-zinc-900 sm:min-h-[400px] sm:p-10 lg:min-h-0 lg:p-12 ${panelOrder}`}
          style={{
            background:
              "radial-gradient(ellipse at 20% 0%, #E3D9FC 0%, transparent 55%), radial-gradient(ellipse at 90% 100%, #f7d9f5 0%, transparent 55%), #ffffff",
          }}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(145,115,205,0.18) 1px, transparent 1px), linear-gradient(to bottom, rgba(145,115,205,0.18) 1px, transparent 1px)",
              backgroundSize: "30px 30px",
              maskImage: "radial-gradient(ellipse at top left, black, transparent 75%)",
            }}
            aria-hidden="true"
          />
          <motion.div
            className="pointer-events-none absolute inset-0"
            animate={{ opacity: interacted ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(191,64,250,0.24) 1px, transparent 1px), linear-gradient(to bottom, rgba(191,64,250,0.24) 1px, transparent 1px)",
              backgroundSize: "30px 30px",
              WebkitMaskImage: spotlightMask,
              maskImage: spotlightMask,
            }}
            aria-hidden="true"
          />

          <AnimatePresence>
            {!interacted && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute bottom-4 right-5 z-10 hidden items-center gap-1.5 text-xs text-zinc-500 lg:flex"
              >
                <MousePointer2 className="size-3.5" aria-hidden="true" />
                Mueve el cursor para iluminar la cuadrícula
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative z-10 flex items-center justify-between lg:block">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Image
                  src="/logorecojido.svg"
                  alt=""
                  width={32}
                  height={32}
                  className="size-8"
                />
                <span className="text-sm font-semibold tracking-wide text-zinc-900">
                  VibeFit
                </span>
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={mode}
                  initial={{ opacity: 0, x: isSignup ? 18 : -18 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: isSignup ? -18 : 18 }}
                  transition={{ duration: 0.25 }}
                >
                  <h2 className="text-xl font-semibold text-balance text-zinc-900 sm:text-2xl">
                    {isSignup ? "Tu cambio empieza hoy" : "Tu progreso te espera"}
                  </h2>
                  <p className="mt-1 max-w-xs text-sm text-zinc-600">
                    {isSignup
                      ? "Completa tu preinscripción para que recepción prepare tu ingreso."
                      : "Entra y sigue entrenando con tu plan al día."}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
            <motion.div
              layout
              className="relative mt-2 flex h-36 w-full items-center justify-center sm:h-48 lg:my-auto lg:mt-4 lg:h-[390px]"
            >
              <div
                className="pointer-events-none absolute bottom-8 left-1/2 h-16 w-2/3 -translate-x-1/2 rounded-[50%] bg-violet-300/35 blur-2xl"
                aria-hidden="true"
              />
              <AnimatePresence mode="wait">
                <motion.div
                  key={illustration}
                  initial={{ opacity: 0, x: isSignup ? 30 : -30, scale: 0.96 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: isSignup ? -30 : 30, scale: 0.96 }}
                  transition={{ duration: 0.35 }}
                  className="relative flex h-full w-full max-w-lg items-center justify-center drop-shadow-xl"
                >
                  <DotLottieReact src={illustration} loop autoplay />
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>

          <div className="relative z-10 mt-4 flex items-center justify-between gap-4 lg:mt-0">
            <Button
              type="button"
              variant="outline"
              onClick={toggleMode}
              className="h-10 rounded-full border-zinc-300 bg-white/70 px-5 text-zinc-900 backdrop-blur-sm hover:bg-white"
            >
              {isSignup ? "Iniciar sesión" : "Solicitar preinscripción"}
              {isSignup ? (
                <ArrowLeft aria-hidden="true" />
              ) : (
                <ArrowRight aria-hidden="true" />
              )}
            </Button>
            <span className="text-xs text-zinc-600">
              {isSignup ? "Únete a VibeFit" : "Entrena a tu manera"}
            </span>
          </div>
        </motion.aside>

        <motion.section
          layout
          transition={{ type: "spring", stiffness: 90, damping: 22 }}
          className={`relative order-2 flex items-center justify-center px-6 py-8 sm:px-12 sm:py-10 lg:px-14 lg:py-8 ${formOrder}`}
        >
          <div className="w-full max-w-md">
            <Link
              href="/"
              className="mb-8 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 hover:text-zinc-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Volver al inicio
            </Link>
            <div className="mb-8 space-y-2">
              <AnimatePresence mode="wait">
                <motion.div
                  key={mode}
                  initial={{ opacity: 0, x: isSignup ? 16 : -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: isSignup ? -16 : 16 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-500">
                    {isSignup ? "Preinscripción" : "Bienvenido de nuevo"}
                  </p>
                  <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
                    {isSignup ? "Solicita tu preinscripción" : "Inicia sesión"}
                  </h1>
                  <p className="mt-2 text-sm text-zinc-500">
                    {isSignup
                      ? "Enviar tus datos no activa una membresía. Recepción completará tu inscripción en una sede."
                      : "Inicia sesión en tu cuenta para continuar."}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-5"
              noValidate
            >
              <AnimatePresence initial={false}>
                {isSignup && (
                  <motion.label
                    key="fullName"
                    initial={{ opacity: 0, height: 0, y: -8 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="block space-y-2 overflow-hidden text-sm font-medium text-zinc-700"
                  >
                    Nombre completo
                    <Input
                      autoComplete="name"
                      placeholder="Tu nombre y apellido"
                      aria-invalid={Boolean(form.formState.errors.fullName)}
                      {...form.register("fullName")}
                      className="mt-2 h-12 rounded-2xl border-zinc-200 bg-zinc-50/70 px-4 text-sm focus-visible:border-violet-400 focus-visible:ring-violet-300"
                    />
                    {form.formState.errors.fullName && (
                      <span className="block text-xs text-red-600">
                        {form.formState.errors.fullName.message}
                      </span>
                    )}
                  </motion.label>
                )}
              </AnimatePresence>

              <label className="block space-y-2 text-sm font-medium text-zinc-700">
                Correo electrónico
                <Input
                  type="email"
                  autoComplete="email"
                  spellCheck={false}
                  placeholder="tu@correo.com"
                  aria-invalid={Boolean(form.formState.errors.email)}
                  {...form.register("email")}
                  className="mt-2 h-12 rounded-2xl border-zinc-200 bg-zinc-50/70 px-4 text-sm focus-visible:border-violet-400 focus-visible:ring-violet-300"
                />
                {form.formState.errors.email && (
                  <span className="block text-xs text-red-600">
                    {form.formState.errors.email.message}
                  </span>
                )}
              </label>

              <label className="block space-y-2 text-sm font-medium text-zinc-700">
                Contraseña
                <Input
                  type="password"
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  placeholder={isSignup ? "Mínimo 8 caracteres" : "Tu contraseña"}
                  aria-invalid={Boolean(form.formState.errors.password)}
                  {...form.register("password")}
                  className="mt-2 h-12 rounded-2xl border-zinc-200 bg-zinc-50/70 px-4 text-sm focus-visible:border-violet-400 focus-visible:ring-violet-300"
                />
                {form.formState.errors.password && (
                  <span className="block text-xs text-red-600">
                    {form.formState.errors.password.message}
                  </span>
                )}
              </label>

              <AnimatePresence initial={false}>
                {isSignup && (
                  <motion.label
                    key="confirmPassword"
                    initial={{ opacity: 0, height: 0, y: -8 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="block space-y-2 overflow-hidden text-sm font-medium text-zinc-700"
                  >
                    Confirmar contraseña
                    <Input
                      type="password"
                      autoComplete="new-password"
                      placeholder="Repite tu contraseña"
                      aria-invalid={Boolean(form.formState.errors.confirmPassword)}
                      {...form.register("confirmPassword")}
                      className="mt-2 h-12 rounded-2xl border-zinc-200 bg-zinc-50/70 px-4 text-sm focus-visible:border-violet-400 focus-visible:ring-violet-300"
                    />
                    {form.formState.errors.confirmPassword && (
                      <span className="block text-xs text-red-600">
                        {form.formState.errors.confirmPassword.message}
                      </span>
                    )}
                  </motion.label>
                )}
              </AnimatePresence>

              {form.formState.errors.root && (
                <p role="alert" className="text-sm text-red-600">
                  {form.formState.errors.root.message}
                </p>
              )}
              {message && (
                <p
                  role="status"
                  className={`text-sm ${message.ok ? "text-green-700" : "text-red-600"}`}
                >
                  {message.text}
                </p>
              )}

              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="h-12 w-full rounded-2xl bg-zinc-950 text-sm text-white hover:bg-zinc-800"
              >
                {form.formState.isSubmitting
                  ? isSignup
                    ? "Enviando preinscripción..."
                    : "Iniciando sesión..."
                  : isSignup
                    ? "Enviar preinscripción"
                    : "Iniciar sesión"}
              </Button>
            </form>

            <div className="relative my-6 flex items-center justify-center">
              <span className="w-full border-t border-zinc-200" />
              <span className="absolute bg-white px-4 text-sm text-zinc-500">
                O continúa con
              </span>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || form.formState.isSubmitting}
              className="h-12 w-full gap-3 rounded-2xl border-zinc-200 bg-white text-sm font-medium text-zinc-800 hover:bg-zinc-50"
            >
              <GoogleIcon />
              {googleLoading ? "Conectando con Google..." : "Continuar con Google"}
            </Button>

            <p className="mt-6 text-center text-sm text-zinc-500">
              {isSignup ? "¿Ya tienes cuenta?" : "¿Aún no has iniciado tu preinscripción?"}{" "}
              <button
                type="button"
                onClick={toggleMode}
                className="font-medium text-zinc-900 underline decoration-zinc-300 underline-offset-4 transition-colors hover:decoration-zinc-900"
              >
                {isSignup ? "Inicia sesión" : "Preinscribirme"}
              </button>
            </p>
          </div>
        </motion.section>
      </div>
    </main>
  );
}

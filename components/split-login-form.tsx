"use client";

import { useState } from "react";
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
import { login } from "@/app/actions/auth";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  const [interacted, setInteracted] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const spotlightMask = useMotionTemplate`radial-gradient(180px circle at ${mouseX}px ${mouseY}px, black, transparent)`;

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

  async function handleSubmit(values: FormValues) {
    setMessage(null);
    form.clearErrors();

    if (!isSignup) {
      const result = await login({
        email: values.email,
        password: values.password,
      });

      if (result?.error) {
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
        window.location.assign("/user-dashboard");
        return;
      }

      setMessage({
        ok: true,
        text: "Cuenta creada. Revisa tu correo para confirmarla.",
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
      <div className="mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-7xl grid-cols-1 overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-[0_24px_100px_rgba(0,0,0,0.08)] sm:min-h-[calc(100vh-3rem)] lg:grid-cols-2 lg:min-h-[min(820px,calc(100vh-4rem))]">
        <motion.aside
          layout
          transition={{ type: "spring", stiffness: 90, damping: 22 }}
          onMouseMove={handleMouseMove}
          className={`relative order-1 flex min-h-[360px] flex-col justify-between overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-800 to-zinc-600 p-6 text-white sm:min-h-[400px] sm:p-10 lg:min-h-0 lg:p-12 ${panelOrder}`}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-50"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(255,255,255,0.16) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.16) 1px, transparent 1px)",
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
                "linear-gradient(to right, rgba(255,255,255,0.35) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.35) 1px, transparent 1px)",
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
                className="absolute bottom-4 right-5 z-10 hidden items-center gap-1.5 text-xs text-white/60 lg:flex"
              >
                <MousePointer2 className="size-3.5" aria-hidden="true" />
                Mueve el cursor para iluminar la cuadrícula
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative z-10 flex items-center justify-between lg:block">
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-white/65">
                VibeFit
              </p>
              <AnimatePresence mode="wait">
                <motion.div
                  key={mode}
                  initial={{ opacity: 0, x: isSignup ? 18 : -18 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: isSignup ? -18 : 18 }}
                  transition={{ duration: 0.25 }}
                >
                  <h2 className="text-xl font-semibold text-balance sm:text-2xl">
                    {isSignup ? "Tu cambio empieza hoy" : "Tu progreso te espera"}
                  </h2>
                  <p className="mt-1 max-w-xs text-sm text-white/70">
                    {isSignup
                      ? "Crea tu cuenta y entrena con un plan hecho para ti."
                      : "Entra y sigue entrenando con tu plan al día."}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
            <motion.div
              layout
              className="mt-2 flex h-28 w-full items-center justify-center sm:h-36 lg:mt-4 lg:h-[390px]"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={illustration}
                  initial={{ opacity: 0, x: isSignup ? 30 : -30, scale: 0.96 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: isSignup ? -30 : 30, scale: 0.96 }}
                  transition={{ duration: 0.35 }}
                  className="flex h-full w-full items-center justify-center"
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
              className="h-10 rounded-full border-white/30 bg-white/10 px-5 text-white backdrop-blur-sm hover:bg-white hover:text-zinc-950"
            >
              {isSignup ? "Iniciar sesión" : "Crear cuenta"}
              {isSignup ? (
                <ArrowLeft aria-hidden="true" />
              ) : (
                <ArrowRight aria-hidden="true" />
              )}
            </Button>
            <span className="text-xs text-white/65">
              {isSignup ? "Únete a VibeFit" : "Entrena a tu manera"}
            </span>
          </div>
        </motion.aside>

        <motion.section
          layout
          transition={{ type: "spring", stiffness: 90, damping: 22 }}
          className={`order-2 flex items-center justify-center px-6 py-10 sm:px-12 lg:px-14 ${formOrder}`}
        >
          <div className="w-full max-w-md">
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
                    {isSignup ? "Únete a la comunidad" : "Bienvenido de nuevo"}
                  </p>
                  <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
                    {isSignup ? "Crea tu cuenta" : "Inicia sesión"}
                  </h1>
                  <p className="mt-2 text-sm text-zinc-500">
                    {isSignup
                      ? "Completa tus datos para empezar a entrenar."
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
                      className="mt-2 h-11 rounded-md border-zinc-200 px-3 text-sm focus-visible:border-zinc-500 focus-visible:ring-zinc-300"
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
                  className="mt-2 h-11 rounded-md border-zinc-200 px-3 text-sm focus-visible:border-zinc-500 focus-visible:ring-zinc-300"
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
                  className="mt-2 h-11 rounded-md border-zinc-200 px-3 text-sm focus-visible:border-zinc-500 focus-visible:ring-zinc-300"
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
                      className="mt-2 h-11 rounded-md border-zinc-200 px-3 text-sm focus-visible:border-zinc-500 focus-visible:ring-zinc-300"
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
                className="h-11 w-full rounded-md bg-zinc-950 text-sm text-white hover:bg-zinc-800"
              >
                {form.formState.isSubmitting
                  ? isSignup
                    ? "Creando cuenta..."
                    : "Iniciando sesión..."
                  : isSignup
                    ? "Crear cuenta"
                    : "Iniciar sesión"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-zinc-500">
              {isSignup ? "¿Ya tienes cuenta?" : "¿No tienes cuenta?"}{" "}
              <button
                type="button"
                onClick={toggleMode}
                className="font-medium text-zinc-900 underline decoration-zinc-300 underline-offset-4 transition-colors hover:decoration-zinc-900"
              >
                {isSignup ? "Inicia sesión" : "Crea una gratis"}
              </button>
            </p>
          </div>
        </motion.section>
      </div>
    </main>
  );
}

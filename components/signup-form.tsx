"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type SignupFormState = {
  name: string;
  email: string;
  password: string;
  confirm: string;
};

type FormMessage = {
  ok: boolean;
  text: string;
};

const initialForm: SignupFormState = {
  name: "",
  email: "",
  password: "",
  confirm: "",
};

const inputClassName =
  "w-full rounded-sm border border-zinc-200 px-4 py-2.5 text-xs text-zinc-800 placeholder-zinc-400 transition-colors focus:border-zinc-300 focus:outline-none";

export function SignupForm() {
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState<FormMessage | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const updateField =
    (field: keyof SignupFormState) => (event: ChangeEvent<HTMLInputElement>) => {
      setForm((current) => ({ ...current, [field]: event.target.value }));
    };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (form.password !== form.confirm) {
      setMessage({ ok: false, text: "Las contraseñas no coinciden." });
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const emailRedirectTo = new URL("/auth/callback", window.location.origin);
      emailRedirectTo.searchParams.set("next", "/user-dashboard");

      const { data, error } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          data: { full_name: form.name.trim() },
          emailRedirectTo: emailRedirectTo.toString(),
        },
      });

      if (error) {
        console.error("Supabase sign-up failed.", error);
        setMessage({
          ok: false,
          text: "No se pudo enviar la preinscripción. Revisa los datos e intenta de nuevo.",
        });
        return;
      }

      if (data.session) {
        router.replace("/user-dashboard");
        router.refresh();
        return;
      }

      setMessage({
        ok: true,
        text: "Preinscripción enviada. Esto no activa una membresía; recepción te orientará para completar tu inscripción en una sede.",
      });
    } catch (error) {
      console.error("Unexpected error while creating an account.", error);
      setMessage({
        ok: false,
        text: "No se pudo enviar la preinscripción. Intenta de nuevo más tarde.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2"
    >
      <label className="flex flex-col gap-2 text-sm text-zinc-600">
        NOMBRE COMPLETO
        <input
          required
          autoComplete="name"
          value={form.name}
          onChange={updateField("name")}
          placeholder="Tu nombre y apellido"
          className={inputClassName}
        />
      </label>

      <label className="flex flex-col gap-2 text-sm text-zinc-600">
        CORREO ELECTRÓNICO
        <input
          required
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={updateField("email")}
          placeholder="tu@correo.com"
          className={inputClassName}
        />
      </label>

      <label className="flex flex-col gap-2 text-sm text-zinc-600">
        CONTRASEÑA
        <input
          required
          type="password"
          minLength={8}
          autoComplete="new-password"
          value={form.password}
          onChange={updateField("password")}
          placeholder="Mínimo 8 caracteres"
          className={inputClassName}
        />
      </label>

      <label className="flex flex-col gap-2 text-sm text-zinc-600">
        CONFIRMAR CONTRASEÑA
        <input
          required
          type="password"
          minLength={8}
          autoComplete="new-password"
          value={form.confirm}
          onChange={updateField("confirm")}
          placeholder="Repite tu contraseña"
          className={inputClassName}
        />
      </label>

      <div className="flex flex-col gap-3 sm:col-span-2">
        <button
          type="submit"
          disabled={loading}
          className="w-fit cursor-pointer rounded-full bg-black px-6 py-3.5 text-xs text-white transition-colors duration-200 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Enviando..." : "Enviar preinscripción"}
        </button>

        {message && (
          <p
            role="status"
            className={message.ok ? "text-sm text-green-700" : "text-sm text-red-600"}
          >
            {message.text}
          </p>
        )}

        <p className="text-sm text-zinc-500">
          ¿Ya tienes cuenta?{" "}
          <Link
            href="/login"
            className="group relative isolate inline-flex items-center overflow-hidden rounded px-2 py-1 underline underline-offset-2 transition-colors duration-700 hover:text-white focus-visible:text-white"
          >
            <span
              aria-hidden="true"
              className="absolute inset-0 -z-10 origin-left scale-x-0 bg-black transition-transform duration-700 ease-in-out group-hover:scale-x-100 group-focus-visible:scale-x-100"
            />
            <span className="relative">Inicia sesión</span>
          </Link>
        </p>
      </div>
    </form>
  );
}

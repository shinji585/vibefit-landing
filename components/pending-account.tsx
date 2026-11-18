"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { logout } from "@/app/actions/auth";
import {
  DashboardLoadingOverlay,
  DashboardMascot,
} from "@/components/dashboard-experience";
import { Button } from "@/components/ui/button";

export function PendingAccount() {
  const router = useRouter();

  useEffect(() => {
    const intervalId = window.setInterval(() => router.refresh(), 30_000);
    return () => window.clearInterval(intervalId);
  }, [router]);

  return (
    <>
      <DashboardLoadingOverlay ready />
      <DashboardMascot />
      <main className="min-h-screen bg-white p-3 sm:p-6 lg:p-8">
        <div className="mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-7xl grid-cols-1 overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-[0_24px_100px_rgba(0,0,0,0.08)] sm:min-h-[calc(100vh-3rem)] lg:min-h-[min(820px,calc(100vh-4rem))] lg:grid-cols-2">
          <aside
            className="relative flex min-h-[320px] flex-col justify-between overflow-hidden p-6 text-zinc-900 sm:min-h-[400px] sm:p-10 lg:p-12"
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
                maskImage:
                  "radial-gradient(ellipse at top left, black, transparent 75%)",
              }}
              aria-hidden="true"
            />
            <div className="relative z-10 flex items-center gap-2">
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
            <div className="relative z-10 mx-auto flex h-48 w-full max-w-lg items-center justify-center sm:h-64 lg:h-[390px]">
              <DotLottieReact src="/waiteaccess.lottie" loop autoplay />
            </div>
            <div className="relative z-10">
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-600">
                Preinscripción
              </p>
              <h2 className="mt-2 text-xl font-semibold text-zinc-900 sm:text-2xl">
                Tu camino en VibeFit comienza en recepción
              </h2>
            </div>
          </aside>

          <section className="flex items-center justify-center px-6 py-10 sm:px-12 lg:px-14">
            <div className="w-full max-w-md">
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-500">
                Estado de tu solicitud
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
                Tu solicitud fue enviada a recepción
              </h1>
              <p className="mt-4 text-sm leading-6 text-zinc-600">
                Tu preinscripción no completa tu inscripción ni activa una
                membresía. Recepción activará tu plan; mantente atento al correo
                con el que te preinscribiste y acércate a una de nuestras
                instalaciones para completar tu inscripción.
              </p>
              <form action={logout} className="mt-8">
                <Button
                  type="submit"
                  className="h-12 w-full rounded-2xl bg-zinc-950 text-sm text-white hover:bg-zinc-800"
                >
                  Cerrar sesión
                </Button>
              </form>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

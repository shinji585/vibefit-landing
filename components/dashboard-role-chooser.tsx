"use client";

import Link from "next/link";
import { CreatingAnimation } from "@/components/creating-animation";
import { OfficeAnimation } from "@/components/office-animation";
import type { DashboardRoleChoice } from "@/lib/dashboard-roles";

export function DashboardRoleChooser({
  choices,
  accountName,
}: {
  choices: DashboardRoleChoice[];
  accountName: string | null;
}) {
  return (
    <main className="min-h-screen bg-[#faf9fc] px-4 py-8 text-zinc-900 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 sm:mb-10">
          <p className="mb-2 text-sm font-medium uppercase tracking-[0.18em] text-zinc-500">
            VibeFit / Selección de dashboard
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {accountName ? `Bienvenido, ${accountName}` : "Bienvenido a VibeFit"}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600 sm:text-base">
            Elige el perfil con el que quieres continuar.
          </p>
        </header>

        <div className="grid gap-5 md:grid-cols-2">
          {choices.map((choice, index) => (
            <Link
              key={choice.role}
              href={choice.href}
              aria-label={`Entrar al ${choice.title}`}
              className={`group relative flex min-h-[680px] flex-col overflow-hidden rounded-[28px] border border-zinc-200/80 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-zinc-400 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-4 ${
                index % 2 === 0 ? "bg-white" : "bg-[#f3effb]"
              }`}
            >
              <div className="relative z-10 px-6 pb-5 pt-7 sm:px-8 sm:pt-8">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                  Perfil disponible
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                  {choice.label}
                </h2>
                <p className="mt-2 max-w-md text-sm leading-6 text-zinc-600">
                  {choice.description}
                </p>
              </div>

              <div className="mt-auto transition-transform duration-500 ease-out group-hover:scale-[1.02]">
                {choice.animation === "office" ? (
                  <OfficeAnimation className="w-full" />
                ) : (
                  <CreatingAnimation />
                )}
              </div>

              <span className="absolute bottom-5 left-6 z-20 text-sm font-medium text-zinc-700 transition-colors group-hover:text-black sm:left-8">
                Entrar a {choice.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}

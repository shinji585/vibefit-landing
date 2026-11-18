"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useEffect, useRef, type ComponentType, type SVGProps } from "react";
import { AnimatedIcon } from "@/components/animated-icon";
import {
  ChevronDownIcon,
  LayoutGridIcon,
  XIcon,
} from "@/components/dashboard-icons";

export type DashboardNavigationItem = {
  label: string;
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  aliases?: string[];
};

type DashboardSidebarProps = {
  items: DashboardNavigationItem[];
  activeSection: string;
  footerLabel: string;
  expanded: boolean;
  mobileOpen: boolean;
  onNavigate: (href: string) => void;
  onMobileOpenChange: (open: boolean) => void;
  onHoverChange: (hovered: boolean) => void;
};

export function DashboardSidebar({
  items,
  activeSection,
  footerLabel,
  expanded,
  mobileOpen,
  onNavigate,
  onMobileOpenChange,
  onHoverChange,
}: DashboardSidebarProps) {
  const hoverTimeoutRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (hoverTimeoutRef.current !== null) {
        window.clearTimeout(hoverTimeoutRef.current);
      }
    },
    [],
  );

  function scheduleHoverChange(hovered: boolean) {
    if (hoverTimeoutRef.current !== null) {
      window.clearTimeout(hoverTimeoutRef.current);
    }

    hoverTimeoutRef.current = window.setTimeout(() => {
      onHoverChange(hovered);
      hoverTimeoutRef.current = null;
    }, 100);
  }

  function handleMouseEnter() {
    if (hoverTimeoutRef.current !== null) {
      window.clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    if (!expanded) scheduleHoverChange(true);
  }

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-zinc-950/40 lg:hidden"
          onClick={() => onMobileOpenChange(false)}
          aria-label="Cerrar menú"
        />
      )}

      <aside
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => scheduleHoverChange(false)}
        className={`fixed inset-y-0 left-0 z-50 flex w-[18.125rem] flex-col border-r border-zinc-200 bg-white transition-[width,transform] duration-500 ease-in-out lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${expanded ? "lg:w-[18.125rem]" : "lg:w-[5.625rem]"}`}
      >
        <div
          className={`flex h-[72px] shrink-0 items-center border-b border-zinc-100 px-5 ${
            expanded ? "" : "lg:justify-center lg:px-3"
          }`}
        >
          <a
            href="#resumen"
            aria-label="VibeFit"
            className="flex min-w-0 items-center"
            onClick={(event) => {
              event.preventDefault();
              onNavigate("#resumen");
            }}
          >
            <span
              className={`relative flex h-11 shrink-0 items-center overflow-hidden rounded-xl bg-black transition-[width,background-color,padding] duration-500 ease-in-out ${
                expanded
                  ? "w-[126px] px-3"
                  : "w-[126px] px-3 lg:w-11 lg:justify-center lg:bg-transparent lg:px-0"
              }`}
            >
              <Image
                src="/logorecojido.svg?v=2"
                alt=""
                aria-hidden="true"
                width={44}
                height={44}
                priority
                className={`absolute left-0 top-0 h-11 w-auto shrink-0 transition-opacity duration-200 ${
                  expanded ? "opacity-0" : "opacity-0 lg:opacity-100"
                }`}
              />
              <Image
                src="/logo.svg"
                alt=""
                aria-hidden="true"
                width={119}
                height={35}
                priority
                className={`absolute left-3 top-1/2 h-[30px] w-auto -translate-y-1/2 transition-opacity duration-200 ${
                  expanded ? "opacity-100" : "opacity-100 lg:opacity-0"
                }`}
              />
            </span>
          </a>
          <button
            type="button"
            className="flex size-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 lg:hidden"
            onClick={() => onMobileOpenChange(false)}
            aria-label="Cerrar menú"
          >
            <AnimatedIcon className="size-5">
              <XIcon className="size-5" />
            </AnimatedIcon>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-6">
          <p
            className={`mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-400 ${
              !expanded ? "lg:hidden" : ""
            }`}
          >
            Menú
          </p>
          <ul className="space-y-1.5">
            <li>
              <motion.a
                href="#resumen"
                whileHover="hover"
                whileTap="tap"
                onClick={(event) => {
                  event.preventDefault();
                  onNavigate("#resumen");
                }}
                title={!expanded ? "Dashboard" : undefined}
                aria-current={activeSection === "resumen" ? "page" : undefined}
                className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition hover:bg-zinc-100 hover:text-zinc-950 ${
                  activeSection === "resumen"
                    ? "bg-zinc-100 text-zinc-950"
                    : "text-zinc-600"
                } ${
                  expanded
                    ? "lg:gap-3"
                    : "lg:justify-center lg:gap-0 lg:px-0"
                }`}
              >
                <AnimatedIcon
                  className="size-6 shrink-0"
                  trigger="parent"
                  forceMotion
                >
                  <LayoutGridIcon className="size-6" />
                </AnimatedIcon>
                <span
                  className={`overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-300 ease-in-out ${
                    expanded
                      ? "max-w-48 opacity-100 delay-100"
                      : "max-w-48 opacity-100 lg:max-w-0 lg:opacity-0 lg:delay-0"
                  }`}
                >
                  Dashboard
                </span>
                <AnimatedIcon
                  effect="rotate"
                  className={`ml-auto size-4 ${!expanded ? "lg:hidden" : ""}`}
                  trigger="parent"
                  forceMotion
                >
                  <ChevronDownIcon
                    className={`size-4 transition-transform ${
                      expanded ? "-rotate-180" : ""
                    }`}
                  />
                </AnimatedIcon>
              </motion.a>
              <a
                href="#resumen"
                onClick={(event) => {
                  event.preventDefault();
                  onNavigate("#resumen");
                }}
                aria-current={activeSection === "resumen" ? "page" : undefined}
                className={`mt-1 flex min-h-10 items-center overflow-hidden rounded-lg px-3 text-sm font-medium transition-[max-height,margin,opacity] duration-300 ease-in-out hover:bg-zinc-100 ${
                  activeSection === "resumen"
                    ? "bg-zinc-100 text-zinc-800"
                    : "text-zinc-600"
                } ${
                  expanded
                    ? "ml-9 max-h-10 opacity-100 delay-100"
                    : "ml-9 max-h-10 opacity-100 lg:ml-0 lg:mt-0 lg:min-h-0 lg:max-h-0 lg:opacity-0 lg:delay-0"
                }`}
              >
                Resumen
              </a>
            </li>
            {items.map((item) => {
              const Icon = item.icon;
              const selected = activeSection === item.href.slice(1);

              return (
                <li key={item.href}>
                  <motion.a
                    href={item.href}
                    whileHover="hover"
                    whileTap="tap"
                    onClick={(event) => {
                      event.preventDefault();
                      onNavigate(item.href);
                    }}
                    title={!expanded ? item.label : undefined}
                    aria-current={selected ? "page" : undefined}
                    className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition hover:bg-zinc-100 hover:text-zinc-950 ${
                      selected ? "bg-zinc-100 text-zinc-950" : "text-zinc-600"
                    } ${
                      expanded
                        ? "lg:gap-3"
                        : "lg:justify-center lg:gap-0 lg:px-0"
                    }`}
                  >
                    <AnimatedIcon
                      className="size-6 shrink-0"
                      trigger="parent"
                      forceMotion
                    >
                      <Icon className="size-6" />
                    </AnimatedIcon>
                    <span
                      className={`overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-300 ease-in-out ${
                        expanded
                          ? "max-w-48 opacity-100 delay-100"
                          : "max-w-48 opacity-100 lg:max-w-0 lg:opacity-0 lg:delay-0"
                      }`}
                    >
                      {item.label}
                    </span>
                  </motion.a>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-zinc-100 p-4">
          <div
            className={`rounded-xl bg-zinc-50 p-3 ${
              !expanded ? "lg:hidden" : ""
            }`}
          >
            <p className="truncate text-xs font-semibold text-zinc-800">
              VibeFit
            </p>
            <p className="mt-0.5 truncate text-xs text-zinc-500">
              {footerLabel}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}

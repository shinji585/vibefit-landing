"use client";

import Link from "next/link";
import Image from "next/image";
import React, { useState, useEffect } from "react";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <nav
        className={`fixed z-50 flex items-center justify-between left-1/2 -translate-x-1/2 transition-all duration-500 p-4 ${scrolled ? "lg:w-5xl w-[calc(100vw-14px)] bg-white/60 backdrop-blur-2xl rounded-full mt-4 pl-6 shadow" : "md:px-16 lg:px-24 xl:px-32 w-full"}`}
      >
        <Link href="/" aria-label="VibeFit - Inicio">
          <Image
            width={100}
            height={100}
            src="/logo.svg"
            alt="VibeFit"
            loading="eager"
            className={`transition-all duration-500 h-9 w-auto ${scrolled ? "invert opacity-80" : ""}`}
          />
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6 md:gap-10 text-sm">
          <a
            href="#inicio"
            className={`transition-colors duration-500 ${scrolled ? "text-zinc-800 hover:text-zinc-600" : "text-white hover:text-white/90"}`}
          >
            Inicio
          </a>
          <a
            href="#quienes-somos"
            className={`transition-colors duration-500 ${scrolled ? "text-zinc-800 hover:text-zinc-600" : "text-white hover:text-white/90"}`}
          >
            Quiénes somos
          </a>
          <a
            href="#comunidad"
            className={`transition-colors duration-500 ${scrolled ? "text-zinc-800 hover:text-zinc-600" : "text-white hover:text-white/90"}`}
          >
            Comunidad
          </a>
          <a
            href="#registro"
            className={`transition-colors duration-500 ${scrolled ? "text-zinc-800 hover:text-zinc-600" : "text-white hover:text-white/90"}`}
          >
            Únete
          </a>
        </div>

        <Link
          href="/login?mode=login"
          className={`group relative hidden md:flex h-10 w-40 items-center justify-center overflow-hidden text-sm font-medium transition-all duration-500 ${
            scrolled
              ? "bg-zinc-900 text-white hover:bg-zinc-800 rounded-full"
              : "bg-zinc-50 text-zinc-800 hover:bg-zinc-200 rounded-[6px]"
          }`}
        >
          <span className="absolute inset-0 flex items-center justify-center whitespace-nowrap transition-transform duration-200 group-hover:-translate-y-full">
            Iniciar sesión
          </span>
          <span className="absolute inset-0 flex items-center justify-center whitespace-nowrap translate-y-full transition-transform duration-200 group-hover:translate-y-0">
            Entrar a VibeFit
          </span>
        </Link>

        <button
          onClick={() => setMobileOpen(true)}
          className={`md:hidden p-2 rounded-md aspect-square font-medium transition cursor-pointer ${scrolled ? "text-zinc-800" : "text-white"}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 12h16" />
            <path d="M4 18h16" />
            <path d="M4 6h16" />
          </svg>
        </button>
      </nav>

      {/* Mobile Menu Overlay */}
      <div
        className={`${mobileOpen ? "max-md:w-full" : "max-md:w-0"} md:hidden max-md:fixed max-md:top-0 max-md:z-50 max-md:left-0 max-md:transition-all max-md:duration-300 max-md:overflow-hidden max-md:h-full max-md:bg-white/5 max-md:backdrop-blur max-md:flex-col max-md:justify-center flex items-center gap-6 md:gap-10 text-sm`}
      >
        <a
          href="#inicio"
          onClick={() => {
            setMobileOpen(false);
          }}
          className={`transition-colors duration-500 ${scrolled ? "text-zinc-800 hover:text-zinc-600" : "text-white hover:text-white/90"}`}
        >
          Inicio
        </a>
        <a
          href="#quienes-somos"
          onClick={() => {
            setMobileOpen(false);
          }}
          className={`transition-colors duration-500 ${scrolled ? "text-zinc-800 hover:text-zinc-600" : "text-white hover:text-white/90"}`}
        >
          Quiénes somos
        </a>
        <a
          href="#comunidad"
          onClick={() => {
            setMobileOpen(false);
          }}
          className={`transition-colors duration-500 ${scrolled ? "text-zinc-800 hover:text-zinc-600" : "text-white hover:text-white/90"}`}
        >
          Comunidad
        </a>
        <a
          href="#registro"
          onClick={() => {
            setMobileOpen(false);
          }}
          className={`transition-colors duration-500 ${scrolled ? "text-zinc-800 hover:text-zinc-600" : "text-white hover:text-white/90"}`}
        >
          Únete
        </a>

        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden bg-white text-zinc-800 p-2 rounded-md aspect-square font-medium transition cursor-pointer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>
    </>
  );
}

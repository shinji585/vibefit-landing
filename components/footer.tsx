"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

const exploreLinks = [
  { label: "Inicio", href: "#inicio" },
  { label: "Quiénes somos", href: "#quienes-somos" },
  { label: "Comunidad", href: "#comunidad" },
  { label: "Únete", href: "#registro" },
];

const socialLinks = ["Instagram", "LinkedIn", "X", "Facebook"];
const companyLinks = [
  "Sobre VibeFit",
  "Preguntas frecuentes",
  "Trabaja con nosotros",
];

function FooterLink({ href = "#", children }: {
  href?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.a
      href={href}
      className="transition-colors duration-200 hover:text-white"
      initial={{ y: 24, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ delay: 0.15, type: "spring", stiffness: 320, damping: 70 }}
    >
      {children}
    </motion.a>
  );
}

export function Footer() {
  return (
    <footer className="mt-32 w-full overflow-hidden bg-black px-4 pb-8 pt-16 text-white md:px-16 lg:px-24 xl:px-32">
      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-12 pb-16 lg:grid-cols-12 lg:gap-8">
          <div className="flex flex-col items-start gap-6 lg:col-span-7">
            <Link href="/" className="select-none">
              <Image
                src="/logo.svg"
                alt="VibeFit"
                width={119}
                height={35}
              />
            </Link>
            <p className="max-w-md text-sm/5.5 text-zinc-300">
              Entrena, cuida tus hábitos y sigue tu progreso con todo lo que
              necesitas para alcanzar tus objetivos en un solo lugar.
            </p>
          </div>

          <div className="flex flex-wrap justify-between gap-8 lg:col-span-5">
            <div className="flex flex-col gap-5">
              <span>Explorar</span>
              <div className="flex flex-col gap-3 text-xs text-zinc-300">
                {exploreLinks.map((item) => (
                  <FooterLink key={item.label} href={item.href}>
                    {item.label}
                  </FooterLink>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-5">
              <span>Redes sociales</span>
              <div className="flex flex-col gap-3 text-xs text-zinc-300">
                {socialLinks.map((label) => (
                  <FooterLink key={label}>{label}</FooterLink>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-5">
              <span>Empresa</span>
              <div className="flex flex-col gap-3 text-xs text-zinc-300">
                {companyLinks.map((label) => (
                  <FooterLink key={label}>{label}</FooterLink>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="h-px w-full bg-zinc-800" />
        <div className="flex flex-col items-center justify-between gap-4 pt-5 text-xs text-zinc-300 sm:flex-row">
          <p>© 2026 VibeFit. Todos los derechos reservados.</p>
          <div className="flex items-center gap-6">
            <FooterLink>Política de privacidad</FooterLink>
            <FooterLink>Términos del servicio</FooterLink>
            <FooterLink>Política de cookies</FooterLink>
          </div>
        </div>

        <svg
          aria-hidden="true"
          className="pointer-events-none absolute bottom-9 right-0 h-52.25 w-xl md:w-206.75"
          viewBox="0 0 827 209"
          fill="none"
        >
          <text
            x="0"
            y="180"
            fill="none"
            stroke="#27272a"
            strokeWidth="1"
            fontFamily="sans-serif"
            fontSize="180"
            fontWeight="600"
            letterSpacing="-8"
            textLength="827"
            lengthAdjust="spacingAndGlyphs"
          >
            VibeFit
          </text>
        </svg>
      </div>
    </footer>
  );
}

"use client";

import { HomeIcon } from "lucide-react";
import { motion } from "framer-motion";
import HeroVideo from "@/components/hero-video";


export function HeroSection() {
  return (
    <motion.section
      id="inicio"
      className="relative isolate min-h-screen w-full scroll-mt-24 overflow-hidden bg-black"
      initial={{ opacity: 0.4 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <HeroVideo />
      <div className="absolute inset-0 z-0 bg-black/40" />
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4">
        <motion.div
          className="bg-white/20 backdrop-blur text-sm text-white pl-2 pr-4 py-1 rounded-full flex items-center gap-2 border border-white/20"
          initial={{ y: -20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, type: "spring", stiffness: 320, damping: 70, mass: 1 }}
        >
          <HomeIcon size={16} />
          <p>Tu gimnasio, en un solo lugar</p>
        </motion.div>
        <motion.h1
          className="text-5xl md:text-[64px] text-zinc-50 font-medium max-w-3xl text-center mt-5 leading-tight"
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 240, damping: 70, mass: 1 }}
        >
          Entrena, registra y mejora cada día con nuestra aplicación de fitness.
        </motion.h1>
        <motion.p
          className="text-white max-w-120 text-center mt-3"
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, type: "spring", stiffness: 320, damping: 70, mass: 1 }}
        >
          Gestiona tu membresía, tus rutinas, tu alimentación y tu progreso desde un solo lugar. ¡Únete a nuestra comunidad y alcanza tus objetivos de fitness!
        </motion.p>
        <motion.div
          className="flex items-center gap-4 mt-8"
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 320, damping: 70, mass: 1 }}
        >
          <button className="bg-zinc-50 hover:bg-zinc-200 px-6 py-2.5 rounded-md text-zinc-800 text-sm font-medium cursor-pointer transition">
            Ver planes
          </button>
          <button className="border border-slate-200 text-zinc-50 px-5 py-2.5 rounded-md text-sm font-medium cursor-pointer transition group">
            <div className="relative overflow-hidden">
              <span className="block transition-transform duration-200 group-hover:-translate-y-full">
                Hablar con recepción
              </span>
              <span className="absolute top-0 left-0 block transition-transform duration-200 group-hover:translate-y-0 translate-y-full">
                Resuelve tus dudas
              </span>
            </div>
          </button>
        </motion.div>
      </div>
    </motion.section>
  );
}
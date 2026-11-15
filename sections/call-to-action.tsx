"use client";

import { MoveRight } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";

const gymImages = [
  { src: "/assets/gym1.webp", alt: "Entrenamiento en VibeFit", position: "left-[0%] top-4 -rotate-12" },
  { src: "/assets/gym2.webp", alt: "Rutina de gimnasio", position: "left-[20%] top-0 -rotate-4" },
  { src: "/assets/gym3.webp", alt: "Entrenamiento de fuerza", position: "left-[40%] top-5 rotate-4" },
  { src: "/assets/gym4.webp", alt: "Comunidad entrenando", position: "left-[60%] top-2 rotate-12" },
];

export function CallToAction() {
  return (
    <section className="py-36 px-4 md:px-16 lg:px-24 xl:px-32 w-full flex flex-col items-center justify-center text-center">
      <div className="max-w-4xl mx-auto flex flex-col items-center">
        <div className="group/cta-images relative mb-12 flex h-[200px] w-full max-w-sm select-none items-center justify-center overflow-hidden md:h-[220px] md:max-w-[760px] md:overflow-visible">
          {gymImages.map((image, index) => (
            <Image
              key={image.src}
              height={139}
              width={251}
              src={image.src}
              alt={image.alt}
              className={`absolute h-[95px] w-[150px] rounded-[10px] border-2 border-white object-cover shadow-md transition-all duration-500 ease-out md:h-[125px] md:w-[210px] ${
                image.position
              } ${index === 1 || index === 2 ? "z-10" : "z-0"} ${
                index === 0
                  ? "group-hover/cta-images:-translate-x-2 group-hover/cta-images:-rotate-[16deg]"
                  : index === 3
                    ? "group-hover/cta-images:translate-x-2 group-hover/cta-images:rotate-[16deg]"
                    : "group-hover/cta-images:-translate-y-2"
              }`}
            />
          ))}
        </div>

        <motion.h2 className="text-3xl md:text-[40px] text-zinc-800 tracking-tight max-w-[520px] mb-3"
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 240, damping: 70, mass: 1 }}
        >
          Tu próximo entrenamiento empieza aquí
        </motion.h2>

        <motion.p className="text-zinc-500 text-sm max-w-[400px] mb-7"
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, type: "spring", stiffness: 320, damping: 70, mass: 1 }}
        >
          Rutinas hechas para ti, seguimiento diario y un equipo que te acompaña. Escríbenos y recepción te ayuda a empezar.
        </motion.p>

        <motion.a href="/login?mode=signup" className="bg-black hover:bg-zinc-900 text-white text-sm px-5 py-3.5 rounded-lg transition-all duration-200 flex items-center gap-2 group"
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 320, damping: 70, mass: 1 }}
        >
          <span>Crear cuenta</span>
          <MoveRight size={16} className="transition-transform duration-200 group-hover:translate-x-1" />
        </motion.a>
      </div>
    </section>
  );
}

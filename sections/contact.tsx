"use client";

import { motion } from "framer-motion";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { SignupForm } from "@/components/signup-form";

export function Contact() {
    return (
        <section id="registro" className="scroll-mt-24 py-20 w-full flex items-center justify-center">
            <div className="max-w-5xl w-full mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

                <div className="flex flex-col">

                    <motion.div className="flex items-center gap-1.5"
                        initial={{ y: -20, opacity: 0 }}
                        whileInView={{ y: 0, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 320, damping: 70, mass: 1 }}
                    >
                        <span className="size-1.5 bg-zinc-900"></span>
                        <span className="text-sm text-zinc-900">
                            PREINSCRIPCIÓN
                        </span>
                    </motion.div>

                    <motion.h2 className="text-3xl md:text-[40px]/11 text-zinc-900 mt-5 leading-tight font-medium max-w-[400px]"
                        initial={{ y: 50, opacity: 0 }}
                        whileInView={{ y: 0, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ type: "spring", stiffness: 240, damping: 70, mass: 1 }}
                    >
                        Inicia tu preinscripción
                    </motion.h2>

                    <p className="mt-3 max-w-[400px] text-sm leading-6 text-zinc-600">
                        Enviar tus datos no activa una membresía. Completarás tu
                        inscripción y la activación de tu plan con recepción en
                        una de nuestras sedes.
                    </p>

                    <SignupForm />
                </div>

                <motion.div className="flex h-[320px] items-center justify-center bg-transparent sm:h-[455px]"
                    initial={{ y: 50, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ type: "spring", stiffness: 320, damping: 70, mass: 1 }}
                >
                    <DotLottieReact src="/Physio.lottie" loop autoplay />
                </motion.div>

            </div>
        </section>
    );
}

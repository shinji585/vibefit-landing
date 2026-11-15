import Image from "next/image";

const collageImages = [
    {
        src: "/assets/gallery-1.webp",
        alt: "Usuaria mostrando su progreso en el gimnasio",
        className: "left-[25%] top-[8%] z-20 h-[82%] w-[48%]",
    },
    {
        src: "/assets/gallery-2.webp",
        alt: "Entrenamiento en el gimnasio",
        className: "left-[1%] top-[2%] z-10 h-[43%] w-[34%]",
    },
    {
        src: "/assets/gallery-3.webp",
        alt: "Usuario entrenando con pesas",
        className: "right-[1%] top-0 z-10 h-[38%] w-[33%]",
    },
    {
        src: "/assets/gallery-4.webp",
        alt: "Usuarios compartiendo su entrenamiento",
        className: "bottom-[1%] right-0 z-30 h-[44%] w-[34%]",
    },
];

export function Gallery() {
    return (
        <section className="w-full px-4 py-20 md:px-16 md:py-28 lg:px-24 xl:px-32">
            <div className="mx-auto grid max-w-7xl items-center gap-12 md:grid-cols-2 md:gap-16 lg:gap-24">
                <div className="max-w-xl">
                    <div className="flex items-center gap-1.5">
                        <span className="size-1.5 bg-zinc-900" />
                        <span className="text-sm text-zinc-900">COMUNIDAD VIBEFIT</span>
                    </div>
                    <h2 className="mt-6 text-4xl leading-tight text-zinc-900 md:text-5xl">
                        Cada progreso tiene un equipo detrás
                    </h2>
                    <p className="mt-5 text-sm leading-relaxed text-zinc-600 md:text-base">
                        Nuestros usuarios trabajan por sus cambios físicos con el
                        acompañamiento de nuestros entrenadores. Cada rutina, hábito y
                        avance cuenta.
                    </p>
                </div>

                <div className="relative mx-auto h-[460px] w-full max-w-[560px] sm:h-[560px]">
                    {collageImages.map((image) => (
                        <div
                            key={image.src}
                            className={`absolute overflow-hidden rounded-xl border-4 border-white shadow-xl ${image.className}`}
                        >
                            <Image
                                src={image.src}
                                alt={image.alt}
                                fill
                                sizes="(max-width: 768px) 40vw, 260px"
                                className="object-cover brightness-90 contrast-110 saturate-75"
                            />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

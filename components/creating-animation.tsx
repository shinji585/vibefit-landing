"use client";

import { DotLottieReact } from "@lottiefiles/dotlottie-react";

export function CreatingAnimation() {
  return (
    <div
      className="relative isolate flex min-h-[550px] items-center justify-center overflow-hidden"
      aria-hidden="true"
      style={{
        background:
          "radial-gradient(ellipse at 18% 0%, #e3d9fc 0%, transparent 55%), radial-gradient(ellipse at 90% 100%, #f7d9f5 0%, transparent 55%), #ffffff",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(145,115,205,0.18) 1px, transparent 1px), linear-gradient(to bottom, rgba(145,115,205,0.18) 1px, transparent 1px)",
          backgroundSize: "30px 30px",
          maskImage: "radial-gradient(ellipse at top left, black, transparent 75%)",
        }}
      />
      <DotLottieReact
        src="/creating.lottie"
        loop
        autoplay
        width={550}
        height={550}
        className="relative z-10 max-w-full drop-shadow-xl"
        style={{ width: "min(100%, 550px)", height: "auto" }}
      />
    </div>
  );
}

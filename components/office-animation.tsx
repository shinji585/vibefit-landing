"use client";

import { DotLottieReact } from "@lottiefiles/dotlottie-react";

const officeAnimationSize = 500;

export function OfficeAnimation({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative isolate flex items-center justify-center overflow-hidden ${className}`}
      aria-hidden="true"
      style={{
        minHeight: officeAnimationSize,
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
          maskImage: "radial-gradient(ellipse at top left, black, transparent 75%)",
        }}
      />
      <DotLottieReact
        src="/office.lottie"
        loop
        autoplay
        width={officeAnimationSize}
        height={officeAnimationSize}
        className="relative z-10 max-w-full drop-shadow-xl"
        style={{ width: `min(100%, ${officeAnimationSize}px)`, height: "auto" }}
      />
    </div>
  );
}

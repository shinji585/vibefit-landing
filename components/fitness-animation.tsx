"use client";

import { DotLottieReact } from "@lottiefiles/dotlottie-react";

const animationWidth = 3840;
const animationHeight = 2160;

export function FitnessAnimation({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative isolate flex min-h-[300px] items-center justify-center overflow-hidden ${className}`}
      aria-hidden="true"
      style={{
        background:
          "radial-gradient(ellipse at 18% 0%, #e3d9fc 0%, transparent 55%), radial-gradient(ellipse at 90% 100%, #f7d9f5 0%, transparent 55%), #ffffff",
      }}
    >
      <DotLottieReact
        src="/fitness.lottie"
        loop
        autoplay
        width={animationWidth}
        height={animationHeight}
        className="relative z-10 max-w-full drop-shadow-xl"
        style={{
          width: `min(100%, ${animationWidth}px)`,
          height: "auto",
          aspectRatio: `${animationWidth} / ${animationHeight}`,
        }}
      />
    </div>
  );
}

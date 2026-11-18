"use client";

import { DotLottieReact } from "@lottiefiles/dotlottie-react";

const animationWidth = 1080;
const animationHeight = 880;

export function LifestyleAnimation({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative isolate flex items-center justify-center overflow-hidden ${className}`}
      aria-hidden="true"
      style={{
        minHeight: 440,
        background:
          "radial-gradient(ellipse at 18% 0%, #e3d9fc 0%, transparent 55%), radial-gradient(ellipse at 90% 100%, #f7d9f5 0%, transparent 55%), #ffffff",
      }}
    >
      <DotLottieReact
        src="/Lifestyle.lottie"
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

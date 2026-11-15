"use client";

import { DotLottieReact } from "@lottiefiles/dotlottie-react";

export default function GymAnimation() {
    return (
        <div className="flex h-full w-full items-center justify-center bg-transparent">
            <DotLottieReact src="/Running.lottie" loop autoplay />
        </div>
    );
}

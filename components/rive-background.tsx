"use client";

import { useRive, Layout, Fit, Alignment } from "@rive-app/react-canvas";

export default function RiveBackground() {
  const { RiveComponent } = useRive({
    src: "/gym.riv",
    autoplay: true,
    layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
  });

  return (
    <RiveComponent className="pointer-events-none absolute inset-0 h-full w-full" />
  );
}
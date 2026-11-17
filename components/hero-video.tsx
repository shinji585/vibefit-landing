"use client";

import { useRef, useState } from "react";

const videos = [
  "/videos/17263216_3840_2160_25fps.mp4",
  "/videos/13691997_1920_1080_24fps.mp4",
];

export default function HeroVideo() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [transitionIndex, setTransitionIndex] = useState<number | null>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const transitioning = useRef(false);
  const pendingIndex = useRef<number | null>(null);

  const startTransition = (fromIndex: number) => {
    if (transitioning.current) return;

    const nextIndex = (fromIndex + 1) % videos.length;
    const nextVideo = videoRefs.current[nextIndex];
    if (!nextVideo) return;

    transitioning.current = true;
    pendingIndex.current = nextIndex;
    nextVideo.currentTime = 0;
    nextVideo.play().catch((error: unknown) => {
      pendingIndex.current = null;
      transitioning.current = false;
      console.error("Could not play the next hero video.", error);
    });
  };

  return (
    <>
      {videos.map((src, index) => {
        const isVisible =
          index === currentIndex
            ? transitionIndex === null
            : index === transitionIndex;

        return (
          <video
            key={src}
            ref={(element) => {
              videoRefs.current[index] = element;
            }}
            className={`pointer-events-none absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-in-out ${
              isVisible ? "opacity-100" : "opacity-0"
            }`}
            src={src}
            autoPlay={index === currentIndex}
            muted
            loop
            playsInline
            preload={index === currentIndex ? "auto" : "none"}
            aria-hidden="true"
            tabIndex={-1}
            onTimeUpdate={(event) => {
              if (index !== currentIndex || transitioning.current) return;

              const { currentTime, duration } = event.currentTarget;
              if (Number.isFinite(duration) && duration - currentTime <= 2.5) {
                startTransition(index);
              }
            }}
            onEnded={() => startTransition(index)}
            onPlaying={() => {
              if (index !== pendingIndex.current) return;

              pendingIndex.current = null;
              setTransitionIndex(index);
            }}
            onTransitionEnd={(event) => {
              if (
                event.target !== event.currentTarget ||
                event.propertyName !== "opacity" ||
                index !== transitionIndex
              ) {
                return;
              }

              const previousVideo = videoRefs.current[currentIndex];
              if (previousVideo) {
                previousVideo.pause();
                previousVideo.currentTime = 0;
              }

              setCurrentIndex(index);
              setTransitionIndex(null);
              transitioning.current = false;
            }}
          />
        );
      })}
    </>
  );
}

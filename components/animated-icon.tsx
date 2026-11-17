"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

type AnimatedIconProps = {
  children: ReactNode;
  className?: string;
  effect?: "lift" | "ring" | "rotate";
  trigger?: "self" | "parent";
};

export function AnimatedIcon({
  children,
  className,
  effect = "lift",
  trigger = "self",
}: AnimatedIconProps) {
  const reduceMotion = useReducedMotion();
  const variants = {
    hover: reduceMotion
      ? { opacity: 0.82 }
      : effect === "ring"
        ? { rotate: [0, -5, 5, -4, 4, 0] }
        : effect === "rotate"
          ? { rotate: 8, scale: 1.04 }
          : { y: -1, scale: 1.06 },
    tap: reduceMotion ? { opacity: 0.82 } : { scale: 0.96 },
  };

  return (
    <motion.span
      aria-hidden="true"
      className={`inline-flex items-center justify-center ${className ?? ""}`}
      variants={variants}
      initial={false}
      whileHover={trigger === "self" ? "hover" : undefined}
      whileTap={trigger === "self" ? "tap" : undefined}
      transition={
        effect === "ring"
          ? { duration: 0.4, ease: "easeInOut" }
          : { type: "spring", stiffness: 420, damping: 30, mass: 0.35 }
      }
    >
      {children}
    </motion.span>
  );
}

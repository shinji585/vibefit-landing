"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  AnimatePresence,
  motion,
} from "framer-motion";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import {
  cancelDashboardLoading,
  hasDashboardLoading,
  hasDashboardLoadingMinDurationElapsed,
  subscribeToDashboardLoading,
  dashboardLoadingMinDurationMs,
  getDashboardLoadingStartedAt,
} from "@/lib/dashboard-loading";

export function DashboardLoadingOverlay({ ready = false }: { ready?: boolean }) {
  const active = useSyncExternalStore(
    subscribeToDashboardLoading,
    hasDashboardLoading,
    () => false,
  );
  const minimumDurationElapsed = useSyncExternalStore(
    subscribeToDashboardLoading,
    hasDashboardLoadingMinDurationElapsed,
    () => false,
  );

  useEffect(() => {
    if (!active || minimumDurationElapsed) return;
    const startedAt = getDashboardLoadingStartedAt();
    if (startedAt === null) return;
    const remaining = Math.max(
      0,
      dashboardLoadingMinDurationMs - (Date.now() - startedAt),
    );
    const timeoutId = window.setTimeout(
      () => window.dispatchEvent(new Event("vibefit:dashboard-entry-loading")),
      remaining,
    );
    return () => window.clearTimeout(timeoutId);
  }, [active, minimumDurationElapsed]);

  useEffect(() => {
    if (active && ready && minimumDurationElapsed) {
      cancelDashboardLoading();
    }
  }, [active, minimumDurationElapsed, ready]);

  const visible = active && (!ready || !minimumDurationElapsed);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="status"
          aria-live="polite"
          aria-label="Cargando tu dashboard"
          className="pointer-events-none fixed inset-0 z-[200] flex flex-col items-center justify-center gap-3 bg-[#f7f8fa]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.3, ease: "easeOut" } }}
        >
          <div className="size-40 sm:size-48">
            <DotLottieReact src="/loading.lottie" loop autoplay />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-zinc-900">
              Preparando tu dashboard
            </p>
            <span className="mt-2 inline-block h-1 w-8 rounded-full bg-[#00c78a]" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function DashboardMascot() {
  return null;
}

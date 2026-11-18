export const dashboardLoadingMinDurationMs = 2300;
const dashboardLoadingKey = "vibefit.dashboard-entry-loading";
const dashboardLoadingEvent = "vibefit:dashboard-entry-loading";
const dashboardLoadingMaxDurationMs = 60_000;

export function startDashboardLoading() {
  try {
    window.sessionStorage.setItem(dashboardLoadingKey, String(Date.now()));
    window.dispatchEvent(new Event(dashboardLoadingEvent));
  } catch (error) {
    console.error("Could not save dashboard loading state.", error);
  }
}

export function cancelDashboardLoading() {
  try {
    window.sessionStorage.removeItem(dashboardLoadingKey);
    window.dispatchEvent(new Event(dashboardLoadingEvent));
  } catch (error) {
    console.error("Could not clear dashboard loading state.", error);
  }
}

export function getDashboardLoadingStartedAt() {
  try {
    const storedValue = window.sessionStorage.getItem(dashboardLoadingKey);
    if (!storedValue) return null;
    const timestamp = Number(storedValue);
    const elapsed = Date.now() - timestamp;

    return Number.isFinite(timestamp) && elapsed >= 0 && elapsed < dashboardLoadingMaxDurationMs
      ? timestamp
      : null;
  } catch (error) {
    console.error("Could not read dashboard loading state.", error);
    return null;
  }
}

export function hasDashboardLoading() {
  return getDashboardLoadingStartedAt() !== null;
}

export function hasDashboardLoadingMinDurationElapsed() {
  const startedAt = getDashboardLoadingStartedAt();
  return (
    startedAt === null ||
    Date.now() - startedAt >= dashboardLoadingMinDurationMs
  );
}

export function subscribeToDashboardLoading(onChange: () => void) {
  window.addEventListener(dashboardLoadingEvent, onChange);
  return () => window.removeEventListener(dashboardLoadingEvent, onChange);
}

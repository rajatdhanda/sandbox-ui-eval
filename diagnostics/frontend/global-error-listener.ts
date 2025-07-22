// path: src/diagnostics/global-error-listener.ts
export function installGlobalErrorListeners() {
  const errors: any[] = [];
  window.addEventListener("error", (e) => {
    errors.push({ type: "window.error", message: e.message, stack: e.error?.stack });
  });
  window.addEventListener("unhandledrejection", (e) => {
    errors.push({ type: "unhandledrejection", reason: e.reason });
  });
  (window as any).__globalErrors__ = errors;
}
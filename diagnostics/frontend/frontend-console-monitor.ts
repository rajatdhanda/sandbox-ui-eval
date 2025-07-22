// path: src/diagnostics/frontend-console-monitor.ts
// Add this to your frontend test bootstrap or entry point!
export function monitorFrontendConsole() {
  const errors: any[] = [];
  const originalError = console.error;
  const originalWarn = console.warn;
  console.error = (...args) => {
    errors.push({ type: "error", args });
    originalError(...args);
  };
  console.warn = (...args) => {
    errors.push({ type: "warn", args });
    originalWarn(...args);
  };
  if (typeof window !== "undefined") {
    (window as any).__errorLog__ = errors;
  }
  // Optionally, dump errors to a file or endpoint after run
  return errors;
}
// Then call monitorFrontendConsole() at app/test start!
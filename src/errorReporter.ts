/**
 * Centralized error reporting function.
 * All code paths that handle unexpected errors MUST funnel through this function.
 * Never call console.error or Sentry.captureException directly at the call site.
 *
 * @param error The error object to report.
 * @param context Optional additional context about the error.
 */
export function reportError(error: unknown, context?: Record<string, unknown>) {
    // In a real application, this might report to Sentry or another service.
    // For now, it logs to the console with context.
    console.error("Metadump Error:", error, context ? JSON.stringify(context) : "");
}
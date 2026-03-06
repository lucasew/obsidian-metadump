export function reportError(message: string, error?: any, context?: any): void {
  // Centralized error reporting function.
  // This funnels all unexpected errors to ensure no silent failures occur.
  // If Sentry or another backend is added later, it will be integrated here.

  const errorDetails = {
    message,
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : error,
    context,
  };

  console.error("METADUMP_ERROR", JSON.stringify(errorDetails, null, 2));
}

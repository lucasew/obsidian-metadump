/**
 * Centralized error reporting function.
 * All unexpected errors must be funneled through this function.
 *
 * If Sentry is set up in the future, this is where it should be integrated.
 */
export function reportError(message: string, error?: any) {
	console.error(`[Error] ${message}`, error ? error : '');
}

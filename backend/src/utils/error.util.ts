/**
 * Custom error class for application-specific errors. This allows us to throw errors with specific status codes and messages, and handle them gracefully in our global error handler.
 */
export class AppError extends Error {
  public statusCode: number
  public layer: string // Layer where the error occurred (e.g., "Database", "Authentication", "Validation")
  public errorCode?: string // Custom machine-readable error code

  constructor(message: string, statusCode: number, layer: string = "Unknown", errorCode?: string) {
    super(message)
    this.statusCode = statusCode
    this.layer = layer
    this.errorCode = errorCode

    // Capture the stack trace (excluding the constructor)
    Error.captureStackTrace(this, this.constructor)
  }
}

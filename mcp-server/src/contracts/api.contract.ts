export type ApiError = {
  code: string
  message: string
  details?: unknown
}

export type ApiResponse<T> = {
  data: T | null
  error: ApiError | null
  meta: unknown
}

export const successResponse = <T>(data: T, meta: unknown = null): ApiResponse<T> => ({
  data,
  error: null,
  meta,
})

export const errorResponse = <T = never>(error: ApiError, meta: unknown = null): ApiResponse<T> => ({
  data: null,
  error,
  meta,
})

export const normalizeApiError = (body: unknown, fallbackMessage: string, fallbackCode: string): ApiError => {
  if (typeof body === 'string') {
    return { code: fallbackCode, message: body }
  }

  if (!body || typeof body !== 'object') {
    return { code: fallbackCode, message: fallbackMessage }
  }

  const record = body as Record<string, unknown>
  const nestedError = record.error && typeof record.error === 'object' ? record.error as Record<string, unknown> : null
  const message = nestedError?.message ?? record.message ?? record.error

  return {
    code: String(nestedError?.code ?? record.code ?? fallbackCode),
    message: typeof message === 'string' ? message : fallbackMessage,
    ...(nestedError?.details !== undefined && { details: nestedError.details }),
  }
}

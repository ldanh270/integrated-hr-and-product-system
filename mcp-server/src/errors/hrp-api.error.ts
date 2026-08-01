import type { ApiError } from '../contracts/api.contract.js'

export class HrpApiError extends Error {
  public readonly code: string
  public readonly status: number | undefined
  public readonly details: unknown

  constructor(error: ApiError, status?: number) {
    super(error.message)
    this.name = 'HrpApiError'
    this.code = error.code
    this.status = status
    this.details = error.details
  }
}

import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios'

import {
  errorResponse,
  normalizeApiError,
  successResponse,
  type ApiResponse,
} from '../contracts/api.contract.js'
import { HrpApiError } from '../errors/hrp-api.error.js'
import { createAuthedClient, hrpClient } from '../utils/hrp-client.js'

export type HrpApiSession = {
  jwt: string
  cookies?: string[]
}

export class HrpApiClient {
  constructor(private readonly client: AxiosInstance) {}

  public async request<T>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.request<T>(config)
      const body = response.data

      if (body && typeof body === 'object' && 'data' in body && 'error' in body) {
        return body as unknown as ApiResponse<T>
      }

      return successResponse(body)
    } catch (error: unknown) {
      if (!axios.isAxiosError(error)) {
        throw error
      }

      const apiError = normalizeApiError(
        error.response?.data,
        error.message || 'HRP API request failed',
        `HTTP_${error.response?.status ?? 'ERROR'}`,
      )
      return errorResponse(apiError, { status: error.response?.status ?? null })
    }
  }

  public async requestOrThrow<T>(config: AxiosRequestConfig): Promise<T> {
    const response = await this.request<T>(config)
    if (response.error) {
      throw new HrpApiError(response.error, this.statusFromMeta(response.meta))
    }
    return response.data as T
  }

  private statusFromMeta(meta: unknown): number | undefined {
    if (!meta || typeof meta !== 'object') return undefined
    const status = (meta as Record<string, unknown>).status
    return typeof status === 'number' ? status : undefined
  }
}

export const publicHrpApi = new HrpApiClient(hrpClient)

export const createHrpApiClient = (session: HrpApiSession): HrpApiClient =>
  new HrpApiClient(createAuthedClient(session))

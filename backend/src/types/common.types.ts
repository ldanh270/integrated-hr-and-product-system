export interface ApiResponse<T> {
  data: T | null
  error:
    | {
        message: string
        code: string
        meta?: any
      }
    | string
    | null
  meta?: PaginationMeta
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

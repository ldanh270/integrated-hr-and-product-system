export interface ApiResponse<T, TMeta = PaginationMeta> {
  data: T | null
  error:
    | {
        message: string
        code: string
        meta?: unknown
      }
    | string
    | null
  meta?: TMeta
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

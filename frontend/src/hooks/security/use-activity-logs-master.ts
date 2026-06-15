import { useActivityLogs } from "@/hooks/security/queries/use-security-query"
import type { ActivityLogQuery } from "@/types/security.types"

import { useCallback, useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { useDebounce } from "@/hooks/use-debounce"

/**
 * Master hook for managing Activity Logs page state and logic.
 * Handles pagination, filtering, search, and detail viewing with URL search parameters synchronization.
 */
export function useActivityLogsMaster() {
  const [searchParams, setSearchParams] = useSearchParams()

  const categoryParam = searchParams.get("category") || undefined
  const actionTypeParam = searchParams.get("actionType") || undefined
  const pageParam = searchParams.get("page") ? parseInt(searchParams.get("page")!, 10) : 1

  const [query, setQuery] = useState<ActivityLogQuery>({
    page: pageParam,
    limit: 20,
    category: categoryParam,
    actionType: actionTypeParam,
  })

  const [searchTerm, setSearchText] = useState("")
  const [viewingLogId, setViewingLogId] = useState<string | null>(null)

  // Sync search term with query using debounce
  const debouncedSearch = useDebounce(searchTerm, 500)

  const { data, isLoading, isFetching, isError, refetch } = useActivityLogs({
    ...query,
    employeeId: debouncedSearch || undefined, // Simple search by employeeId for now
  })

  // Synchronize state with URL search params on change
  useEffect(() => {
    const params = new URLSearchParams()
    if (query.category) params.set("category", query.category)
    if (query.actionType) params.set("actionType", query.actionType)
    if (query.page && query.page > 1) params.set("page", query.page.toString())

    const newStr = params.toString()
    const currentStr = searchParams.toString()
    if (newStr !== currentStr) {
      setSearchParams(params, { replace: true })
    }
  }, [query.category, query.actionType, query.page, searchParams, setSearchParams])

  // Synchronize URL search params to local state (e.g. back/forward navigation or dashboard click)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQuery((prev) => {
      if (
        prev.category === categoryParam &&
        prev.actionType === actionTypeParam &&
        prev.page === pageParam
      ) {
        return prev
      }
      return {
        ...prev,
        category: categoryParam,
        actionType: actionTypeParam,
        page: pageParam,
      }
    })
  }, [categoryParam, actionTypeParam, pageParam])

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value)
    setQuery((prev) => ({ ...prev, page: 1 }))
  }, [])

  const handleFilterChange = useCallback((key: keyof ActivityLogQuery, value: ActivityLogQuery[keyof ActivityLogQuery]) => {
    setQuery((prev) => ({ ...prev, [key]: value, page: 1 }))
  }, [])

  return {
    query,
    setQuery,
    searchTerm,
    handleSearch,
    handleFilterChange,
    viewingLogId,
    setViewingLogId,
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
  }
}

import {
  type ICreateRegimeCategoryPayload,
  type IRegimeCategory,
  regimeCategoryApi,
} from "@/lib/api/regime-category.api"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

const REGIME_CATEGORIES_QUERY_KEY = ["regime-categories"] as const

/** Provides cached regime categories and the category creation mutation. */
export function useRegimeCategories() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: REGIME_CATEGORIES_QUERY_KEY,
    queryFn: regimeCategoryApi.list,
  })

  const createMutation = useMutation({
    mutationFn: (payload: ICreateRegimeCategoryPayload) => regimeCategoryApi.create(payload),
    onSuccess: async (createdCategory) => {
      queryClient.setQueryData<IRegimeCategory[]>(
        REGIME_CATEGORIES_QUERY_KEY,
        (categories = []) => {
          if (categories.some((category) => category.id === createdCategory.id)) {
            return categories
          }

          return [...categories, createdCategory]
        },
      )

      await queryClient.invalidateQueries({ queryKey: REGIME_CATEGORIES_QUERY_KEY })
    },
  })

  return {
    categories: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    createCategory: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
  }
}

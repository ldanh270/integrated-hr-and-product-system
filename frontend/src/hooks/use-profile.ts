import {
  changePassword,
  getMyProfile,
  updateMyProfile,
  updatePersonalEmployeeLink,
  uploadAvatar,
} from "@/lib/api/profile.api.ts"
import type { ProfileDto, UpdateProfileDto } from "@/types/profile.types.ts"
import { useAuthStore } from "@/store/auth-store"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

const PROFILE_QUERY_KEY = ["profile", "me"]

export const useProfile = () => {
  return useQuery<ProfileDto>({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: getMyProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useUpdateProfile = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateProfileDto) => updateMyProfile(data),
    onSuccess: (updatedProfile) => {
      // Optimistically update the cache with the new profile data
      queryClient.setQueryData(PROFILE_QUERY_KEY, updatedProfile)
    },
  })
}

export const useUploadAvatar = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (file: File) => uploadAvatar(file),
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(PROFILE_QUERY_KEY, updatedProfile)
    },
  })
}

export const useChangePassword = () => {
  return useMutation({
    mutationFn: ({ oldPassword, newPassword }: { oldPassword: string; newPassword: string }) =>
      changePassword(oldPassword, newPassword),
  })
}

export const useUpdatePersonalEmployeeLink = () => {
  const queryClient = useQueryClient()
  const setAuth = useAuthStore((state) => state.setAuth)
  const user = useAuthStore((state) => state.user)

  return useMutation({
    mutationFn: (personalEmployeeId: string | null) =>
      updatePersonalEmployeeLink(personalEmployeeId),
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(PROFILE_QUERY_KEY, updatedProfile)
      void queryClient.invalidateQueries({ queryKey: ["my-schedule"] })
      void queryClient.invalidateQueries({ queryKey: ["attendance"] })
      if (user) {
        setAuth({
          ...user,
          personalEmployeeId: updatedProfile.personalEmployeeId ?? null,
          personalEmployee: updatedProfile.personalEmployee ?? null,
        })
      }
    },
  })
}

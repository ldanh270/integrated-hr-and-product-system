import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { getMyProfile, updateMyProfile, uploadAvatar, changePassword } from "@/lib/api/profile.api.ts"
import type { ProfileDto, UpdateProfileDto } from "@/types/profile.types.ts"

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


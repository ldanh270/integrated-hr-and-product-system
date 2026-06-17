import apiClient from "@/lib/api-client.ts"
import type { ApiResponse, ProfileDto, UpdateProfileDto } from "@/types/profile.types.ts"

/**
 * Fetches the authenticated user's profile
 */
export const getMyProfile = async (): Promise<ProfileDto> => {
  const response = await apiClient.get<ApiResponse<ProfileDto>>("/profile/me")
  if (response.data.status === "error" || !response.data.data) {
    throw new Error(response.data.message || "Failed to fetch profile")
  }
  return response.data.data
}

/**
 * Updates the authenticated user's profile
 */
export const updateMyProfile = async (data: UpdateProfileDto): Promise<ProfileDto> => {
  const response = await apiClient.patch<ApiResponse<ProfileDto>>("/profile/me", data)
  if (response.data.status === "error" || !response.data.data) {
    throw new Error(response.data.message || "Failed to update profile")
  }
  return response.data.data
}

/**
 * Uploads a new avatar for the authenticated user
 */
export const uploadAvatar = async (file: File): Promise<ProfileDto> => {
  const formData = new FormData()
  formData.append("avatar", file)

  const response = await apiClient.post<ApiResponse<ProfileDto>>("/profile/me/avatar", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  })

  if (response.data.status === "error" || !response.data.data) {
    throw new Error(response.data.message || "Failed to upload avatar")
  }
  return response.data.data
}

/**
 * Changes the authenticated user's password
 */
export const changePassword = async (oldPassword: string, newPassword: string): Promise<void> => {
  const response = await apiClient.post<ApiResponse<void>>("/profile/me/change-password", {
    oldPassword,
    newPassword,
  })
  if (response.data.status === "error") {
    throw new Error(response.data.message || "Failed to change password")
  }
}

export const updatePersonalEmployeeLink = async (
  personalEmployeeId: string | null,
): Promise<ProfileDto> => {
  const response = await apiClient.patch<ApiResponse<ProfileDto>>(
    "/profile/me/personal-employee-link",
    { personalEmployeeId },
  )
  if (response.data.status === "error" || !response.data.data) {
    throw new Error(response.data.message || "Failed to update personal employee link")
  }
  return response.data.data
}

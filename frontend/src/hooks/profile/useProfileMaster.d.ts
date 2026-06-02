import { z } from "zod"

export declare const profileFormSchema: z.ZodObject<
  {
    fullName: z.ZodString
    phone: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>
    dateOfBirth: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>
    nationalId: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>
    address: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>
  },
  z.core.$strip
>
export type ProfileFormValues = z.infer<typeof profileFormSchema>
export declare const passwordFormSchema: z.ZodObject<
  {
    oldPassword: z.ZodString
    newPassword: z.ZodString
    confirmPassword: z.ZodString
  },
  z.core.$strip
>
export type PasswordFormValues = z.infer<typeof passwordFormSchema>
export declare const useProfileMaster: () => {
  profile: NoInfer<import("../../types/profile.types").ProfileDto> | undefined
  isLoading: boolean
  isError: boolean
  activeTab: "password" | "profile"
  isEditing: boolean
  fileInputRef: import("react").RefObject<HTMLInputElement | null>
  passwordSuccessMsg: string | null
  passwordErrorMsg: string | null
  profileForm: import("react-hook-form").UseFormReturn<
    {
      fullName: string
      phone?: string | undefined
      dateOfBirth?: string | undefined
      nationalId?: string | undefined
      address?: string | undefined
    },
    any,
    {
      fullName: string
      phone?: string | undefined
      dateOfBirth?: string | undefined
      nationalId?: string | undefined
      address?: string | undefined
    }
  >
  passwordForm: import("react-hook-form").UseFormReturn<
    {
      oldPassword: string
      newPassword: string
      confirmPassword: string
    },
    any,
    {
      oldPassword: string
      newPassword: string
      confirmPassword: string
    }
  >
  handleEditClick: () => void
  handleCancelClick: () => void
  onProfileSubmit: (data: ProfileFormValues) => void
  onPasswordSubmit: (data: PasswordFormValues) => void
  handleAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleTabChange: (v: string) => void
  updateProfile: import("@tanstack/react-query").UseMutationResult<
    import("../../types/profile.types").ProfileDto,
    Error,
    import("../../types/profile.types").UpdateProfileDto,
    unknown
  >
  uploadAvatar: import("@tanstack/react-query").UseMutationResult<
    import("../../types/profile.types").ProfileDto,
    Error,
    File,
    unknown
  >
  changePasswordMut: import("@tanstack/react-query").UseMutationResult<
    void,
    Error,
    {
      oldPassword: string
      newPassword: string
    },
    unknown
  >
}

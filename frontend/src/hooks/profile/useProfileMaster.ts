import {
  useChangePassword,
  useProfile,
  useUpdateProfile,
  useUploadAvatar,
} from "@/hooks/use-profile"

import { useRef, useState } from "react"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

export const profileFormSchema = z.object({
  fullName: z.string().min(2, "Họ và tên tối thiểu 2 ký tự").max(100),
  phone: z
    .string()
    .regex(/^[0-9+\-\s()]{7,20}$/, "Số điện thoại không hợp lệ")
    .optional()
    .or(z.literal("")),
  dateOfBirth: z.string().optional().or(z.literal("")),
  nationalId: z.string().min(9, "CCCD/CMND tối thiểu 9 ký tự").max(20).optional().or(z.literal("")),
  address: z.string().max(500).optional().or(z.literal("")),
})

export type ProfileFormValues = z.infer<typeof profileFormSchema>

export const passwordFormSchema = z
  .object({
    oldPassword: z.string().min(1, "Mật khẩu hiện tại là bắt buộc"),
    newPassword: z
      .string()
      .min(8, "Mật khẩu mới phải có tối thiểu 8 ký tự")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        "Mật khẩu phải gồm ít nhất 1 chữ hoa, 1 chữ thường, 1 chữ số và 1 ký tự đặc biệt",
      ),
    confirmPassword: z.string().min(1, "Vui lòng nhập lại mật khẩu mới"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mật khẩu xác nhận không trùng khớp",
    path: ["confirmPassword"],
  })

export type PasswordFormValues = z.infer<typeof passwordFormSchema>

export const useProfileMaster = () => {
  const { data: profile, isLoading, isError } = useProfile()
  const updateProfile = useUpdateProfile()
  const uploadAvatar = useUploadAvatar()
  const changePasswordMut = useChangePassword()

  const [activeTab, setActiveTab] = useState<"profile" | "password">("profile")
  const [isEditing, setIsEditing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState<string | null>(null)
  const [passwordErrorMsg, setPasswordErrorMsg] = useState<string | null>(null)

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
  })

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
  })

  const handleEditClick = () => {
    if (profile) {
      profileForm.reset({
        fullName: profile.fullName || "",
        phone: profile.phone || "",
        dateOfBirth: profile.dateOfBirth || "",
        nationalId: profile.nationalId || "",
        address: profile.address || "",
      })
    }
    setIsEditing(true)
  }

  const handleCancelClick = () => {
    setIsEditing(false)
    profileForm.reset()
  }

  const onProfileSubmit = (data: ProfileFormValues) => {
    const updateData = {
      fullName: data.fullName,
      phone: data.phone || undefined,
      dateOfBirth: data.dateOfBirth || undefined,
      nationalId: data.nationalId || undefined,
      address: data.address || undefined,
    }

    updateProfile.mutate(updateData, {
      onSuccess: () => {
        setIsEditing(false)
        toast.success("Cập nhật thông tin hồ sơ thành công!")
      },
      onError: (err) => {
        const errorObj = err as { response?: { data?: { message?: string } } }
        const errorMsg = errorObj.response?.data?.message || "Không thể cập nhật thông tin hồ sơ"
        toast.error(errorMsg)
      },
    })
  }

  const onPasswordSubmit = (data: PasswordFormValues) => {
    setPasswordSuccessMsg(null)
    setPasswordErrorMsg(null)
    changePasswordMut.mutate(
      {
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
      },
      {
        onSuccess: () => {
          setPasswordSuccessMsg("Thay đổi mật khẩu thành công!")
          toast.success("Thay đổi mật khẩu thành công!")
          passwordForm.reset()
        },
        onError: (err) => {
          const errorObj = err as { response?: { data?: { message?: string } } }
          const errorMsg =
            errorObj.response?.data?.message || "Đổi mật khẩu thất bại. Vui lòng kiểm tra lại."
          setPasswordErrorMsg(errorMsg)
          toast.error(errorMsg)
        },
      },
    )
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    uploadAvatar.mutate(file, {
      onSuccess: () => {
        if (fileInputRef.current) fileInputRef.current.value = ""
        toast.success("Cập nhật ảnh đại diện thành công!")
      },
      onError: (err) => {
        const errorObj = err as { response?: { data?: { message?: string } } }
        const errorMsg = errorObj.response?.data?.message || "Không thể upload ảnh đại diện"
        toast.error(errorMsg)
      },
    })
  }

  const handleTabChange = (v: string) => {
    setActiveTab(v as "profile" | "password")
    setIsEditing(false)
    if (v === "password") {
      setPasswordSuccessMsg(null)
      setPasswordErrorMsg(null)
    }
  }

  return {
    profile,
    isLoading,
    isError,
    activeTab,
    isEditing,
    fileInputRef,
    passwordSuccessMsg,
    passwordErrorMsg,
    profileForm,
    passwordForm,
    handleEditClick,
    handleCancelClick,
    onProfileSubmit,
    onPasswordSubmit,
    handleAvatarChange,
    handleTabChange,
    updateProfile,
    uploadAvatar,
    changePasswordMut,
  }
}

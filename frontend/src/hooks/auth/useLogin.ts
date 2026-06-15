import { ROUTES } from "@/config/routes.config"
import { useAuth } from "@/hooks/use-auth.ts"
import { loginSchema } from "@/schemas/auth.schema.ts"
import type { LoginSchemaType } from "@/schemas/auth.schema.ts"

import { useState } from "react"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

export const useLogin = () => {
  const navigate = useNavigate()
  const { login, isLoggingIn, forgotPassword, isSendingForgotPassword } = useAuth()

  const [showPassword, setShowPassword] = useState(false)
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [forgotEmail, setForgotEmail] = useState("")

  const loginForm = useForm<LoginSchemaType>({
    resolver: zodResolver(loginSchema),
  })

  const { handleSubmit } = loginForm

  const onSubmit = async (data: LoginSchemaType) => {
    try {
      await login(data)
      navigate(ROUTES.HRM.DASHBOARD)
    } catch (error) {
      const err = error as {
        response?: { data?: { error?: { message?: string }; message?: string } }
      }
      toast.error(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          "Login failed. Please try again.",
      )
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgotEmail.trim()) {
      toast.error("Vui lòng nhập email")
      return
    }

    try {
      await forgotPassword({ email: forgotEmail })
      toast.success("Liên kết đặt lại mật khẩu đã được gửi đến email của bạn.")
      setShowForgotModal(false)
      setForgotEmail("")
    } catch (error) {
      const err = error as {
        response?: { data?: { error?: { message?: string }; message?: string } }
      }
      toast.error(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          "Có lỗi xảy ra khi gửi yêu cầu",
      )
    }
  }

  return {
    loginForm,
    showPassword,
    setShowPassword,
    showForgotModal,
    setShowForgotModal,
    forgotEmail,
    setForgotEmail,
    isLoggingIn,
    isSendingForgotPassword,
    onSubmit: handleSubmit(onSubmit),
    handleForgotPassword,
  }
}

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
  const [forgotUsername, setForgotUsername] = useState("")

  const loginForm = useForm<LoginSchemaType>({
    resolver: zodResolver(loginSchema),
  })

  const { handleSubmit, setError } = loginForm

  const onSubmit = async (data: LoginSchemaType) => {
    try {
      await login(data)
      navigate(ROUTES.HRM.DASHBOARD)
    } catch (error: any) {
      setError("root", {
        message: error.response?.data?.message || "Login failed. Please try again.",
      })
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgotUsername.trim()) {
      toast.error("Vui lòng nhập username")
      return
    }

    try {
      await forgotPassword({ username: forgotUsername })
      toast.success("Yêu cầu reset mật khẩu đã được gửi cho admin duyệt.")
      setShowForgotModal(false)
      setForgotUsername("")
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Có lỗi xảy ra khi gửi yêu cầu")
    }
  }

  return {
    loginForm,
    showPassword,
    setShowPassword,
    showForgotModal,
    setShowForgotModal,
    forgotUsername,
    setForgotUsername,
    isLoggingIn,
    isSendingForgotPassword,
    onSubmit: handleSubmit(onSubmit),
    handleForgotPassword,
  }
}

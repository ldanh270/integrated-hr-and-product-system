export declare const useLogin: () => {
  loginForm: import("react-hook-form").UseFormReturn<
    {
      username: string
      password: string
    },
    any,
    {
      username: string
      password: string
    }
  >
  showPassword: boolean
  setShowPassword: import("react").Dispatch<import("react").SetStateAction<boolean>>
  showForgotModal: boolean
  setShowForgotModal: import("react").Dispatch<import("react").SetStateAction<boolean>>
  forgotUsername: string
  setForgotUsername: import("react").Dispatch<import("react").SetStateAction<string>>
  isLoggingIn: boolean
  isSendingForgotPassword: boolean
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>
  handleForgotPassword: (e: React.FormEvent) => Promise<void>
}

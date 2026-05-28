import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useNavigate } from "react-router-dom"
import { LogIn } from "lucide-react"

import { Button } from "@/components/ui/button.tsx"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx"
import { Input } from "@/components/ui/input.tsx"
import { Label } from "@/components/ui/label.tsx"
import { useAuth } from "@/hooks/use-auth.ts"
import { loginSchema, LoginSchemaType } from "@/schemas/auth.schema.ts"

/**
 * Login page component
 * Implements a modern, centered card layout with Pill aesthetic
 */
export default function Login() {
  const navigate = useNavigate()
  const { login, isLoggingIn } = useAuth()

  // 1. Initialize form with Zod validation
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginSchemaType>({
    resolver: zodResolver(loginSchema),
  })

  /**
   * Form submission handler
   */
  const onSubmit = async (data: LoginSchemaType) => {
    try {
      await login(data)
      navigate("/dashboard")
    } catch (error: any) {
      // Handle API errors (e.g., invalid credentials)
      setError("root", {
        message: error.response?.data?.message || "Login failed. Please try again.",
      })
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-8">
      <Card className="w-full max-w-md shadow-lg transition-all hover:scale-[1.01]">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <LogIn size={24} />
          </div>
          <CardTitle className="text-3xl font-bold text-foreground">Welcome Back</CardTitle>
          <CardDescription className="text-muted-foreground mt-2">
            Enter your credentials to access your HRM dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Error Message */}
            {errors.root && (
              <div className="rounded-2xl bg-destructive/10 p-4 text-center text-sm font-medium text-destructive">
                {errors.root.message}
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="ml-4">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                {...register("email")}
                className={errors.email ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {errors.email && (
                <p className="ml-4 text-xs font-medium text-destructive">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-4">
                <Label htmlFor="password">Password</Label>
                <button
                  type="button"
                  className="text-xs font-medium text-primary hover:underline"
                  tabIndex={-1}
                >
                  Forgot password?
                </button>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register("password")}
                className={errors.password ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {errors.password && (
                <p className="ml-4 text-xs font-medium text-destructive">{errors.password.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold transition-all active:scale-95"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? "Authenticating..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
        <div className="pb-8 text-center">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <button type="button" className="font-semibold text-primary hover:underline">
              Contact HR
            </button>
          </p>
        </div>
      </Card>
    </div>
  )
}

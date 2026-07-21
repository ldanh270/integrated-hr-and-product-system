import { PageCard } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ROUTES } from "@/config/routes.config"
import { useAuthStore } from "@/store/auth-store"

import {
  ArrowLeft,
  Calendar,
  CreditCard,
  FileQuestion,
  FileText,
  FolderKanban,
  Home,
  Users,
} from "lucide-react"
import { useNavigate } from "react-router-dom"

export default function NotFound() {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  const handleGoHome = () => {
    navigate(isAuthenticated ? ROUTES.PERSONAL.BASE : ROUTES.AUTH.LOGIN)
  }

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      handleGoHome()
    }
  }

  const quickLinks = isAuthenticated
    ? [
        {
          label: "Lịch làm việc",
          icon: Calendar,
          path: ROUTES.PERSONAL.SCHEDULE,
        },
        {
          label: "Bảng lương",
          icon: CreditCard,
          path: ROUTES.PERSONAL.PAYSLIPS,
        },
        {
          label: "Dự án",
          icon: FolderKanban,
          path: ROUTES.PERSONAL.PROJECTS,
        },
        {
          label: "Đơn từ",
          icon: FileText,
          path: ROUTES.PERSONAL.APPLICATIONS,
        },
        {
          label: "Nhân sự",
          icon: Users,
          path: ROUTES.HRM.EMPLOYEES,
        },
      ]
    : [
        {
          label: "Đăng nhập hệ thống",
          icon: Home,
          path: ROUTES.AUTH.LOGIN,
        },
      ]

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 text-foreground md:p-8">
      <div className="flex w-full max-w-2xl flex-col items-center">
        <PageCard padding="lg" className="w-full text-center space-y-6 shadow-xs">
          {/* Header Icon & Status Badge */}
          <div className="flex flex-col items-center space-y-3 pt-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground border border-border">
              <FileQuestion className="h-6 w-6 text-foreground" />
            </div>

            <Badge variant="secondary" className="rounded-full px-3 py-0.5 text-xs font-medium text-muted-foreground">
              404 • Not Found
            </Badge>

            <h1 className="text-6xl font-bold tracking-tight text-foreground">404</h1>
          </div>

          {/* Title & Description */}
          <div className="space-y-1.5 px-2">
            <h2 className="text-xl font-semibold text-foreground">Trang không tồn tại</h2>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-md mx-auto">
              Đường dẫn không đúng, trang đã bị xóa hoặc tài khoản của bạn chưa được cấp quyền truy cập.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <Button onClick={handleGoHome} size="default" className="rounded-full px-5 text-xs font-medium">
              <Home className="mr-1.5 h-3.5 w-3.5" />
              {isAuthenticated ? "Về trang chủ" : "Đăng nhập"}
            </Button>

            <Button onClick={handleGoBack} variant="outline" size="default" className="rounded-full px-5 text-xs font-medium">
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
              Quay lại
            </Button>
          </div>

          {/* Quick Links (Wider single-row container) */}
          <div className="rounded-lg border border-border bg-muted/30 p-3.5 space-y-2.5 text-left">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
              Truy cập nhanh
            </p>

            <div className="flex flex-wrap items-center justify-between gap-2">
              {quickLinks.map((link) => {
                const Icon = link.icon
                return (
                  <button
                    key={link.path}
                    type="button"
                    onClick={() => navigate(link.path)}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground whitespace-nowrap transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <Icon className="h-3.5 w-3.5 text-foreground" />
                    {link.label}
                  </button>
                )
              })}
            </div>
          </div>
        </PageCard>

        <p className="mt-4 text-[11px] text-muted-foreground">
          Hệ thống HRP • Integrated HR & Product Management
        </p>
      </div>
    </div>
  )
}

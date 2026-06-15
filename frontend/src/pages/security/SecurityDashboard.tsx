import { PageCard, SectionHeader, StatusPill } from "@/components/common"
import { IconBox } from "@/components/common/icon-box"
import { Button } from "@/components/ui/button"
import { useSecuritySummary } from "@/hooks/security/queries/use-security-query"
import type { ActivityLogItem } from "@/types/security.types"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useNavigate } from "react-router-dom"

import {
  AlertTriangle,
  History,
  Lock,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserX,
} from "lucide-react"

const ACTION_LABELS: Record<string, string> = {
  login: "Đăng nhập thành công",
  logout: "Đăng xuất",
  failed_login: "Đăng nhập thất bại",
  role_assigned: "Gán vai trò",
  role_revoked: "Thu hồi vai trò",
  account_locked: "Khóa tài khoản",
  account_unlocked: "Mở khóa tài khoản",
}

const ACTION_VARIANTS: Record<string, "success" | "danger" | "warning" | "neutral"> = {
  login: "success",
  logout: "neutral",
  failed_login: "danger",
  role_assigned: "success",
  role_revoked: "warning",
  account_locked: "danger",
  account_unlocked: "success",
}

/**
 * Local component for rendering security events with complex layouts.
 * Isolates security-specific UI logic from shared common components.
 */
function SecurityEventRow({
  icon: Icon,
  label,
  subtitle,
  statusLabel,
  statusVariant,
  timestamp,
  colorClass,
  isLast,
}: {
  icon: LucideIcon
  label: string
  subtitle: string
  statusLabel: string
  statusVariant: "success" | "danger" | "warning" | "neutral"
  timestamp: string
  colorClass: string
  isLast?: boolean
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between py-3",
        !isLast && "border-b border-border/20",
      )}
    >
      <div className="flex items-center gap-3">
        <IconBox icon={Icon} colorClass={colorClass} size="sm" />
        <div className="flex flex-col">
          <span className="text-[13px] font-medium text-foreground leading-none">{label}</span>
          <span className="text-[11px] text-muted-foreground mt-1">{subtitle}</span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <StatusPill label={statusLabel} variant={statusVariant} />
        <span className="text-[10px] text-muted-foreground tabular-nums">{timestamp}</span>
      </div>
    </div>
  )
}

export default function SecurityDashboard() {
  const navigate = useNavigate()
  const { data, isLoading, isError, refetch } = useSecuritySummary()

  if (isLoading) {
    return (
      <div className="container px-6 py-8 flex flex-col items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground mt-4">Đang tải dữ liệu bảo mật...</p>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="container px-6 py-8">
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 text-center">
          <AlertTriangle className="h-10 w-10 text-destructive mx-auto mb-4" />
          <h2 className="text-lg font-bold text-destructive">Lỗi tải dữ liệu</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Không thể tải thông tin bảo mật. Vui lòng thử lại sau.
          </p>
          <Button variant="outline" className="mt-4" onClick={() => refetch()}>
            Thử lại
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-7xl px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-foreground leading-snug">
            Tổng quan bảo mật
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Theo dõi trạng thái tài khoản và nhật ký hoạt động quan trọng.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs"
          onClick={() => refetch()}
        >
          <RefreshCw className="h-3 w-3" />
          Làm mới
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <PageCard
          className="cursor-pointer hover:border-rose-400 hover:shadow-md transition-all duration-200"
          onClick={() => { navigate("/security/activity-logs?category=security&actionType=account_locked") }}
        >
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-600 shrink-0">
              <Lock size={24} />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Tài khoản bị khóa
              </p>
              <p className="text-2xl font-bold text-foreground mt-0.5">
                {data.lockedAccountsCount}
              </p>
            </div>
          </div>
        </PageCard>

        <PageCard
          className="cursor-pointer hover:border-amber-400 hover:shadow-md transition-all duration-200"
          onClick={() => { navigate("/security/activity-logs?category=auth&actionType=failed_login") }}
        >
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
              <ShieldAlert size={24} />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Đăng nhập thất bại (Hôm nay)
              </p>
              <p className="text-2xl font-bold text-foreground mt-0.5">
                {data.failedLoginsToday}
              </p>
            </div>
          </div>
        </PageCard>

        <PageCard
          className="cursor-pointer hover:border-emerald-400 hover:shadow-md transition-all duration-200"
          onClick={() => { navigate("/security/activity-logs?category=auth&actionType=login") }}
        >
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
              <UserCheck size={24} />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Đăng nhập thành công (Hôm nay)
              </p>
              <p className="text-2xl font-bold text-foreground mt-0.5">
                {data.successfulLoginsToday}
              </p>
            </div>
          </div>
        </PageCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Security Events */}
        <PageCard className="h-full">
          <SectionHeader
            title="Sự kiện bảo mật gần đây"
            action={<History size={16} className="text-muted-foreground" />}
          />
          <div className="mt-4 space-y-0 px-1">
            {data.recentSecurityEvents.length === 0 ? (
              <div className="py-12 text-center">
                <ShieldCheck className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Không có sự kiện bảo mật nào gần đây.</p>
              </div>
            ) : (
              data.recentSecurityEvents.map((event: ActivityLogItem, idx: number) => (
                <SecurityEventRow
                  key={event.id}
                  icon={event.actionType === "account_locked" ? Lock : ShieldCheck}
                  label={ACTION_LABELS[event.actionType] || event.actionType}
                  subtitle={`${event.employeeName || "Hệ thống"} • ${event.ipAddress || "Không rõ IP"}`}
                  statusLabel={event.actionType}
                  statusVariant={ACTION_VARIANTS[event.actionType] ?? "neutral"}
                  timestamp={new Date(event.createdAt).toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  colorClass={
                    event.actionType === "account_locked"
                      ? "bg-rose-500/10 text-rose-600"
                      : "bg-emerald-500/10 text-emerald-600"
                  }
                  isLast={idx === data.recentSecurityEvents.length - 1}
                />
              ))
            )}
          </div>
        </PageCard>

        {/* Recent Role Events */}
        <PageCard className="h-full">
          <SectionHeader
            title="Thay đổi quyền hạn gần đây"
            action={<UserCheck size={16} className="text-muted-foreground" />}
          />
          <div className="mt-4 space-y-0 px-1">
            {data.recentRoleEvents.length === 0 ? (
              <div className="py-12 text-center">
                <UserCheck className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Không có thay đổi quyền hạn nào gần đây.</p>
              </div>
            ) : (
              data.recentRoleEvents.map((event: ActivityLogItem, idx: number) => (
                <SecurityEventRow
                  key={event.id}
                  icon={event.actionType === "role_assigned" ? UserCheck : UserX}
                  label={ACTION_LABELS[event.actionType] || event.actionType}
                  subtitle={`${event.employeeName} • ${(() => {
                    if (!event.details) return "N/A"
                    try {
                      const parsed = typeof event.details === "string" ? JSON.parse(event.details) : event.details
                      return parsed?.role || "N/A"
                    } catch {
                      return "N/A"
                    }
                  })()}`}
                  statusLabel={event.actionType}
                  statusVariant={ACTION_VARIANTS[event.actionType] ?? "neutral"}
                  timestamp={new Date(event.createdAt).toLocaleDateString("vi-VN")}
                  colorClass={
                    event.actionType === "role_assigned"
                      ? "bg-blue-500/10 text-blue-600"
                      : "bg-orange-500/10 text-orange-600"
                  }
                  isLast={idx === data.recentRoleEvents.length - 1}
                />
              ))
            )}
          </div>
        </PageCard>
      </div>
    </div>
  )
}

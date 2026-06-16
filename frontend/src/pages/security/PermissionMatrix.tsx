import { PageCard } from "@/components/common"
import { ROLE, ROLE_LABELS } from "@/config/entities/employee.config"
import { SUBSYSTEMS } from "@/config/subsystem"
import { privateRoutes } from "@/routes"
import { cn } from "@/lib/utils"

import { useMemo } from "react"
import {
  ShieldAlert,
  ShieldCheck,
  LayoutGrid,
  HelpCircle,
  AlertTriangle,
  CheckCircle2,
  EyeOff
} from "lucide-react"

interface MatrixRow {
  name: string
  path: string
  subsystemName: string
  sidebarRoles: string[] // "all", "hidden", or array of roles
  routeRoles: string[] // "all" or array of roles
  isSidebarRestricted: boolean
  isRouteRestricted: boolean
  status: "match" | "mismatch" | "subroute" | "orphaned"
  statusDetail: string
}

const ALL_ROLES = [ROLE.ADMIN, ROLE.HR_MANAGER, ROLE.GENERAL_MANAGER, ROLE.TEAM_LEADER, ROLE.EMPLOYEE]

export default function PermissionMatrix() {
  const matrixData = useMemo(() => {
    const rows: MatrixRow[] = []
    const matchedRoutePaths = new Set<string>()

    // Scan SUBSYSTEMS and their sidebar items
    SUBSYSTEMS.forEach((subsystem) => {
      subsystem.sidebarItems.forEach((item) => {
        // Find corresponding route configuration
        const matchingRoute = privateRoutes.find((r) => r.path === item.path)
        if (matchingRoute) {
          matchedRoutePaths.add(matchingRoute.path)
        }

        // Determine sidebar visibility roles
        const sidebarRoles = item.roles || subsystem.roles || ["all"]
        const routeRoles = matchingRoute?.roles || ["all"]

        const isSidebarRestricted = !sidebarRoles.includes("all")
        const isRouteRestricted = !routeRoles.includes("all")

        // Check for role matches
        let status: "match" | "mismatch" | "orphaned" = "match"
        let statusDetail = "Cấu hình phân quyền trùng khớp."

        if (!matchingRoute) {
          status = "orphaned"
          statusDetail = "Lỗi: Mục menu không trỏ tới route hợp lệ nào."
        } else {
          // Compare allowed roles
          const sRoles = sidebarRoles.includes("all") ? ALL_ROLES : sidebarRoles
          const rRoles = routeRoles.includes("all") ? ALL_ROLES : routeRoles

          const hasMismatch =
            sRoles.length !== rRoles.length ||
            !sRoles.every((r) => rRoles.includes(r)) ||
            !rRoles.every((r) => sRoles.includes(r))

          if (hasMismatch) {
            status = "mismatch"
            statusDetail = "Cảnh báo: Phân quyền menu sidebar và route bảo mật không khớp."
          }
        }

        rows.push({
          name: item.name,
          path: item.path,
          subsystemName: subsystem.name,
          sidebarRoles,
          routeRoles,
          isSidebarRestricted,
          isRouteRestricted,
          status,
          statusDetail,
        })
      })
    })

    // Scan remaining privateRoutes that do not appear in any sidebarItems
    privateRoutes.forEach((route) => {
      if (matchedRoutePaths.has(route.path)) return

      // These are subroutes, details pages, etc. (hidden from sidebar but protected)
      const routeRoles = route.roles || ["all"]
      const isRouteRestricted = !routeRoles.includes("all")

      rows.push({
        name: `Trang phụ: ${route.path.split("/").pop() || route.path}`,
        path: route.path,
        subsystemName: route.path.startsWith("/hrm") ? "Nhân sự" : route.path.split("/")[1] || "Hệ thống",
        sidebarRoles: ["hidden"],
        routeRoles,
        isSidebarRestricted: true,
        isRouteRestricted,
        status: "subroute",
        statusDetail: "Trang phụ ẩn trên sidebar, chỉ truy cập thông qua hành động hoặc liên kết.",
      })
    })

    return rows
  }, [])

  // Count matches/mismatches
  const stats = useMemo(() => {
    let matches = 0
    let mismatches = 0
    let subroutes = 0

    matrixData.forEach((row) => {
      if (row.status === "match") matches++
      else if (row.status === "mismatch") mismatches++
      else if (row.status === "subroute") subroutes++
    })

    return { matches, mismatches, subroutes, total: matrixData.length }
  }, [matrixData])

  const renderRolesList = (roles: string[], isRestricted: boolean) => {
    if (roles.includes("hidden")) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-medium bg-muted/50 px-2 py-0.5 rounded border border-border/60">
          <EyeOff size={11} />
          Ẩn trên Sidebar
        </span>
      )
    }

    if (!isRestricted || roles.includes("all")) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-semibold bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-900/30">
          <CheckCircle2 size={11} />
          Tất cả vai trò
        </span>
      )
    }

    return (
      <div className="flex flex-wrap gap-1">
        {roles.map((r) => (
          <span
            key={r}
            className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary/5 text-primary border border-primary/10"
          >
            {Object.entries(ROLE_LABELS).find(([k]) => k === r)?.[1] || r}
          </span>
        ))}
      </div>
    )
  }

  return (
    <div className="container max-w-7xl px-6 py-8">
      {/* Page Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-foreground leading-snug">
            Kiểm tra Phân quyền (RBAC Matrix)
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Bảng ma trận đối soát quyền hiển thị giao diện (UI) và cấu hình bảo mật đường dẫn (Routes).
          </p>
        </div>
      </div>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-7">
        <PageCard className="bg-emerald-50/20 dark:bg-emerald-950/5 border-emerald-100/60 dark:border-emerald-900/20">
          <div className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Trùng khớp</p>
              <h3 className="text-lg font-extrabold text-foreground leading-none mt-1">{stats.matches}</h3>
            </div>
          </div>
        </PageCard>

        <PageCard className={cn(
          stats.mismatches > 0 
            ? "bg-rose-50/30 dark:bg-rose-950/5 border-rose-100 dark:border-rose-900/20" 
            : "bg-muted/20 border-border"
        )}>
          <div className="p-4 flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              stats.mismatches > 0 
                ? "bg-rose-500/10 text-rose-600 dark:text-rose-400" 
                : "bg-muted text-muted-foreground"
            )}>
              <ShieldAlert size={20} />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Không khớp (Lỗ hổng)</p>
              <h3 className={cn(
                "text-lg font-extrabold leading-none mt-1",
                stats.mismatches > 0 ? "text-rose-600 dark:text-rose-400" : "text-foreground"
              )}>{stats.mismatches}</h3>
            </div>
          </div>
        </PageCard>

        <PageCard className="bg-blue-50/20 dark:bg-blue-950/5 border-blue-100/60 dark:border-blue-900/20">
          <div className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <LayoutGrid size={20} />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Trang phụ / Details</p>
              <h3 className="text-lg font-extrabold text-foreground leading-none mt-1">{stats.subroutes}</h3>
            </div>
          </div>
        </PageCard>
      </div>

      {/* Main Table Matrix */}
      <PageCard className="overflow-hidden" padding="sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/10 text-[11px] uppercase tracking-wider font-bold text-muted-foreground">
                <th className="px-5 py-3 text-left">Chức năng</th>
                <th className="px-5 py-3 text-left">Đường dẫn</th>
                <th className="px-5 py-3 text-left">Hiển thị Menu</th>
                <th className="px-5 py-3 text-left">Bảo vệ Route</th>
                <th className="px-5 py-3 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {matrixData.map((row, index) => {
                const isMismatch = row.status === "mismatch"
                const isSubroute = row.status === "subroute"

                return (
                  <tr
                    key={`${row.path}-${index}`}
                    className={cn(
                      "transition-colors",
                      isMismatch ? "bg-rose-50/10 hover:bg-rose-50/20 dark:bg-rose-950/5 dark:hover:bg-rose-950/10" : "hover:bg-muted/20"
                    )}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-foreground leading-snug">{row.name}</span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
                          Mô đun: {row.subsystemName}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-[11px] text-muted-foreground bg-muted/65 px-1.5 py-0.5 rounded">
                        {row.path}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {renderRolesList(row.sidebarRoles, row.isSidebarRestricted)}
                    </td>
                    <td className="px-5 py-3.5">
                      {renderRolesList(row.routeRoles, row.isRouteRestricted)}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {row.status === "match" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full">
                          <CheckCircle2 size={11} />
                          Hợp lệ
                        </span>
                      ) : isMismatch ? (
                        <div className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/30 px-2 py-0.5 rounded-full" title={row.statusDetail}>
                          <AlertTriangle size={11} />
                          Lệch quyền
                        </div>
                      ) : isSubroute ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/30 px-2 py-0.5 rounded-full" title={row.statusDetail}>
                          <EyeOff size={11} />
                          Trang phụ
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-full" title={row.statusDetail}>
                          <HelpCircle size={11} />
                          Chưa có route
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </PageCard>
    </div>
  )
}

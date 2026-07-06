import { PageCard } from "@/components/common"
import { API_ENDPOINTS } from "@/config/api.config"
import apiClient from "@/lib/api-client"
import { cn } from "@/lib/utils"
import type { RouteManifestEntry } from "@/types/system/route.types"

import { useEffect, useMemo, useState } from "react"

import { CheckCircle2, Loader2, Lock, ShieldCheck, Unlock } from "lucide-react"
import { toast } from "sonner"

/**
 * PermissionMatrix Component.
 * Fetches the backend route manifest and displays the authorization rules for each endpoint.
 */
export default function PermissionMatrix() {
  const [manifest, setManifest] = useState<RouteManifestEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiClient
      .get(API_ENDPOINTS.DEBUG.ROUTE_MANIFEST)
      .then((res) => setManifest(res.data.data))
      .catch((err) => {
        toast.error("Không thể tải cấu hình Route Manifest")
        console.error(err)
      })
      .finally(() => setLoading(false))
  }, [])

  // Count matches/mismatches for summary cards
  const stats = useMemo(() => {
    let protectedRoutes = 0
    let publicRoutes = 0
    let permissionRoutes = 0

    manifest.forEach((row) => {
      if (row.authRequired) protectedRoutes++
      else publicRoutes++

      if (row.permissions && row.permissions.length > 0) permissionRoutes++
    })

    return { total: manifest.length, protectedRoutes, publicRoutes, permissionRoutes }
  }, [manifest])

  /**
   * Render the list of permissions as small badges.
   * If the array is empty or null, display an "All Permissions" label.
   * 
   * @param permissions - Array of permission strings, or null
   * @returns React Node containing the badges
   */
  const renderPermissionsList = (permissions: string[] | null) => {
    if (!permissions || permissions.length === 0) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-semibold bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-900/30">
          <CheckCircle2 size={11} />
          Tất cả quyền
        </span>
      )
    }

    return (
      <div className="flex flex-wrap gap-1">
        {permissions.map((p) => (
          <span
            key={p}
            className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary/5 text-primary border border-primary/10 font-mono"
          >
            {p}
          </span>
        ))}
      </div>
    )
  }

  /**
   * Render color badges for each HTTP Method type.
   * 
   * @param method - HTTP Method name (GET, POST, PUT, DELETE, PATCH, ALL)
   * @returns React Node containing the corresponding colored badge
   */
  const renderMethodBadge = (method: string) => {
    const colors: Record<string, string> = {
      GET: "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900",
      POST: "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900",
      PUT: "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900",
      DELETE:
        "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900",
      PATCH:
        "bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900",
      ALL: "bg-muted text-muted-foreground border-border",
    }
    const className = colors[method] || colors.ALL
    return (
      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded border", className)}>
        {method}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-200px)] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium">Đang tải cấu hình Route Manifest...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-7xl px-6 py-8">
      {/* Page Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-foreground leading-snug">
            Cấu trúc Phân quyền (Backend Routes)
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Bảng danh sách toàn bộ các API endpoint của hệ thống và quyền tương ứng (Single Source
            of Truth).
          </p>
        </div>
      </div>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-7">
        <PageCard className="bg-emerald-50/20 dark:bg-emerald-950/5 border-emerald-100/60 dark:border-emerald-900/20">
          <div className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Lock size={20} />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                Cần đăng nhập
              </p>
              <h3 className="text-lg font-extrabold text-foreground leading-none mt-1">
                {stats.protectedRoutes}{" "}
                <span className="text-sm font-normal text-muted-foreground">/ {stats.total}</span>
              </h3>
            </div>
          </div>
        </PageCard>

        <PageCard className="bg-blue-50/20 dark:bg-blue-950/5 border-blue-100/60 dark:border-blue-900/20">
          <div className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                Yêu cầu cấp quyền
              </p>
              <h3 className="text-lg font-extrabold text-foreground leading-none mt-1">
                {stats.permissionRoutes}
              </h3>
            </div>
          </div>
        </PageCard>

        <PageCard className="bg-muted/20 border-border">
          <div className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted text-muted-foreground">
              <Unlock size={20} />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                Public (Miễn xác thực)
              </p>
              <h3 className="text-lg font-extrabold text-foreground leading-none mt-1">
                {stats.publicRoutes}
              </h3>
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
                <th className="px-5 py-3 text-left">Tên Route</th>
                <th className="px-5 py-3 text-left">Phương thức</th>
                <th className="px-5 py-3 text-left">Đường dẫn API</th>
                <th className="px-5 py-3 text-center">Xác thực</th>
                <th className="px-5 py-3 text-left">Phân quyền (RBAC)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {manifest.map((row, index) => {
                return (
                  <tr
                    key={`${row.method}-${row.path}-${index}`}
                    className="hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-foreground leading-snug">
                          {row.name}
                        </span>
                        {row.description && (
                          <span className="text-[10px] text-muted-foreground tracking-wide font-medium mt-0.5">
                            {row.description}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {renderMethodBadge(row.method)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-[11px] text-muted-foreground bg-muted/65 px-1.5 py-0.5 rounded break-all">
                        {row.path}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {row.authRequired ? (
                        <div
                          className="inline-flex items-center justify-center text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 p-1.5 rounded-full"
                          title="Cần đăng nhập (Có Token)"
                        >
                          <Lock size={14} />
                        </div>
                      ) : (
                        <div
                          className="inline-flex items-center justify-center text-muted-foreground bg-muted/50 p-1.5 rounded-full"
                          title="Public (Không cần Token)"
                        >
                          <Unlock size={14} />
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5">{renderPermissionsList(row.permissions)}</td>
                  </tr>
                )
              })}
              {manifest.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">
                    Không tìm thấy dữ liệu Route Manifest.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </PageCard>
    </div>
  )
}

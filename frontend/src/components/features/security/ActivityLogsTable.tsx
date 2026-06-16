import { StatusPill } from "@/components/common"
import { ACTIVITY_ACTION_VARIANTS } from "@/config/entities/security.config"
import { COMMON_TEXTS } from "@/config/system.config"
import type { ActivityLogItem } from "@/types/security.types"
import { FileText } from "lucide-react"

interface ActivityLogsTableProps {
  logs: ActivityLogItem[]
  onViewDetail: (id: string) => void
}

export function ActivityLogsTable({ logs, onViewDetail }: ActivityLogsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/5">
            <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Hành động
            </th>
            <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Nhân viên
            </th>
            <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Danh mục
            </th>
            <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Địa chỉ IP
            </th>
            <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Thời gian
            </th>
            <th className="px-5 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Chi tiết
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40">
          {logs.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-5 py-24 text-center">
                <div className="flex flex-col items-center gap-3">
                  <FileText className="h-10 w-10 text-muted-foreground opacity-20" />
                  <p className="text-sm text-muted-foreground">Không tìm thấy bản ghi nhật ký nào.</p>
                </div>
              </td>
            </tr>
          ) : (
            logs.map((log) => (
              <tr
                key={log.id}
                className="group hover:bg-muted/30 transition-colors duration-100"
              >
                <td className="px-5 py-4">
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-foreground text-[13px]">
                      {log.actionType}
                    </span>
                    <StatusPill
                      label={log.actionType}
                      variant={ACTIVITY_ACTION_VARIANTS[log.actionType] ?? "neutral"}
                      className="scale-90 origin-left"
                    />
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="text-[13px] text-foreground font-medium">
                    {log.employeeName || <span className="text-muted-foreground italic">{COMMON_TEXTS.SYSTEM}</span>}
                  </div>
                  <div className="text-[11px] text-muted-foreground font-mono">
                    {log.employeeId || COMMON_TEXTS.NOT_AVAILABLE}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-muted text-muted-foreground border border-border/50">
                    {log.category}
                  </span>
                </td>
                <td className="px-5 py-4 font-mono text-[12px] text-muted-foreground">
                  {log.ipAddress || "—"}
                </td>
                <td className="px-5 py-4">
                  <div className="text-[13px] text-foreground tabular-nums">
                    {new Date(log.createdAt).toLocaleDateString("vi-VN")}
                  </div>
                  <div className="text-[11px] text-muted-foreground tabular-nums">
                    {new Date(log.createdAt).toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </td>
                <td className="px-5 py-4 text-right">
                  <button
                    onClick={() => onViewDetail(log.id)}
                    className="text-[12px] font-bold text-primary hover:underline underline-offset-4 focus:outline-none"
                  >
                    Xem chi tiết
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

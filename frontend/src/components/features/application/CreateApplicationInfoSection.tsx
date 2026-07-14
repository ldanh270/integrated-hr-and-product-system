"use client"

import { APPLICATION_TYPES } from "@/config/entities/attendance.config"
import type { IApprover } from "@/lib/api/employee.api"
import type { ApplicationFormState } from "@/hooks/application/useCreateApplicationForm"
import type { User } from "@/store/auth-store"

interface Props {
  type: string
  form?: ApplicationFormState
  set?: <K extends keyof ApplicationFormState>(k: K, v: ApplicationFormState[K]) => void
  assignedToId: string
  setAssignedToId: (val: string) => void
  user: User | null
  approvers: IApprover[]
}

export function CreateApplicationInfoSection({ type, form, set, assignedToId, setAssignedToId, user, approvers }: Props) {
  return (
    <div className="bg-background rounded-lg border border-border shadow-sm overflow-visible shrink-0">
      <div className="px-5 py-3 border-b border-border bg-muted/50 rounded-t-lg">
        <h3 className="font-semibold text-sm text-foreground">Thông tin đơn</h3>
      </div>
      <div className="p-5 grid grid-cols-2 gap-6">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground">
            Nhân sự
          </label>
          <input
            type="text"
            disabled
            value={`${user?.fullName || "Người dùng"} - ${user?.email || ""}`}
            className="w-full h-9 px-3 text-sm border border-input rounded-md bg-muted/50 text-muted-foreground cursor-not-allowed"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground">
            Người duyệt <span className="text-destructive">*</span>
          </label>
          <select
            value={assignedToId}
            onChange={(e) => { setAssignedToId(e.target.value); }}
            className="w-full h-9 px-3 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          >
            <option value="">-- Không chỉ định (bất kỳ ai có thẩm quyền) --</option>
            {approvers.map((a) => (
              <option key={a.id} value={a.id}>
                {a.fullName}
                {a.position ? ` — ${a.position}` : ""} ({a.role.replace(/_/g, " ")})
              </option>
            ))}
          </select>
        </div>

        {type === APPLICATION_TYPES.RESIGNATION.LABEL && form && set && (
          <>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Ngày thôi việc <span className="text-destructive">*</span>
              </label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => { set("startDate", e.target.value); }}
                className="w-full h-9 px-3 text-sm border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Lý do
              </label>
              <input
                type="text"
                placeholder="Nhập lý do hoặc ghi chú chi tiết"
                value={form.reason}
                onChange={(e) => { set("reason", e.target.value); }}
                className="w-full h-9 px-3 text-sm border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

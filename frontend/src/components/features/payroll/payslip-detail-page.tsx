import { EntityFormPage } from "@/components/common/entity-form-page"
import { Badge } from "@/components/ui/badge"
import { COMPONENT_TYPE } from "@/config/entities/payroll.config"
import { formatCurrency } from "@/lib/utils"
import type { IPayslip } from "@/types/payroll.types"

import { Activity, Clock, DollarSign } from "lucide-react"

interface PayslipDetailPageProps {
  payslip: IPayslip | null
  onClose: () => void
}

export function PayslipDetailPage({ payslip, onClose }: PayslipDetailPageProps) {
  if (!payslip) {
    return (
      <EntityFormPage title="Chi tiết phiếu lương" isReadOnly={true} onBack={onClose}>
        <div className="flex h-40 items-center justify-center text-destructive bg-background border border-border rounded-xl shadow-none">
          <p>Không thể tải thông tin phiếu lương.</p>
        </div>
      </EntityFormPage>
    )
  }

  return (
    <EntityFormPage title="Chi tiết phiếu lương" isReadOnly={true} onBack={onClose}>
      <div className="space-y-6">
        {/* Overview Card */}
        <div className="bg-background border border-border rounded-xl overflow-hidden shadow-none p-6 flex flex-col items-center justify-center space-y-2">
          <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Thực Lãnh
          </span>
          <span className="text-5xl font-bold text-primary">
            {formatCurrency(payslip.netSalary)}
          </span>
        </div>

        {/* Attendance Summary */}
        <div className="bg-background border border-border rounded-xl overflow-hidden shadow-none">
          <div className="px-6 py-4 border-b border-border bg-muted/50 flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold text-foreground">Tổng kết chấm công</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="rounded-xl border p-4 flex flex-col items-center justify-center bg-card">
                <span className="text-muted-foreground mb-1">Ngày công</span>
                <span className="font-semibold text-2xl">{payslip.workingDays}</span>
              </div>
              <div className="rounded-xl border p-4 flex flex-col items-center justify-center bg-card">
                <span className="text-muted-foreground mb-1">Vắng mặt</span>
                <span className="font-semibold text-2xl text-destructive">
                  {payslip.absentDays}
                </span>
              </div>
              <div className="rounded-xl border p-4 flex flex-col items-center justify-center bg-card">
                <span className="text-muted-foreground mb-1">Tăng ca (phút)</span>
                <span className="font-semibold text-2xl text-success">
                  {payslip.overtimeMinutes}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Income Breakdown */}
          <div className="bg-background border border-border rounded-xl overflow-hidden shadow-none flex flex-col">
            <div className="px-6 py-4 border-b border-border bg-muted/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                <h2 className="font-semibold text-foreground">Thu nhập / Phụ cấp</h2>
              </div>
              <Badge variant="outline" className="text-success border-success rounded-full">
                +{formatCurrency(payslip.totalAdditions)}
              </Badge>
            </div>
            <div className="p-6 space-y-3 flex-1">
              {payslip.details
                .filter((d) => d.type === COMPONENT_TYPE.ADDITION)
                .map((detail, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center py-2 border-b border-border/50 last:border-0"
                  >
                    <span className="text-muted-foreground font-medium">{detail.name}</span>
                    <span className="font-semibold text-success">
                      +{formatCurrency(detail.value)}
                    </span>
                  </div>
                ))}
              {payslip.details.filter((d) => d.type === COMPONENT_TYPE.ADDITION).length === 0 && (
                <div className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground italic text-sm">Không có phụ cấp</p>
                </div>
              )}
            </div>
          </div>

          {/* Deductions Breakdown */}
          <div className="bg-background border border-border rounded-xl overflow-hidden shadow-none flex flex-col">
            <div className="px-6 py-4 border-b border-border bg-muted/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-muted-foreground" />
                <h2 className="font-semibold text-foreground">Khấu trừ</h2>
              </div>
              <Badge variant="outline" className="text-destructive border-destructive rounded-full">
                -{formatCurrency(payslip.totalDeductions)}
              </Badge>
            </div>
            <div className="p-6 space-y-3 flex-1">
              {payslip.details
                .filter((d) => d.type === COMPONENT_TYPE.DEDUCTION)
                .map((detail, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center py-2 border-b border-border/50 last:border-0"
                  >
                    <span className="text-muted-foreground font-medium">{detail.name}</span>
                    <span className="font-semibold text-destructive">
                      -{formatCurrency(detail.value)}
                    </span>
                  </div>
                ))}
              {payslip.details.filter((d) => d.type === COMPONENT_TYPE.DEDUCTION).length === 0 && (
                <div className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground italic text-sm">Không có khấu trừ</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </EntityFormPage>
  )
}

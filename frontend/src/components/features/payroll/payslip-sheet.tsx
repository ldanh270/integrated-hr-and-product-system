import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { COMPONENT_TYPE } from "@/config/entities/payroll.config"
import { formatCurrency } from "@/lib/utils"
import type { IPayslip } from "@/types/payroll.types"

import { Clock } from "lucide-react"

interface PayslipSheetProps {
  payslip: IPayslip | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function PayslipSheet({ payslip, open, onOpenChange }: PayslipSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md md:max-w-xl overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>Chi tiết phiếu lương</SheetTitle>
          <SheetDescription>Bảng phân tích chi tiết các thành phần lương.</SheetDescription>
        </SheetHeader>

        {!payslip ? (
          <div className="flex h-40 items-center justify-center text-destructive">
            <p>Không thể tải thông tin phiếu lương.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overview Card */}
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col items-center justify-center space-y-2">
              <span className="text-sm font-medium text-muted-foreground">Thực Lãnh</span>
              <span className="text-4xl font-bold text-primary">
                {formatCurrency(payslip.netSalary)}
              </span>
            </div>

            {/* Attendance Summary */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" /> Tổng kết chấm công
              </h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="rounded-lg border p-3 flex flex-col items-center">
                  <span className="text-muted-foreground">Ngày công</span>
                  <span className="font-semibold text-lg">{payslip.workingDays}</span>
                </div>
                <div className="rounded-lg border p-3 flex flex-col items-center">
                  <span className="text-muted-foreground">Vắng mặt</span>
                  <span className="font-semibold text-lg text-destructive">
                    {payslip.absentDays}
                  </span>
                </div>
                <div className="rounded-lg border p-3 flex flex-col items-center">
                  <span className="text-muted-foreground">Tăng ca (phút)</span>
                  <span className="font-semibold text-lg text-success">
                    {payslip.overtimeMinutes}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Income Breakdown */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Thu nhập / Phụ cấp</h4>
                <Badge variant="outline" className="text-success border-success">
                  +{formatCurrency(payslip.totalAdditions)}
                </Badge>
              </div>
              <div className="space-y-2 text-sm">
                {payslip.details
                  .filter((d) => d.type === COMPONENT_TYPE.ADDITION)
                  .map((detail, idx) => (
                    <div key={idx} className="flex justify-between items-center py-1">
                      <span className="text-muted-foreground">{detail.name}</span>
                      <span className="font-medium text-success">
                        +{formatCurrency(detail.value)}
                      </span>
                    </div>
                  ))}
                {payslip.details.filter((d) => d.type === "addition").length === 0 && (
                  <p className="text-muted-foreground italic">Không có phụ cấp</p>
                )}
              </div>
            </div>

            <Separator />

            {/* Deductions Breakdown */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Khấu trừ</h4>
                <Badge variant="outline" className="text-destructive border-destructive">
                  -{formatCurrency(payslip.totalDeductions)}
                </Badge>
              </div>
              <div className="space-y-2 text-sm">
                {payslip.details
                  .filter((d) => d.type === COMPONENT_TYPE.DEDUCTION)
                  .map((detail, idx) => (
                    <div key={idx} className="flex justify-between items-center py-1">
                      <span className="text-muted-foreground">{detail.name}</span>
                      <span className="font-medium text-destructive">
                        -{formatCurrency(detail.value)}
                      </span>
                    </div>
                  ))}
                {payslip.details.filter((d) => d.type === "deduction").length === 0 && (
                  <p className="text-muted-foreground italic">Không có khấu trừ</p>
                )}
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

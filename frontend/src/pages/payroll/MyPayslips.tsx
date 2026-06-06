import PayslipSheet from "@/components/features/payroll/payslip-sheet"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PAYROLL_STATUS_BADGE, PAYROLL_STATUS_LABELS } from "@/config/entities/payroll.config"
import { useMyPayslips } from "@/hooks/payroll/use-my-payslips"
import { formatCurrency } from "@/lib/utils"
import type { IPayslip } from "@/types/payroll.types"

import { useState } from "react"

import { CalendarDays, FileText, Loader2 } from "lucide-react"

export default function MyPayslips() {
  const { data: payslips, isLoading, isError } = useMyPayslips()

  const [selectedPayslip, setSelectedPayslip] = useState<IPayslip | null>(null)

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Lương của tôi</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Lịch sử và chi tiết các phiếu lương của bạn.
        </p>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : isError ? (
        <div className="flex h-64 flex-col items-center justify-center text-center space-y-3">
          <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <FileText className="h-6 w-6 text-destructive" />
          </div>
          <p className="text-destructive font-medium">Lỗi khi tải dữ liệu phiếu lương</p>
        </div>
      ) : !payslips || payslips.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center text-center space-y-3 border rounded-xl border-dashed">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">Bạn chưa có phiếu lương nào.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {payslips.map((payslip) => (
            <Card
              key={payslip.id}
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => setSelectedPayslip(payslip)}
            >
              <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-muted-foreground" />
                  Kỳ lương {payslip.periodMonth}/{payslip.periodYear}
                </CardTitle>
                <Badge variant={payslip.status ? PAYROLL_STATUS_BADGE[payslip.status] : "default"}>
                  {payslip.status ? PAYROLL_STATUS_LABELS[payslip.status] : "Không rõ"}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Thực lãnh</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(payslip.netSalary)}
                  </p>
                </div>
                <div className="mt-4 flex justify-between text-xs text-muted-foreground">
                  <span>Ngày công: {payslip.workingDays}</span>
                  <span>Tăng ca: {payslip.overtimeMinutes}p</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <PayslipSheet
        payslip={selectedPayslip}
        open={selectedPayslip !== null}
        onOpenChange={(open) => !open && setSelectedPayslip(null)}
      />
    </div>
  )
}

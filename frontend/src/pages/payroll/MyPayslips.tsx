import { PageCard, PageHeader } from "@/components/common"
import PayslipSheet from "@/components/features/payroll/payslip-sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PAYROLL_STATUS_BADGE, PAYROLL_STATUS_LABELS } from "@/config/entities/payroll.config"
import { useMyPayslips } from "@/hooks/payroll/use-my-payslips"
import { formatCurrency } from "@/lib/utils"
import type { IPayslip } from "@/types/payroll.types"

import { useState } from "react"

import { CalendarDays, ChevronRight, FileText, Loader2 } from "lucide-react"

export default function MyPayslips() {
  const { data: payslips, isLoading, isError } = useMyPayslips()

  const [selectedPayslip, setSelectedPayslip] = useState<IPayslip | null>(null)

  return (
    <div className="container px-6 py-6">
      <PageHeader
        title="Lương của tôi"
        description="Lịch sử và chi tiết các phiếu lương của bạn."
      />

      <PageCard className="overflow-hidden p-0" noBorder={false}>
        <div className="overflow-x-auto">
          <Table className="text-sm">
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent border-b">
                <TableHead className="min-w-12.5 px-4 py-3 font-medium text-xs text-muted-foreground uppercase text-center">
                  #
                </TableHead>
                <TableHead className="px-4 py-3 font-medium text-xs text-muted-foreground uppercase whitespace-nowrap">
                  Kỳ lương
                </TableHead>
                <TableHead className="px-4 py-3 font-medium text-xs text-muted-foreground uppercase whitespace-nowrap text-center">
                  Ngày công
                </TableHead>
                <TableHead className="px-4 py-3 font-medium text-xs text-muted-foreground uppercase whitespace-nowrap text-center">
                  Tăng ca
                </TableHead>
                <TableHead className="px-4 py-3 font-medium text-xs text-muted-foreground uppercase whitespace-nowrap">
                  Trạng thái
                </TableHead>
                <TableHead className="px-4 py-3 font-medium text-xs text-muted-foreground uppercase whitespace-nowrap text-right">
                  Thực lãnh
                </TableHead>
                <TableHead className="px-4 py-3"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border">
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-destructive" />
                      </div>
                      <p className="text-destructive font-medium text-sm">
                        Lỗi khi tải dữ liệu phiếu lương
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : !payslips || payslips.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground text-sm">Bạn chưa có phiếu lương nào.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                payslips.map((payslip, index) => (
                  <TableRow
                    key={payslip.id}
                    className="hover:bg-muted/30 cursor-pointer transition-colors group"
                    onClick={() => setSelectedPayslip(payslip)}
                  >
                    <TableCell className="px-4 py-3 text-muted-foreground text-center">
                      {index + 1}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                          <CalendarDays className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">
                            Tháng {payslip.periodMonth}/{payslip.periodYear}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            Kỳ lương định kỳ
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-center font-medium text-muted-foreground">
                      {payslip.workingDays} <span className="text-xs font-normal">ngày</span>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-center font-medium text-muted-foreground">
                      {payslip.overtimeMinutes} <span className="text-xs font-normal">phút</span>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge
                        variant={payslip.status ? PAYROLL_STATUS_BADGE[payslip.status] : "default"}
                        className="rounded-full shadow-none font-medium px-2.5 py-0.5"
                      >
                        {payslip.status ? PAYROLL_STATUS_LABELS[payslip.status] : "Không rõ"}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <div className="font-bold text-primary text-base">
                        {formatCurrency(payslip.netSalary)}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </PageCard>

      <PayslipSheet
        payslip={selectedPayslip}
        open={selectedPayslip !== null}
        onOpenChange={(open) => !open && setSelectedPayslip(null)}
      />
    </div>
  )
}

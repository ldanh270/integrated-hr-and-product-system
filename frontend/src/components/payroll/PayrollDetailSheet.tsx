import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PAYROLL_STATUS_LABELS } from "@/config/entities/payroll.config"
import { usePayrollDetails } from "@/hooks/payroll/use-payrolls"

import { CheckCircle2, Clock, XCircle } from "lucide-react"

interface PayrollDetailSheetProps {
  payrollId: string | null
  onClose: () => void
}

export function PayrollDetailSheet({ payrollId, onClose }: PayrollDetailSheetProps) {
  // Pass an empty string if null to satisfy hook signature, but disable query when null
  const { data: payroll, isLoading } = usePayrollDetails(payrollId || "")

  const handleExportCSV = () => {
    if (!payroll || !payroll.payslips) return

    const headers = ["Employee Name", "Email", "Total Additions", "Total Deductions", "Net Salary"]
    const rows = payroll.payslips.map((ps: any) => [
      `"${ps.employee?.fullName || ""}"`,
      `"${ps.employee?.email || ""}"`,
      ps.totalAdditions,
      ps.totalDeductions,
      ps.netSalary,
    ])

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute(
      "download",
      `payroll_${payroll.periodMonth}_${payroll.periodYear}_details.csv`,
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Sheet open={!!payrollId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[95vw] max-w-[95vw]! sm:max-w-300! overflow-y-auto p-6 sm:p-8">
        <SheetHeader className="mb-6 px-0 pt-0 pb-0 flex flex-row items-center justify-between">
          <SheetTitle className="text-2xl">Payroll Details</SheetTitle>
        </SheetHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <p className="text-muted-foreground">Loading details...</p>
          </div>
        ) : !payroll ? (
          <div className="flex items-center justify-center h-48">
            <p className="text-muted-foreground">No payroll data found.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-row items-end justify-between gap-4">
              <div className="flex flex-col gap-2">
                <h2 className="text-xl font-bold tracking-tight">
                  Period: {payroll.periodMonth}/{payroll.periodYear}
                </h2>
                <div className="flex items-center gap-3">
                  <div
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      payroll.status === "draft"
                        ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                        : payroll.status === "approved"
                          ? "bg-green-100 text-green-800 border-green-200"
                          : "bg-red-100 text-red-800 border-red-200"
                    }`}
                  >
                    {payroll.status === "draft" && <Clock className="w-3 h-3 mr-1" />}
                    {payroll.status === "approved" && <CheckCircle2 className="w-3 h-3 mr-1" />}
                    {payroll.status !== "draft" && payroll.status !== "approved" && (
                      <XCircle className="w-3 h-3 mr-1" />
                    )}
                    {PAYROLL_STATUS_LABELS[payroll.status as keyof typeof PAYROLL_STATUS_LABELS]}
                  </div>
                  <span className="text-muted-foreground text-sm font-medium">
                    Total:{" "}
                    {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
                      payroll.totalAmount,
                    )}
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                className="rounded-full shrink-0"
              >
                Export CSV
              </Button>
            </div>

            <div className="border rounded-xl bg-card overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Employee Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Total Additions</TableHead>
                    <TableHead className="text-right">Total Deductions</TableHead>
                    <TableHead className="text-right font-bold">Net Salary</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payroll.payslips?.map((ps: any) => (
                    <TableRow key={ps.id}>
                      <TableCell className="font-medium">{ps.employee?.fullName}</TableCell>
                      <TableCell className="text-muted-foreground">{ps.employee?.email}</TableCell>
                      <TableCell className="text-right text-green-600">
                        +
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(ps.totalAdditions)}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        -
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(ps.totalDeductions)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-primary">
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(ps.netSalary)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!payroll.payslips || payroll.payslips.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                        No payslips found for this payroll.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

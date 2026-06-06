import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PAYROLL_STATUS_LABELS } from "@/config/entities/payroll.config"
import { useApprovePayroll, useRejectPayroll } from "@/hooks/payroll/use-payrolls"
import type { IPayroll } from "@/types/payroll.types"

import { useState } from "react"

import { CheckCircle2, Clock, MoreHorizontal, XCircle } from "lucide-react"

import { PayrollDetailSheet } from "./PayrollDetailSheet"

interface PayrollHistoryTableProps {
  payrolls: IPayroll[]
  isLoading: boolean
}

export function PayrollHistoryTable({ payrolls, isLoading }: PayrollHistoryTableProps) {
  const { mutate: approvePayroll } = useApprovePayroll()
  const { mutate: rejectPayroll } = useRejectPayroll()
  const [selectedPayrollId, setSelectedPayrollId] = useState<string | null>(null)

  const handleApprove = (id: string) => {
    approvePayroll(id)
  }

  const handleReject = (id: string) => {
    const reason = window.prompt("Enter rejection reason:")
    if (reason) {
      rejectPayroll({ id, reason })
    }
  }

  if (isLoading) {
    return (
      <div className="w-full h-48 flex items-center justify-center border rounded-xl">
        <p className="text-muted-foreground">Loading payroll history...</p>
      </div>
    )
  }

  if (!payrolls || payrolls.length === 0) {
    return (
      <div className="w-full py-12 flex flex-col items-center justify-center border rounded-xl border-dashed">
        <Clock className="h-8 w-8 text-muted-foreground mb-4 opacity-50" />
        <p className="text-muted-foreground font-medium">No payroll records found.</p>
        <p className="text-sm text-muted-foreground mt-1">Generate a new payroll to get started.</p>
      </div>
    )
  }

  return (
    <>
      <div className="border rounded-xl bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Payroll ID</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Total Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payrolls.map((payroll) => {
              const isDraft = payroll.status === "draft"
              const isApproved = payroll.status === "approved"

              return (
                <TableRow key={payroll.id}>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => setSelectedPayrollId(payroll.id)}
                      className="font-medium text-primary hover:underline text-left"
                    >
                      PAY-{payroll.id.substring(payroll.id.length - 8).toUpperCase()}
                    </button>
                  </TableCell>
                  <TableCell className="font-medium">
                    {payroll.periodMonth} / {payroll.periodYear}
                  </TableCell>
                  <TableCell>
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(payroll.totalAmount)}
                  </TableCell>
                  <TableCell>
                    <div
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        isDraft
                          ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                          : isApproved
                            ? "bg-green-100 text-green-800 border-green-200"
                            : "bg-red-100 text-red-800 border-red-200"
                      }`}
                    >
                      {isDraft && <Clock className="w-3 h-3 mr-1" />}
                      {isApproved && <CheckCircle2 className="w-3 h-3 mr-1" />}
                      {!isDraft && !isApproved && <XCircle className="w-3 h-3 mr-1" />}
                      {PAYROLL_STATUS_LABELS[payroll.status]}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Intl.DateTimeFormat("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    }).format(new Date(payroll.createdAt))}
                  </TableCell>
                  <TableCell className="text-right">
                    {isDraft ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 rounded-full">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 rounded-xl">
                          <DropdownMenuItem onClick={() => handleApprove(payroll.id)}>
                            <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                            <span>Approve</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleReject(payroll.id)}>
                            <XCircle className="mr-2 h-4 w-4 text-red-600" />
                            <span>Reject</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <PayrollDetailSheet
        payrollId={selectedPayrollId}
        onClose={() => setSelectedPayrollId(null)}
      />
    </>
  )
}

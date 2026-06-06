import { GeneratePayrollModal } from "@/components/payroll/GeneratePayrollModal"
import { PayrollHistoryTable } from "@/components/payroll/PayrollHistoryTable"
import { Button } from "@/components/ui/button"
import { usePayrolls } from "@/hooks/payroll/use-payrolls"
import { exportPayrollsToCSV } from "@/utils/export.util"

import { useState } from "react"

import { Download } from "lucide-react"

export default function PayrollManagement() {
  // We can add state for filters if needed later
  const [filters] = useState<{ status?: string; year?: number }>({})

  const { data: payrolls, isLoading } = usePayrolls(filters)

  const handleExport = () => {
    if (payrolls) {
      exportPayrollsToCSV(payrolls, `payroll_export_${new Date().getTime()}.csv`)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Payroll Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your company's payroll cycles, view history, and generate new payrolls.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="rounded-full"
            onClick={handleExport}
            disabled={!payrolls || payrolls.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>

          <GeneratePayrollModal />
        </div>
      </div>

      <div className="space-y-4">
        <PayrollHistoryTable payrolls={payrolls || []} isLoading={isLoading} />
      </div>
    </div>
  )
}

import type { IPayroll } from "@/types/payroll.types"

/**
 * Converts an array of IPayroll objects into a CSV string and downloads it.
 */
export function exportPayrollsToCSV(payrolls: IPayroll[], filename: string = "payrolls.csv") {
  if (!payrolls || payrolls.length === 0) return

  // Define headers
  const headers = [
    "ID",
    "Period Month",
    "Period Year",
    "Status",
    "Total Amount",
    "Approved By",
    "Approved At",
    "Reject Reason",
    "Created At",
  ]

  // Map data to CSV rows
  const rows = payrolls.map((p) => [
    p.id,
    p.periodMonth.toString(),
    p.periodYear.toString(),
    p.status,
    p.totalAmount.toString(),
    p.approvedById || "N/A",
    p.approvedAt ? new Date(p.approvedAt).toLocaleString() : "N/A",
    p.rejectReason ? `"${p.rejectReason.replace(/"/g, '""')}"` : "N/A",
    new Date(p.createdAt).toLocaleString(),
  ])

  // Combine headers and rows
  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n")

  // Create a Blob and trigger download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement("a")
  link.href = url
  link.setAttribute("download", filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

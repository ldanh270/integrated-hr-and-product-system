import { DataTableToolbar, PageCard, PageHeader } from "@/components/common"
import EmployeePayslipHistoryDialog from "@/components/features/payroll/EmployeePayslipHistoryDialog"
import EmployeeSalaryConfigDialog from "@/components/features/payroll/employee-salary-config-dialog"
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
import { useEmployees } from "@/hooks/employees/queries/useEmployeeQuery"
import {
  useActiveSalaryConfig,
  usePayslipTemplates,
} from "@/hooks/payroll/use-employee-salary-config"
import type { Employee } from "@/types/employee.types"

import { useState } from "react"

import { Loader2, MoreHorizontal, User } from "lucide-react"

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val)
}

export default function EmployeeSalary() {
  const [searchQuery, setSearchQuery] = useState("")
  const [page, setPage] = useState(1)

  const [configDialogOpen, setConfigDialogOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<{
    id: string
    fullName: string
    position?: string
  } | null>(null)

  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)

  const { data: employeeData, isLoading: isEmployeesLoading } = useEmployees({
    page,
    limit: 10,
    search: searchQuery,
  })

  const handleOpenConfigDialog = (emp: { id: string; fullName: string; position?: string }) => {
    setSelectedEmployee(emp)
    setConfigDialogOpen(true)
  }

  const handleOpenHistoryDialog = (emp: { id: string; fullName: string; position?: string }) => {
    setSelectedEmployee(emp)
    setHistoryDialogOpen(true)
  }

  return (
    <div className="container px-6 py-6">
      <PageHeader
        title="Thiết lập lương"
        description="Quản lý cấu hình mức lương cơ bản và gán mẫu bảng lương cho nhân viên."
      />

      <PageCard className="overflow-hidden p-0" noBorder={false}>
        <DataTableToolbar
          searchQuery={searchQuery}
          onSearchChange={(val) => {
            setSearchQuery(val)
            setPage(1)
          }}
          searchPlaceholder="Tìm kiếm nhân viên..."
        />

        <div className="overflow-x-auto">
          <Table className="text-sm">
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent border-b">
                <TableHead className="min-w-12.5 px-4 py-3 font-medium text-center text-xs text-muted-foreground uppercase">
                  STT
                </TableHead>
                <TableHead className="px-4 py-3 font-medium text-xs text-muted-foreground uppercase whitespace-nowrap">
                  Nhân sự
                </TableHead>
                <TableHead className="px-4 py-3 font-medium text-xs text-muted-foreground uppercase whitespace-nowrap">
                  Vị trí / Vai trò
                </TableHead>
                <TableHead className="px-4 py-3 font-medium text-xs text-muted-foreground uppercase whitespace-nowrap">
                  Lương cơ bản
                </TableHead>
                <TableHead className="px-4 py-3 font-medium text-xs text-muted-foreground uppercase whitespace-nowrap">
                  Mẫu bảng lương
                </TableHead>
                <TableHead className="min-w-12.5 px-4 py-3"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border">
              {isEmployeesLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : !employeeData || employeeData.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Không tìm thấy nhân viên nào phù hợp.
                  </TableCell>
                </TableRow>
              ) : (
                employeeData.data.map((emp: Employee, index: number) => (
                  <EmployeeRow
                    key={emp.id}
                    emp={emp}
                    index={(page - 1) * 10 + index + 1}
                    onConfigure={handleOpenConfigDialog}
                    onViewHistory={handleOpenHistoryDialog}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {employeeData && employeeData.meta.totalPages > 1 && (
          <div className="p-4 border-t border-border flex items-center justify-between text-sm text-muted-foreground bg-muted/20">
            <div>
              Hiển thị{" "}
              <span className="font-medium text-foreground">{employeeData.data.length}</span> trên{" "}
              <span className="font-medium text-foreground">{employeeData.meta.total}</span> nhân
              sự.
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Trước
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, employeeData.meta.totalPages) }).map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setPage(i + 1)}
                    className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors ${
                      page === i + 1
                        ? "bg-primary text-primary-foreground font-medium"
                        : "hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={page === employeeData.meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Sau
              </Button>
            </div>
          </div>
        )}
      </PageCard>

      <EmployeeSalaryConfigDialog
        open={configDialogOpen}
        onOpenChange={setConfigDialogOpen}
        employee={selectedEmployee}
      />

      <EmployeePayslipHistoryDialog
        open={historyDialogOpen}
        onOpenChange={setHistoryDialogOpen}
        employee={selectedEmployee}
      />
    </div>
  )
}

interface RowProps {
  emp: Employee
  index: number
  onConfigure: (emp: { id: string; fullName: string; position?: string }) => void
  onViewHistory: (emp: { id: string; fullName: string; position?: string }) => void
}

function EmployeeRow({ emp, index, onConfigure, onViewHistory }: RowProps) {
  const { data: config, isLoading } = useActiveSalaryConfig(emp.id)
  const { data: templates } = usePayslipTemplates()

  const templateName = templates?.find((t) => t.id === config?.templateId)?.name || "Chưa thiết lập"

  return (
    <TableRow
      className="hover:bg-muted/30 cursor-pointer"
      onClick={() =>
        onConfigure({ id: emp.id, fullName: emp.fullName, position: emp.position || undefined })
      }
    >
      <TableCell className="text-center px-4 py-3 text-muted-foreground">{index}</TableCell>
      <TableCell className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold overflow-hidden shrink-0 border">
            {emp.avatar?.url ? (
              <img src={emp.avatar.url} alt={emp.fullName} className="w-full h-full object-cover" />
            ) : (
              <User className="h-3 w-3" />
            )}
          </div>
          <div>
            <div className="font-medium text-foreground">{emp.fullName}</div>
            <div className="text-[10px] text-muted-foreground font-mono">
              {emp.id.split("-")[0].toUpperCase()}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell className="px-4 py-3">
        <div className="font-semibold text-foreground/80">{emp.position || "-"}</div>
        <div className="text-[10px] text-muted-foreground uppercase">{emp.role}</div>
      </TableCell>
      <TableCell className="px-4 py-3 font-semibold">
        {isLoading ? (
          <span className="text-muted-foreground">Đang tải...</span>
        ) : config ? (
          formatCurrency(Number(config.baseSalary))
        ) : (
          <span className="text-destructive">Chưa thiết lập</span>
        )}
      </TableCell>
      <TableCell className="px-4 py-3">
        {isLoading ? (
          <span className="text-muted-foreground">Đang tải...</span>
        ) : (
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
              config
                ? "bg-primary/5 text-primary border-primary/20"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {templateName}
          </span>
        )}
      </TableCell>
      <TableCell className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-6 w-6 p-0 rounded-full">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="text-xs">
            <DropdownMenuItem
              onClick={() =>
                onConfigure({
                  id: emp.id,
                  fullName: emp.fullName,
                  position: emp.position || undefined,
                })
              }
            >
              Gán mẫu lương
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                onViewHistory({
                  id: emp.id,
                  fullName: emp.fullName,
                  position: emp.position || undefined,
                })
              }
            >
              Xem lịch sử phiếu lương
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
}

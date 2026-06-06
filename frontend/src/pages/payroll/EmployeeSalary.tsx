import EmployeeSalaryConfigDialog from "@/components/features/payroll/employee-salary-config-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
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
import { Loader2, MoreHorizontal, Search, User, Users } from "lucide-react"
import { useState } from "react"

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

  const { data: employeeData, isLoading: isEmployeesLoading } = useEmployees({
    page,
    limit: 10,
    search: searchQuery,
  })

  const handleOpenConfigDialog = (emp: { id: string; fullName: string; position?: string }) => {
    setSelectedEmployee(emp)
    setConfigDialogOpen(true)
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-card">
        <div className="flex items-center gap-2 text-primary font-semibold">
          <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center text-primary">
            <Users className="h-3.5 w-3.5" />
          </div>
          Lương nhân sự
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        <div className="rounded-md border bg-card overflow-hidden">
          <div className="p-3 border-b flex items-center justify-between gap-4 bg-muted/10">
            <div className="relative max-w-xs flex-1">
              <Search className="absolute left-3 top-2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm nhân viên..."
                className="pl-9 rounded-full h-7 text-xs bg-background"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setPage(1)
                }}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table className="text-xs">
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-transparent border-b">
                  <TableHead className="w-12 py-2 font-semibold text-center">STT</TableHead>
                  <TableHead className="py-2 font-semibold">Nhân sự</TableHead>
                  <TableHead className="py-2 font-semibold">Vị trí / Vai trò</TableHead>
                  <TableHead className="py-2 font-semibold">Lương cơ bản</TableHead>
                  <TableHead className="py-2 font-semibold">Mẫu bảng lương</TableHead>
                  <TableHead className="w-12 py-2"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
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
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {employeeData && employeeData.meta.totalPages > 1 && (
            <div className="p-3 border-t flex items-center justify-between text-muted-foreground text-[10px]">
              <div>
                Hiển thị{" "}
                <span className="font-semibold text-foreground">
                  {employeeData.data.length}
                </span>{" "}
                trên{" "}
                <span className="font-semibold text-foreground">{employeeData.meta.total}</span>{" "}
                nhân sự.
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-full h-6 px-2 text-[10px]"
                >
                  Trước
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: employeeData.meta.totalPages }).map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setPage(i + 1)}
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                        page === i + 1
                          ? "bg-primary text-primary-foreground font-semibold"
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
                  className="rounded-full h-6 px-2 text-[10px]"
                >
                  Sau
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <EmployeeSalaryConfigDialog
        open={configDialogOpen}
        onOpenChange={setConfigDialogOpen}
        employee={selectedEmployee}
      />
    </div>
  )
}

interface RowProps {
  emp: Employee
  index: number
  onConfigure: (emp: { id: string; fullName: string; position?: string }) => void
}

function EmployeeRow({ emp, index, onConfigure }: RowProps) {
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
      <TableCell className="text-center py-2 text-muted-foreground">{index}</TableCell>
      <TableCell className="py-2">
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
      <TableCell className="py-2">
        <div className="font-semibold text-foreground/80">{emp.position || "-"}</div>
        <div className="text-[10px] text-muted-foreground uppercase">{emp.role}</div>
      </TableCell>
      <TableCell className="py-2 font-semibold">
        {isLoading ? (
          <span className="text-muted-foreground">Đang tải...</span>
        ) : config ? (
          formatCurrency(Number(config.baseSalary))
        ) : (
          <span className="text-destructive">Chưa thiết lập</span>
        )}
      </TableCell>
      <TableCell className="py-2">
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
      <TableCell className="py-2" onClick={(e) => e.stopPropagation()}>
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
              Cấu hình lương
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
}

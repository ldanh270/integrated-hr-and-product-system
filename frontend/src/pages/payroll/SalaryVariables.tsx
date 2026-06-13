import { AppPagination, PageCard, PageHeader, useConfirm } from "@/components/common"
import { SalaryVariableFormPage } from "@/components/features/payroll/salary-variable-form-page"
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
import { useDeleteSalaryVariable, useSalaryVariables } from "@/hooks/payroll/use-salary-variable"
import type { ISalaryVariable } from "@/hooks/payroll/use-salary-variable"

import { useState } from "react"

import { Loader2, Pencil, Plus, Trash2 } from "lucide-react"

const SYSTEM_VARIABLES = [
  {
    id: "sys_baseSalary",
    code: "baseSalary",
    name: "Lương cơ bản",
    value: "Theo thiết lập lương",
    description: "Mức lương cơ bản của nhân viên",
    isActive: true,
    isSystem: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sys_workingDays",
    code: "workingDays",
    name: "Ngày làm việc chuẩn",
    value: "Theo lịch tháng",
    description: "Số ngày công chuẩn trong kỳ lương",
    isActive: true,
    isSystem: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sys_actualWorkingDays",
    code: "actualWorkingDays",
    name: "Ngày làm thực tế",
    value: "Từ chấm công",
    description: "Số ngày công thực tế đi làm",
    isActive: true,
    isSystem: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sys_overtimeMinutes",
    code: "overtimeMinutes",
    name: "Phút tăng ca",
    value: "Từ chấm công",
    description: "Tổng số phút làm thêm giờ",
    isActive: true,
    isSystem: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sys_paidLeaveDays",
    code: "paidLeaveDays",
    name: "Nghỉ phép có lương",
    value: "Từ hệ thống phép",
    description: "Tổng số ngày nghỉ được hưởng lương",
    isActive: true,
    isSystem: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sys_unpaidLeaveDays",
    code: "unpaidLeaveDays",
    name: "Nghỉ không lương",
    value: "Từ hệ thống phép",
    description: "Tổng số ngày nghỉ không lương",
    isActive: true,
    isSystem: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

type VariableRow = Omit<ISalaryVariable, "value"> & {
  value: number | string
  isSystem?: boolean
}

export default function SalaryVariablesPage() {
  const confirm = useConfirm()
  const { data: variables, isLoading } = useSalaryVariables()
  const deleteMutation = useDeleteSalaryVariable()

  // View state pattern
  const [view, setView] = useState<"list" | "create" | "edit">("list")
  const [selectedItem, setSelectedItem] = useState<ISalaryVariable | null>(null)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

  const combinedVariables = [...SYSTEM_VARIABLES, ...(variables || [])] as VariableRow[]
  const paginatedVariables = combinedVariables.slice((page - 1) * limit, page * limit)
  const totalPages = Math.ceil(combinedVariables.length / limit)

  const handleOpenCreate = () => {
    setSelectedItem(null)
    setView("create")
  }

  const handleOpenEdit = (variable: ISalaryVariable) => {
    setSelectedItem(variable)
    setView("edit")
  }

  const handleCloseForm = () => {
    setView("list")
    setSelectedItem(null)
  }

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: "Xóa biến số",
      description:
        "Bạn có chắc chắn muốn xóa biến số tính lương này không? Hành động này không thể hoàn tác.",
      confirmText: "Xóa",
      cancelText: "Hủy bỏ",
      variant: "destructive",
    })
    if (isConfirmed) {
      await deleteMutation.mutateAsync(id)
    }
  }

  // Render Form Page if not in list view
  if (view !== "list") {
    return (
      <SalaryVariableFormPage
        initialData={selectedItem}
        onCancel={handleCloseForm}
        onSuccess={handleCloseForm}
      />
    )
  }

  return (
    <div className="container px-6 py-6">
      <PageHeader
        title="Biến hệ thống"
        description="Quản lý các biến số dùng chung cho công thức tính lương."
        actions={
          <Button className="gap-2 rounded-full" onClick={handleOpenCreate}>
            <Plus size={16} /> Thêm biến mới
          </Button>
        }
      />

      <PageCard className="overflow-hidden p-0 rounded-xl" noBorder={false}>
        <div className="overflow-x-auto">
          <Table className="text-sm">
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent border-b">
                <TableHead className="min-w-12.5 px-4 py-3 font-medium text-xs text-muted-foreground uppercase text-center">
                  #
                </TableHead>
                <TableHead className="px-4 py-3 font-medium text-xs text-muted-foreground uppercase whitespace-nowrap">
                  Mã biến (Code)
                </TableHead>
                <TableHead className="px-4 py-3 font-medium text-xs text-muted-foreground uppercase whitespace-nowrap">
                  Tên biến
                </TableHead>
                <TableHead className="px-4 py-3 font-medium text-xs text-muted-foreground uppercase whitespace-nowrap">
                  Giá trị mặc định
                </TableHead>
                <TableHead className="px-4 py-3 font-medium text-xs text-muted-foreground uppercase whitespace-nowrap">
                  Trạng thái
                </TableHead>
                <TableHead className="min-w-25 px-4 py-3 font-medium text-xs text-muted-foreground uppercase text-right whitespace-nowrap">
                  Thao tác
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border">
              {!variables && isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : (
                paginatedVariables.map((variable, index) => (
                  <TableRow
                    key={variable.id}
                    className={`hover:bg-muted/30 ${variable.isSystem ? "bg-muted/10" : ""}`}
                  >
                    <TableCell className="px-4 py-3 text-muted-foreground text-center">
                      {(page - 1) * limit + index + 1}
                    </TableCell>
                    <TableCell className="px-4 py-3 font-mono font-medium text-primary/80 whitespace-nowrap">
                      {variable.code}
                    </TableCell>
                    <TableCell className="px-4 py-3 whitespace-nowrap">
                      <div className="font-medium text-foreground">{variable.name}</div>
                      {variable.description && (
                        <div className="text-muted-foreground line-clamp-1 mt-0.5">
                          {variable.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3 whitespace-nowrap">
                      {typeof variable.value === "number"
                        ? variable.value.toLocaleString()
                        : variable.value}
                    </TableCell>
                    <TableCell className="px-4 py-3 whitespace-nowrap">
                      <Badge
                        variant={variable.isActive ? "default" : "secondary"}
                        className="text-[10px] font-semibold rounded-full"
                      >
                        {variable.isSystem
                          ? "Hệ thống"
                          : variable.isActive
                            ? "Hoạt động"
                            : "Vô hiệu"}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      {!variable.isSystem ? (
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            onClick={() => handleOpenEdit(variable as ISalaryVariable)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(variable.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic px-2">Mặc định</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {combinedVariables.length > 0 && (
          <AppPagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={combinedVariables.length}
            itemsPerPage={limit}
            onItemsPerPageChange={(newLimit) => {
              setLimit(newLimit)
              setPage(1)
            }}
          />
        )}
      </PageCard>
    </div>
  )
}

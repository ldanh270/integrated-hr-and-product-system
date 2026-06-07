import SalaryComponentSheet from "@/components/features/payroll/salary-component-sheet"
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
import { COMPONENT_TYPE_LABELS, COMPONENT_VALUE_TYPE_LABELS } from "@/config/entities/payroll.config"
import { useSalaryComponents } from "@/hooks/payroll/use-salary-components"
import type { ISalaryComponent } from "@/types/payroll.types"

import { useState } from "react"

import { Loader2, MoreHorizontal, Plus } from "lucide-react"

export default function SalaryComponents() {
  const { data: components, isLoading, isError } = useSalaryComponents()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingComponent, setEditingComponent] = useState<ISalaryComponent | null>(null)

  const handleCreate = () => {
    setEditingComponent(null)
    setDialogOpen(true)
  }

  const handleEdit = (comp: ISalaryComponent) => {
    setEditingComponent(comp)
    setDialogOpen(true)
  }

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Enterprise Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-card">
        <div className="flex items-center gap-2 text-primary font-semibold">
          <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center text-primary">
            +
          </div>
          Thành phần lương
        </div>
        <div className="flex items-center gap-3">
          {/* Quick actions placeholder like the image top right */}
          <Button variant="outline" size="sm" className="h-8 px-3 text-xs" onClick={handleCreate}>
            <Plus className="mr-1 h-3 w-3" /> Thêm thành phần
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto p-4">
        <div className="rounded-md border bg-card">
          <Table className="text-xs">
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-12 py-2 font-semibold">#</TableHead>
                <TableHead className="py-2 font-semibold">Mã thành phần</TableHead>
                <TableHead className="py-2 font-semibold">Tên thành phần</TableHead>
                <TableHead className="py-2 font-semibold">Loại thành phần</TableHead>
                <TableHead className="py-2 font-semibold">Kiểu giá trị</TableHead>
                <TableHead className="py-2 font-semibold">Công thức / Giá trị tĩnh</TableHead>
                <TableHead className="py-2 font-semibold hidden md:table-cell">Mô tả</TableHead>
                <TableHead className="w-12 py-2"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-destructive">
                    Lỗi khi tải danh sách thành phần lương.
                  </TableCell>
                </TableRow>
              ) : !components || components.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    Chưa có thành phần lương nào được cấu hình.
                  </TableCell>
                </TableRow>
              ) : (
                components.map((comp, index) => (
                  <TableRow key={comp.id} className="cursor-pointer hover:bg-muted/30">
                    <TableCell className="py-2 text-muted-foreground">{index + 1}</TableCell>
                    <TableCell className="py-2 font-medium text-primary/80">
                      {comp.code || comp.id.split("-")[0].toUpperCase()}
                    </TableCell>
                    <TableCell className="py-2 font-medium">{comp.name}</TableCell>
                    <TableCell className="py-2 text-muted-foreground">
                      {COMPONENT_TYPE_LABELS[comp.type]}
                    </TableCell>
                    <TableCell className="py-2 text-muted-foreground">
                      {COMPONENT_VALUE_TYPE_LABELS[comp.valueType]}
                    </TableCell>
                    <TableCell className="py-2 max-w-50 truncate font-mono text-xs" title={comp.formula}>
                      {comp.formula}
                    </TableCell>
                    <TableCell className="py-2 hidden md:table-cell text-muted-foreground max-w-62.5 truncate">
                      {comp.description || "-"}
                    </TableCell>
                    <TableCell className="py-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-6 w-6 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(comp)}>
                            Sửa thành phần
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <SalaryComponentSheet
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialData={editingComponent}
      />
    </div>
  )
}

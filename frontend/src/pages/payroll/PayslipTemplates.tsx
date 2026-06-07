import { CreatePayslipTemplateForm } from "@/components/payroll/CreatePayslipTemplateForm"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  useDeletePayslipTemplate,
  usePayslipTemplates,
} from "@/hooks/payroll/use-payslip-templates"
import type { IPayslipTemplate } from "@/types/payroll.types"

import { useState } from "react"

import { MoreHorizontal, Plus, Search } from "lucide-react"
import { toast } from "sonner"

export default function PayslipTemplates() {
  const [view, setView] = useState<"list" | "create" | "edit" | "view">("list")
  const [selectedTemplate, setSelectedTemplate] = useState<IPayslipTemplate | null>(null)
  const [templateToDelete, setTemplateToDelete] = useState<IPayslipTemplate | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const { data: templates, isLoading } = usePayslipTemplates()
  const { mutateAsync: deleteTemplate, isPending: isDeleting } = useDeletePayslipTemplate()

  const handleDelete = async () => {
    if (!templateToDelete) return
    try {
      await deleteTemplate(templateToDelete.id)
      toast.success("Xoá mẫu bảng lương thành công")
      setTemplateToDelete(null)
    } catch {
      toast.error("Lỗi khi xoá mẫu bảng lương")
    }
  }

  const handleOpenCreate = () => {
    setSelectedTemplate(null)
    setView("create")
  }

  const handleOpenEdit = (template: IPayslipTemplate) => {
    setSelectedTemplate(template)
    setView("edit")
  }

  const handleOpenView = (template: IPayslipTemplate) => {
    setSelectedTemplate(template)
    setView("view")
  }

  if (view !== "list") {
    return (
      <CreatePayslipTemplateForm
        initialData={selectedTemplate}
        isReadOnly={view === "view"}
        onSuccess={() => {
          setView("list")
          setSelectedTemplate(null)
        }}
        onCancel={() => {
          setView("list")
          setSelectedTemplate(null)
        }}
        onEdit={() => {
          if (selectedTemplate) {
            setView("edit")
          }
        }}
      />
    )
  }

  // Simple client-side filtering for demonstration
  const filteredTemplates =
    templates?.filter((template) =>
      template.name.toLowerCase().includes(searchTerm.toLowerCase()),
    ) || []

  return (
    <div className="flex flex-col h-full bg-muted/30">
      {/* Header Bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-background border-b border-border">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Mẫu bảng lương</h1>
        <Button
          className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-none"
          onClick={handleOpenCreate}
        >
          <Plus className="w-4 h-4 mr-2" />
          Tạo mới mẫu bảng lương
        </Button>
      </div>

      <div className="flex-1 p-6 space-y-6">
        <div className="bg-background border border-border rounded-xl overflow-hidden shadow-none">
          <div className="p-6 border-b border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm mã mẫu, tên mẫu"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 rounded-full border-border shadow-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                className="rounded-full hover:bg-accent"
                onClick={() => setSearchTerm("")}
              >
                Thiết lập lại
              </Button>
              <Button
                variant="default"
                className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-none"
              >
                Tìm kiếm
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="border-b border-border hover:bg-transparent">
                  <TableHead className="w-12 text-center font-semibold text-foreground">
                    #
                  </TableHead>
                  <TableHead className="font-semibold text-foreground">
                    Tên bảng lương mẫu
                  </TableHead>
                  <TableHead className="font-semibold text-foreground">Ngày tạo</TableHead>
                  <TableHead className="font-semibold text-foreground">Người tạo</TableHead>
                  <TableHead className="font-semibold text-foreground">Mô tả</TableHead>
                  <TableHead className="w-12 text-center"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Đang tải dữ liệu...
                    </TableCell>
                  </TableRow>
                ) : filteredTemplates.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-muted-foreground border-dashed"
                    >
                      Không tìm thấy mẫu bảng lương nào.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTemplates.map((template, index) => (
                    <TableRow
                      key={template.id}
                      className="border-b border-border hover:bg-muted/50 transition-colors"
                    >
                      <TableCell className="text-center">
                        <button
                          onClick={() => handleOpenView(template)}
                          className="text-primary hover:text-primary/80 hover:underline font-medium focus:outline-none"
                        >
                          {index + 1}
                        </button>
                      </TableCell>
                      <TableCell className="text-foreground font-medium">{template.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {template.createdAt
                          ? new Date(template.createdAt).toLocaleDateString("vi-VN")
                          : "N/A"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <div className="flex flex-col">
                          <span>{template.createdBy?.fullName || "Hệ thống"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-50 truncate">
                        {template.description || "N/A"}
                      </TableCell>
                      <TableCell className="text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full hover:bg-accent"
                            >
                              <MoreHorizontal className="h-4 w-4 text-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="rounded-xl border-border shadow-sm"
                          >
                            <DropdownMenuItem
                              className="cursor-pointer"
                              onClick={() => handleOpenEdit(template)}
                            >
                              Chỉnh sửa
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
                              onClick={() => setTemplateToDelete(template)}
                            >
                              Xoá
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

          {/* Pagination Mockup */}
          <div className="p-4 border-t border-border flex items-center justify-end gap-4 text-sm text-muted-foreground bg-muted/30">
            <div className="flex items-center gap-2">
              <span>Hiển thị</span>
              <Select defaultValue="50">
                <SelectTrigger className="w-17.5 h-8 rounded-md border-border shadow-none bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <span>
              Hiển thị từ 1 - {filteredTemplates.length} trên tổng {filteredTemplates.length}
            </span>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" disabled>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="default"
                size="icon"
                className="h-8 w-8 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 shadow-none"
              >
                1
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" disabled>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={!!templateToDelete} onOpenChange={() => setTemplateToDelete(null)}>
        <DialogContent className="sm:max-w-[425px] rounded-xl border border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground text-xl">Xác nhận xoá</DialogTitle>
            <DialogDescription className="text-muted-foreground mt-4 text-base">
              Bạn có chắc chắn muốn xoá mẫu bảng lương{" "}
              <span className="font-semibold text-foreground">{templateToDelete?.name}</span>? Hành
              động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex items-center justify-end gap-3">
            <Button
              variant="outline"
              className="rounded-full border-border hover:bg-accent px-6 shadow-none"
              onClick={() => setTemplateToDelete(null)}
              disabled={isDeleting}
            >
              Huỷ bỏ
            </Button>
            <Button
              variant="destructive"
              className="rounded-full px-6 shadow-none"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Đang xoá..." : "Xác nhận xoá"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ChevronLeft({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

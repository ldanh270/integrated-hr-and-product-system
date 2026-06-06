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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form-ui"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import {
  useCreateCustomSalaryField,
  useCustomSalaryFields,
  useDeleteCustomSalaryField,
  useUpdateCustomSalaryField,
} from "@/hooks/payroll/use-employee-salary-config"
import type { ICustomSalaryField } from "@/types/payroll.types"

import { useEffect, useState } from "react"

import { zodResolver } from "@hookform/resolvers/zod"
import { Calculator, Info, Loader2, MoreHorizontal, Plus, Settings } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

const customFieldSchema = z.object({
  name: z.string().min(2, "Tên biến phải từ 2 ký tự trở lên"),
  code: z
    .string()
    .min(2, "Mã biến phải từ 2 ký tự trở lên")
    .regex(/^[a-z0-9_]+$/, "Mã biến chỉ chứa chữ thường, số và dấu gạch dưới (_)"),
  defaultValue: z.number().min(0, "Giá trị mặc định không được âm"),
  description: z.string().optional(),
})

type CustomFieldFormValues = z.infer<typeof customFieldSchema>

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val)
}

const SYSTEM_VARIABLES = [
  {
    code: "baseSalary",
    name: "Lương cơ bản",
    type: "VND",
    desc: "Lương cứng được thiết lập cho nhân viên",
  },
  {
    code: "workingDays",
    name: "Ngày công thực tế",
    type: "Ngày",
    desc: "Số ngày đi làm thực tế trong tháng",
  },
  { code: "absentDays", name: "Ngày nghỉ", type: "Ngày", desc: "Số ngày vắng mặt trong tháng" },
  {
    code: "overtimeMinutes",
    name: "Phút tăng ca",
    type: "Phút",
    desc: "Tổng số phút làm thêm giờ",
  },
  { code: "lateMinutes", name: "Phút đi trễ", type: "Phút", desc: "Tổng số phút đi trễ" },
  { code: "earlyLeaveMinutes", name: "Phút về sớm", type: "Phút", desc: "Tổng số phút về sớm" },
  { code: "holidayDays", name: "Ngày lễ", type: "Ngày", desc: "Số ngày nghỉ lễ được hưởng lương" },
]

export default function SalaryVariables() {
  const [customFieldDialogOpen, setCustomFieldDialogOpen] = useState(false)
  const [editingField, setEditingField] = useState<ICustomSalaryField | null>(null)

  const { data: customFields, isLoading: isCustomFieldsLoading } = useCustomSalaryFields()
  const createCustomFieldMutation = useCreateCustomSalaryField()
  const updateCustomFieldMutation = useUpdateCustomSalaryField()
  const deleteCustomFieldMutation = useDeleteCustomSalaryField()

  const fieldForm = useForm<CustomFieldFormValues>({
    resolver: zodResolver(customFieldSchema),
    defaultValues: {
      name: "",
      code: "",
      defaultValue: 0,
      description: "",
    },
  })

  useEffect(() => {
    if (customFieldDialogOpen) {
      if (editingField) {
        fieldForm.reset({
          name: editingField.name,
          code: editingField.code,
          defaultValue: Number(editingField.defaultValue),
          description: editingField.description || "",
        })
      } else {
        fieldForm.reset({
          name: "",
          code: "",
          defaultValue: 0,
          description: "",
        })
      }
    }
  }, [customFieldDialogOpen, editingField, fieldForm])

  const onFieldSubmit = async (values: CustomFieldFormValues) => {
    try {
      if (editingField) {
        await updateCustomFieldMutation.mutateAsync({
          id: editingField.id,
          ...values,
        })
        toast.success("Cập nhật biến tùy chỉnh thành công")
      } else {
        await createCustomFieldMutation.mutateAsync(values)
        toast.success("Thêm biến tùy chỉnh thành công")
      }
      setCustomFieldDialogOpen(false)
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } }
      toast.error(error.response?.data?.message || "Có lỗi xảy ra")
    }
  }

  const handleDeleteField = async (id: string) => {
    if (
      window.confirm(
        "Bạn có chắc chắn muốn xóa biến tùy chỉnh này? Các mẫu lương sử dụng biến này có thể bị lỗi.",
      )
    ) {
      try {
        await deleteCustomFieldMutation.mutateAsync(id)
        toast.success("Xóa biến tùy chỉnh thành công")
      } catch (err) {
        const error = err as { response?: { data?: { message?: string } } }
        toast.error(error.response?.data?.message || "Có lỗi xảy ra khi xóa")
      }
    }
  }

  const handleOpenFieldDialog = (field?: ICustomSalaryField) => {
    if (field) {
      setEditingField(field)
    } else {
      setEditingField(null)
    }
    setCustomFieldDialogOpen(true)
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-card">
        <div className="flex items-center gap-2 text-primary font-semibold">
          <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center text-primary">
            <Calculator className="h-3.5 w-3.5" />
          </div>
          Biến số tính lương
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-6">
        {/* Bảng Biến hệ thống */}
        <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b bg-muted/10 flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600">
              <Settings className="h-3.5 w-3.5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">Biến hệ thống (Có sẵn)</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Các biến này được hệ thống tự động cung cấp từ Dữ liệu Chấm công và Lương cơ bản.
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table className="text-xs">
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent border-b">
                  <TableHead className="w-12 py-2 font-semibold text-center">STT</TableHead>
                  <TableHead className="py-2 font-semibold w-48">Mã biến</TableHead>
                  <TableHead className="py-2 font-semibold w-48">Tên hiển thị</TableHead>
                  <TableHead className="py-2 font-semibold w-32">Đơn vị</TableHead>
                  <TableHead className="py-2 font-semibold">Nguồn & Mô tả</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {SYSTEM_VARIABLES.map((v, i) => (
                  <TableRow key={v.code} className="hover:bg-muted/20">
                    <TableCell className="py-2 text-center text-muted-foreground font-medium">
                      {i + 1}
                    </TableCell>
                    <TableCell className="py-2 font-mono text-blue-600/80 font-semibold">
                      {v.code}
                    </TableCell>
                    <TableCell className="py-2 font-medium">{v.name}</TableCell>
                    <TableCell className="py-2 text-muted-foreground">
                      <span className="bg-muted px-2 py-0.5 rounded text-[10px]">{v.type}</span>
                    </TableCell>
                    <TableCell className="py-2 text-muted-foreground flex items-center gap-1.5">
                      <Info className="h-3 w-3 shrink-0" /> {v.desc}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Bảng Biến tùy chỉnh */}
        <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b bg-muted/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600">
                <Plus className="h-3.5 w-3.5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground">
                  Biến tự định nghĩa (Tùy chỉnh)
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Bạn có thể tạo các khoản phụ cấp hoặc tham số riêng (vd: tiền xăng, số ngày
                  chuẩn).
                </p>
              </div>
            </div>
            <Button
              size="sm"
              className="h-8 px-4 text-xs rounded-full gap-1 cursor-pointer shadow-sm"
              onClick={() => handleOpenFieldDialog()}
            >
              <Plus className="h-3.5 w-3.5" /> Thêm biến mới
            </Button>
          </div>
          <div className="overflow-x-auto">
            <Table className="text-xs">
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent border-b">
                  <TableHead className="w-12 py-2 font-semibold text-center">STT</TableHead>
                  <TableHead className="py-2 font-semibold w-48">Mã biến</TableHead>
                  <TableHead className="py-2 font-semibold w-48">Tên hiển thị</TableHead>
                  <TableHead className="py-2 font-semibold w-32">Giá trị mặc định</TableHead>
                  <TableHead className="py-2 font-semibold">Mô tả</TableHead>
                  <TableHead className="w-12 py-2"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isCustomFieldsLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : !customFields || customFields.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      Bạn chưa tạo biến số tùy chỉnh nào.
                    </TableCell>
                  </TableRow>
                ) : (
                  customFields.map((field, index) => (
                    <TableRow key={field.id} className="hover:bg-muted/30">
                      <TableCell className="py-2 text-center text-muted-foreground font-medium">
                        {index + 1}
                      </TableCell>
                      <TableCell className="py-2 font-mono text-amber-600/80 font-semibold">
                        {field.code}
                      </TableCell>
                      <TableCell className="py-2 font-medium">{field.name}</TableCell>
                      <TableCell className="py-2 font-semibold text-foreground/80">
                        {formatCurrency(Number(field.defaultValue))}
                      </TableCell>
                      <TableCell className="py-2 text-muted-foreground max-w-xs truncate">
                        {field.description || "-"}
                      </TableCell>
                      <TableCell className="py-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              className="h-6 w-6 p-0 rounded-full cursor-pointer"
                            >
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="text-xs">
                            <DropdownMenuItem onClick={() => handleOpenFieldDialog(field)}>
                              Chỉnh sửa
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                              onClick={() => handleDeleteField(field.id)}
                            >
                              Xóa biến
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
      </div>

      <Dialog open={customFieldDialogOpen} onOpenChange={setCustomFieldDialogOpen}>
        <DialogContent className="sm:max-w-112.5 rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">
              {editingField ? "Chỉnh sửa biến tùy chỉnh" : "Tạo biến tùy chỉnh mới"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Biến này có thể được chèn vào công thức tính lương của nhân viên.
            </DialogDescription>
          </DialogHeader>

          <Form {...fieldForm}>
            <form onSubmit={fieldForm.handleSubmit(onFieldSubmit)} className="space-y-4 text-xs">
              <FormField
                control={fieldForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">
                      Tên hiển thị (Vd: Phụ cấp đi lại)
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nhập tên hiển thị..."
                        className="rounded-full h-9"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={fieldForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">
                      Mã biến (Vd: transport_allowance)
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nhập mã biến..."
                        className="rounded-full h-9 font-mono"
                        {...field}
                        disabled={!!editingField}
                      />
                    </FormControl>
                    <FormDescription className="text-[10px]">
                      Sử dụng mã này khi bạn viết công thức. Chỉ chứa chữ thường, số, gạch dưới.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={fieldForm.control}
                name="defaultValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Giá trị mặc định (VND)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        className="rounded-full h-9"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription className="text-[10px]">
                      Giá trị này có thể được ghi đè riêng cho từng nhân viên ở mục Cấu hình lương.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={fieldForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Mô tả chi tiết</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Nhập mô tả cho biến này..."
                        className="rounded-lg resize-none min-h-16"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCustomFieldDialogOpen(false)}
                  className="rounded-full h-9 cursor-pointer"
                >
                  Hủy
                </Button>
                <Button type="submit" className="rounded-full h-9 cursor-pointer">
                  Lưu thay đổi
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

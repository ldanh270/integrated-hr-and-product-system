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
import { zodResolver } from "@hookform/resolvers/zod"
import { Coins, Loader2, MoreHorizontal, Plus, Settings } from "lucide-react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

const customFieldSchema = z.object({
  name: z.string().min(2, "Tên trường phải từ 2 ký tự trở lên"),
  code: z
    .string()
    .min(2, "Mã trường phải từ 2 ký tự trở lên")
    .regex(/^[a-z0-9_]+$/, "Mã trường chỉ chứa chữ thường, số và dấu gạch dưới (_)"),
  defaultValue: z.number().min(0, "Giá trị mặc định không được âm"),
  description: z.string().optional(),
})

type CustomFieldFormValues = z.infer<typeof customFieldSchema>

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val)
}

export default function CustomSalaryFields() {
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
        toast.success("Cập nhật trường tự định nghĩa thành công")
      } else {
        await createCustomFieldMutation.mutateAsync(values)
        toast.success("Thêm trường tự định nghĩa thành công")
      }
      setCustomFieldDialogOpen(false)
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } }
      toast.error(error.response?.data?.message || "Có lỗi xảy ra")
    }
  }

  const handleDeleteField = async (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa trường tự định nghĩa này?")) {
      try {
        await deleteCustomFieldMutation.mutateAsync(id)
        toast.success("Xóa trường tự định nghĩa thành công")
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
            <Settings className="h-3.5 w-3.5" />
          </div>
          Trường tùy chỉnh
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3 text-xs rounded-full gap-1 cursor-pointer"
            onClick={() => handleOpenFieldDialog()}
          >
            <Plus className="h-3.5 w-3.5" /> Thêm trường
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        <div className="rounded-md border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="text-xs">
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-transparent border-b">
                  <TableHead className="w-12 py-2 font-semibold text-center">STT</TableHead>
                  <TableHead className="py-2 font-semibold">Mã trường</TableHead>
                  <TableHead className="py-2 font-semibold">Tên trường</TableHead>
                  <TableHead className="py-2 font-semibold">Giá trị mặc định</TableHead>
                  <TableHead className="py-2 font-semibold hidden md:table-cell">Mô tả</TableHead>
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
                      Chưa có trường tự định nghĩa nào được tạo.
                    </TableCell>
                  </TableRow>
                ) : (
                  customFields.map((field, index) => (
                    <TableRow key={field.id} className="hover:bg-muted/30">
                      <TableCell className="py-2 text-center text-muted-foreground">
                        {index + 1}
                      </TableCell>
                      <TableCell className="py-2 font-mono text-primary/80 font-medium">
                        {field.code}
                      </TableCell>
                      <TableCell className="py-2 font-medium">{field.name}</TableCell>
                      <TableCell className="py-2 font-semibold">
                        {formatCurrency(Number(field.defaultValue))}
                      </TableCell>
                      <TableCell className="py-2 hidden md:table-cell text-muted-foreground max-w-xs truncate">
                        {field.description || "-"}
                      </TableCell>
                      <TableCell className="py-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-6 w-6 p-0 rounded-full cursor-pointer">
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
                              Xóa trường
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
              {editingField ? "Chỉnh sửa trường lương" : "Thêm trường lương mới"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Các trường này sẽ được thêm làm biến số trong cấu hình lương nhân viên.
            </DialogDescription>
          </DialogHeader>

          <Form {...fieldForm}>
            <form onSubmit={fieldForm.handleSubmit(onFieldSubmit)} className="space-y-4 text-xs">
              <FormField
                control={fieldForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Tên trường (Vd: Phụ cấp đi lại)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nhập tên trường..."
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
                      Mã trường (Vd: transport_allowance)
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nhập mã trường..."
                        className="rounded-full h-9 font-mono"
                        {...field}
                        disabled={!!editingField}
                      />
                    </FormControl>
                    <FormDescription className="text-[10px]">
                      Mã trường dùng làm biến trong công thức tính lương. Chỉ chứa chữ thường, số,
                      gạch dưới.
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
                        placeholder="Nhập mô tả cho trường này..."
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

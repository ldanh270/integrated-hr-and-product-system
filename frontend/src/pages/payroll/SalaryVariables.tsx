import { PageCard, PageHeader, useConfirm } from "@/components/common"
import { Badge } from "@/components/ui/badge"
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form-ui"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
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
  useCreateSalaryVariable,
  useDeleteSalaryVariable,
  useSalaryVariables,
  useUpdateSalaryVariable,
} from "@/hooks/payroll/use-salary-variable"
import type { ISalaryVariable } from "@/hooks/payroll/use-salary-variable"

import { useState } from "react"

import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import { useForm } from "react-hook-form"
import * as z from "zod"

const formSchema = z.object({
  code: z.string().min(1, "Code is required").max(50),
  name: z.string().min(1, "Name is required").max(100),
  value: z.number().min(0, "Value must be positive"),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
})

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
  const createMutation = useCreateSalaryVariable()
  const updateMutation = useUpdateSalaryVariable()
  const deleteMutation = useDeleteSalaryVariable()

  const [isOpen, setIsOpen] = useState(false)
  const [editingVariable, setEditingVariable] = useState<ISalaryVariable | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      code: "",
      name: "",
      value: 0,
      description: "",
      isActive: true,
    },
  })

  const handleOpenCreate = () => {
    setEditingVariable(null)
    form.reset({
      code: "",
      name: "",
      value: 0,
      description: "",
      isActive: true,
    })
    setIsOpen(true)
  }

  const handleOpenEdit = (variable: ISalaryVariable) => {
    setEditingVariable(variable)
    form.reset({
      code: variable.code,
      name: variable.name,
      value: variable.value,
      description: variable.description || "",
      isActive: variable.isActive,
    })
    setIsOpen(true)
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

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (editingVariable) {
        await updateMutation.mutateAsync({
          id: editingVariable.id,
          payload: values,
        })
      } else {
        await createMutation.mutateAsync(values)
      }
      setIsOpen(false)
    } catch {
      // Error is handled in mutation
    }
  }

  return (
    <div className="container px-6 py-6">
      <PageHeader
        title="Biến hệ thống"
        description="Quản lý các biến số dùng chung cho công thức tính lương."
        actions={
          <Button className="gap-2" onClick={handleOpenCreate}>
            <Plus size={16} /> Thêm biến mới
          </Button>
        }
      />

      <PageCard className="overflow-hidden p-0" noBorder={false}>
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
                ([...SYSTEM_VARIABLES, ...(variables || [])] as VariableRow[]).map(
                  (variable, index) => (
                    <TableRow
                      key={variable.id}
                      className={`hover:bg-muted/30 ${variable.isSystem ? "bg-muted/10" : ""}`}
                    >
                      <TableCell className="px-4 py-3 text-muted-foreground text-center">
                        {index + 1}
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
                          className="text-[10px] font-semibold"
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
                              className="h-8 w-8 rounded-md"
                              onClick={() => handleOpenEdit(variable as ISalaryVariable)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-md text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDelete(variable.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic px-2">
                            Mặc định
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ),
                )
              )}
            </TableBody>
          </Table>
        </div>
      </PageCard>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-106.25">
          <DialogHeader>
            <DialogTitle>{editingVariable ? "Edit Variable" : "Create Variable"}</DialogTitle>
            <DialogDescription>
              Variables can be used in salary component formulas. Code must be unique.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code</FormLabel>
                    <FormControl>
                      <Input placeholder="MUC_LUONG_CO_SO" {...field} />
                    </FormControl>
                    <FormDescription>Must be camelCase (e.g., mealAllowance).</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Mức lương cơ sở" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Value</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) =>
                          field.onChange(e.target.value === "" ? 0 : Number(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Optional description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {editingVariable && (
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Active</FormLabel>
                        <FormDescription>
                          Inactive variables cannot be used in new formulas.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingVariable ? "Save changes" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

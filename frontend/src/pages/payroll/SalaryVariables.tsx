import { useState } from "react"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

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
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react"
import {
  useSalaryVariables,
  useCreateSalaryVariable,
  useUpdateSalaryVariable,
  useDeleteSalaryVariable,
} from "@/hooks/payroll/use-salary-variable"
import type { ISalaryVariable } from "@/hooks/payroll/use-salary-variable"

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
  const { data: variables, isLoading } = useSalaryVariables()
  const createMutation = useCreateSalaryVariable()
  const updateMutation = useUpdateSalaryVariable()
  const deleteMutation = useDeleteSalaryVariable()

  const [isOpen, setIsOpen] = useState(false)
  const [editingVariable, setEditingVariable] = useState<ISalaryVariable | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
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
    if (confirm("Are you sure you want to delete this variable?")) {
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
    <div className="flex h-full flex-col bg-background">
      {/* Enterprise Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-card">
        <div className="flex items-center gap-2 text-primary font-semibold">
          <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center text-primary">
            +
          </div>
          Biến hệ thống
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="h-8 px-3 text-xs" onClick={handleOpenCreate}>
            <Plus className="mr-1 h-3 w-3" /> Thêm biến mới
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="rounded-md border bg-card">
          <Table className="text-xs">
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="py-2 font-semibold">Mã biến (Code)</TableHead>
                <TableHead className="py-2 font-semibold">Tên biến</TableHead>
                <TableHead className="py-2 font-semibold">Giá trị mặc định</TableHead>
                <TableHead className="py-2 font-semibold">Trạng thái</TableHead>
                <TableHead className="w-24 py-2 font-semibold text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!variables && isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : (
                ([...SYSTEM_VARIABLES, ...(variables || [])] as VariableRow[]).map((variable) => (
                  <TableRow key={variable.id} className={`hover:bg-muted/30 ${variable.isSystem ? "bg-muted/10" : ""}`}>
                    <TableCell className="py-2 font-mono font-medium text-primary/80">{variable.code}</TableCell>
                    <TableCell className="py-2">
                      <div className="font-medium">{variable.name}</div>
                      {variable.description && (
                        <div className="text-muted-foreground line-clamp-1 mt-0.5">
                          {variable.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="py-2">{typeof variable.value === "number" ? variable.value.toLocaleString() : variable.value}</TableCell>
                    <TableCell className="py-2">
                      <Badge variant={variable.isActive ? "default" : "secondary"} className="h-5 text-[10px]">
                        {variable.isSystem ? "Hệ thống" : variable.isActive ? "Hoạt động" : "Vô hiệu"}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2 text-right">
                      {!variable.isSystem ? (
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleOpenEdit(variable as ISalaryVariable)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={() => handleDelete(variable.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-muted-foreground italic px-2">Mặc định</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
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
                        onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
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
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
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

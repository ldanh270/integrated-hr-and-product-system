import EmployeeSalaryConfigDialog from "@/components/features/payroll/employee-salary-config-dialog"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useEmployees } from "@/hooks/employees/queries/useEmployeeQuery"
import {
  useActiveSalaryConfig,
  useCreateCustomSalaryField,
  useCustomSalaryFields,
  useDeleteCustomSalaryField,
  usePayslipTemplates,
  useUpdateCustomSalaryField,
} from "@/hooks/payroll/use-employee-salary-config"
import { usePayrollSettings, useUpdatePayrollSettings } from "@/hooks/payroll/use-payroll-settings"
import type { Employee } from "@/types/employee.types"
import type { ICustomSalaryField } from "@/types/payroll.types"

import { useEffect, useState } from "react"

import { zodResolver } from "@hookform/resolvers/zod"
import {
  CalendarDays,
  Coins,
  Loader2,
  MoreHorizontal,
  Plus,
  Save,
  Search,
  Settings,
  User,
  Users,
} from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

// Zod validation schemas
const settingsSchema = z.object({
  triggerDay: z.number().min(1).max(31, "Ngày chạy phải từ 1 đến 31"),
  standardWorkingDays: z.number().min(1, "Số ngày làm việc tiêu chuẩn phải lớn hơn 0"),
})

type SettingsFormValues = z.infer<typeof settingsSchema>

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

// Helper to format currency
const formatCurrency = (val: number) => {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val)
}

export default function PayrollSettings() {
  const [activeTab, setActiveTab] = useState<string>("cycle")
  const [searchQuery, setSearchQuery] = useState("")
  const [page, setPage] = useState(1)

  // Dialog state for Employee Salary Config
  const [configDialogOpen, setConfigDialogOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<{
    id: string
    fullName: string
    position?: string
  } | null>(null)

  // Dialog state for Custom Field CRUD
  const [customFieldDialogOpen, setCustomFieldDialogOpen] = useState(false)
  const [editingField, setEditingField] = useState<ICustomSalaryField | null>(null)

  // React Query data
  const { data: settings, isLoading: isSettingsLoading } = usePayrollSettings()
  const { mutateAsync: updateSettings, isPending: isUpdatingSettings } = useUpdatePayrollSettings()

  const { data: employeeData, isLoading: isEmployeesLoading } = useEmployees({
    page,
    limit: 10,
    search: searchQuery,
  })

  const { data: customFields, isLoading: isCustomFieldsLoading } = useCustomSalaryFields()
  const createCustomFieldMutation = useCreateCustomSalaryField()
  const updateCustomFieldMutation = useUpdateCustomSalaryField()
  const deleteCustomFieldMutation = useDeleteCustomSalaryField()

  // Global settings form
  const settingsForm = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      triggerDay: 5,
      standardWorkingDays: 22,
    },
  })

  // Custom Field Form
  const fieldForm = useForm<CustomFieldFormValues>({
    resolver: zodResolver(customFieldSchema),
    defaultValues: {
      name: "",
      code: "",
      defaultValue: 0,
      description: "",
    },
  })

  // Sync settings when loaded
  useEffect(() => {
    if (settings) {
      settingsForm.reset({
        triggerDay: settings.triggerDay,
        standardWorkingDays: settings.standardWorkingDays,
      })
    }
  }, [settings, settingsForm])

  // Sync custom field form when editing
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

  const onSettingsSubmit = async (values: SettingsFormValues) => {
    try {
      await updateSettings(values)
      toast.success("Cập nhật cấu hình chu kỳ lương thành công")
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } }
      toast.error(error.response?.data?.message || "Có lỗi xảy ra khi cập nhật")
    }
  }

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

  const handleOpenConfigDialog = (emp: { id: string; fullName: string; position?: string }) => {
    setSelectedEmployee(emp)
    setConfigDialogOpen(true)
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
      {/* Enterprise Header (Styled to match SalaryComponents.tsx) */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-card">
        <div className="flex items-center gap-2 text-primary font-semibold">
          <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center text-primary">
            <Settings className="h-3.5 w-3.5" />
          </div>
          Cấu hình lương
        </div>
        <div className="flex items-center gap-3">
          {activeTab === "fields" && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs rounded-full gap-1"
              onClick={() => handleOpenFieldDialog()}
            >
              <Plus className="h-3.5 w-3.5" /> Thêm trường
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4 flex-1 flex flex-col min-h-0"
        >
          <TabsList className="rounded-full w-fit bg-muted p-1 border">
            <TabsTrigger
              value="cycle"
              className="rounded-full px-4 py-1 text-xs font-medium gap-1.5"
            >
              <CalendarDays className="h-3.5 w-3.5" /> Chu kỳ lương
            </TabsTrigger>
            <TabsTrigger
              value="employees"
              className="rounded-full px-4 py-1 text-xs font-medium gap-1.5"
            >
              <Users className="h-3.5 w-3.5" /> Lương nhân viên
            </TabsTrigger>
            <TabsTrigger
              value="fields"
              className="rounded-full px-4 py-1 text-xs font-medium gap-1.5"
            >
              <Coins className="h-3.5 w-3.5" /> Trường tùy chỉnh
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Global Cycle Settings */}
          <TabsContent value="cycle" className="outline-none mt-0">
            <div className="max-w-xl bg-card border rounded-xl shadow-sm p-6">
              <div className="mb-5 border-b pb-4">
                <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Coins className="h-4 w-4 text-primary" /> Thiết lập chu kỳ tự động
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Thiết lập ngày thanh toán lương tự động và số ngày công tiêu chuẩn làm căn cứ tính
                  lương.
                </p>
              </div>

              {isSettingsLoading ? (
                <div className="flex h-40 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Form {...settingsForm}>
                  <form
                    onSubmit={settingsForm.handleSubmit(onSettingsSubmit)}
                    className="space-y-4 text-xs"
                  >
                    <FormField
                      control={settingsForm.control}
                      name="standardWorkingDays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold text-foreground">
                            Số ngày công tiêu chuẩn (ngày/tháng)
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              className="rounded-full h-9"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription className="text-[10px]">
                            Dùng để làm mẫu số tính lương ngày công thực tế (Vd: 22 hoặc 26 ngày).
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={settingsForm.control}
                      name="triggerDay"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold text-foreground">
                            Ngày tính lương tự động hàng tháng
                          </FormLabel>
                          <Select
                            onValueChange={(val) => field.onChange(Number(val))}
                            value={field.value.toString()}
                          >
                            <FormControl>
                              <SelectTrigger className="rounded-full h-9">
                                <SelectValue placeholder="Chọn ngày" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Array.from({ length: 31 }).map((_, i) => (
                                <SelectItem key={i + 1} value={(i + 1).toString()}>
                                  Ngày {i + 1}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription className="text-[10px]">
                            Ngày hệ thống tự động khóa sổ, quét ngày công và tạo bản nháp bảng lương
                            hàng tháng.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="pt-2 border-t flex justify-end">
                      <Button
                        type="submit"
                        disabled={isUpdatingSettings}
                        className="rounded-full h-9 px-5 gap-1.5"
                      >
                        {isUpdatingSettings ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-3.5 w-3.5" />
                        )}
                        Lưu cấu hình
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
            </div>
          </TabsContent>

          {/* Tab 2: Employee Configurations (Refactored List UI to match components page) */}
          <TabsContent value="employees" className="outline-none mt-0">
            <div className="rounded-md border bg-card overflow-hidden">
              {/* Toolbar */}
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

              {/* Table */}
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

              {/* Pagination */}
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
          </TabsContent>

          {/* Tab 3: Custom Salary Fields */}
          <TabsContent value="fields" className="outline-none mt-0">
            <div className="rounded-md border bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <Table className="text-xs">
                  <TableHeader className="bg-muted/50">
                    <TableRow className="hover:bg-transparent border-b">
                      <TableHead className="w-12 py-2 font-semibold text-center">STT</TableHead>
                      <TableHead className="py-2 font-semibold">Mã trường</TableHead>
                      <TableHead className="py-2 font-semibold">Tên trường</TableHead>
                      <TableHead className="py-2 font-semibold">Giá trị mặc định</TableHead>
                      <TableHead className="py-2 font-semibold hidden md:table-cell">
                        Mô tả
                      </TableHead>
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
                                <Button variant="ghost" className="h-6 w-6 p-0 rounded-full">
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
          </TabsContent>
        </Tabs>
      </div>

      {/* Employee Configuration Dialog */}
      <EmployeeSalaryConfigDialog
        open={configDialogOpen}
        onOpenChange={setConfigDialogOpen}
        employee={selectedEmployee}
      />

      {/* Custom Field Add/Edit Dialog */}
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
                  className="rounded-full h-9"
                >
                  Hủy
                </Button>
                <Button type="submit" className="rounded-full h-9">
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

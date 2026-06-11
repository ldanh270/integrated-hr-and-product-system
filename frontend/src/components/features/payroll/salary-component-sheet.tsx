import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form-ui"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import {
  COMPONENT_TYPE,
  COMPONENT_TYPE_LABELS,
  COMPONENT_VALUE_TYPE,
  COMPONENT_VALUE_TYPE_LABELS,
  SALARY_COMPONENT_TYPES,
  SALARY_COMPONENT_VALUE_TYPES,
} from "@/config/entities/payroll.config"
import {
  useCreateSalaryComponent,
  useUpdateSalaryComponent,
} from "@/hooks/payroll/use-salary-components"
import { useSalaryVariables } from "@/hooks/payroll/use-salary-variable"
import type { ISalaryComponent } from "@/types/payroll.types"

import { useEffect, useMemo, useState } from "react"

import { zodResolver } from "@hookform/resolvers/zod"
import { Info, Loader2 } from "lucide-react"
import { useForm, useWatch } from "react-hook-form"
import { z } from "zod"

const formSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(2, "Tên thành phần phải từ 2 ký tự trở lên"),
  type: z.enum(SALARY_COMPONENT_TYPES),
  valueType: z.enum(SALARY_COMPONENT_VALUE_TYPES),
  formula: z.string().min(1, "Vui lòng nhập công thức hoặc giá trị tĩnh"),
  description: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: ISalaryComponent | null
}

export default function SalaryComponentSheet({ open, onOpenChange, initialData }: Props) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
      name: "",
      type: COMPONENT_TYPE.ADDITION,
      valueType: COMPONENT_VALUE_TYPE.CURRENCY,
      formula: "",
      description: "",
    },
  })

  const { reset, control, setValue } = form
  const formulaValue = useWatch({ control, name: "formula" })
  const nameValue = useWatch({ control, name: "name" })
  const { data: variables } = useSalaryVariables({ isActive: true })

  const [debouncedFormula, setDebouncedFormula] = useState("")

  useEffect(() => {
    const timer = setTimeout(
      () => {
        setDebouncedFormula(formulaValue || "")
      },
      formulaValue ? 500 : 0,
    )

    return () => clearTimeout(timer)
  }, [formulaValue])

  // Derive formula validation status
  const formulaStatus = useMemo((): "idle" | "validating" | "valid" | "invalid" => {
    if (!formulaValue) return "idle"
    if (formulaValue !== debouncedFormula) return "validating"
    return /^[/*+]/.test(debouncedFormula.trim()) ? "invalid" : "valid"
  }, [formulaValue, debouncedFormula])

  // Reset form when dialog opens or initialData changes
  useEffect(() => {
    if (open) {
      if (initialData) {
        reset({
          code: initialData.code || "",
          name: initialData.name,
          type: initialData.type,
          valueType: initialData.valueType || COMPONENT_VALUE_TYPE.CURRENCY,
          formula: initialData.formula,
          description: initialData.description || "",
        })
      } else {
        reset({
          code: "",
          name: "",
          type: COMPONENT_TYPE.ADDITION,
          valueType: COMPONENT_VALUE_TYPE.CURRENCY,
          formula: "",
          description: "",
        })
      }
    }
  }, [open, initialData, reset])

  const createMutation = useCreateSalaryComponent()
  const updateMutation = useUpdateSalaryComponent()

  const isPending = createMutation.isPending || updateMutation.isPending

  const onSubmit = (values: FormValues) => {
    if (initialData) {
      updateMutation.mutate(
        { id: initialData.id, ...values },
        {
          onSuccess: () => onOpenChange(false),
        },
      )
    } else {
      createMutation.mutate(
        { ...values, isActive: true },
        {
          onSuccess: () => onOpenChange(false),
        },
      )
    }
  }

  // Helper to generate code from name if empty
  const handleAutoGenerateCode = () => {
    if (nameValue && !form.getValues("code")) {
      const generatedCode = nameValue
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase()
        .replace(/\s+/g, "_")
        .replace(/[^A-Z0-9_]/g, "")
      setValue("code", generatedCode, { shouldValidate: true })
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md md:max-w-xl overflow-y-auto flex flex-col h-full bg-background border-l">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-xl">
            {initialData ? "Cập nhật thành phần lương" : "Thêm thành phần lương mới"}
          </SheetTitle>
          <SheetDescription>
            {initialData
              ? "Chỉnh sửa các thiết lập và cấu hình tính toán."
              : "Khởi tạo một thành phần lương mới trong hệ thống."}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col space-y-6">
            <div className="flex-1 space-y-5">
              {/* Group: Thông tin cơ bản */}
              <div className="space-y-4">
                <div className="font-semibold text-sm text-primary uppercase tracking-wider mb-2">
                  Thông tin cơ bản
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="col-span-2 sm:col-span-1">
                        <FormLabel>
                          Tên thành phần <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="VD: Phụ cấp đi lại"
                            {...field}
                            onBlur={() => {
                              field.onBlur()
                              handleAutoGenerateCode()
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem className="col-span-2 sm:col-span-1">
                        <FormLabel>Mã thành phần</FormLabel>
                        <FormControl>
                          <Input placeholder="Tự động sinh hoặc nhập mã..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mô tả chi tiết</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Mô tả điều kiện áp dụng thành phần này..."
                          className="resize-none h-20"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Group: Phân loại & Giá trị */}
              <div className="space-y-4 pt-4 border-t">
                <div className="font-semibold text-sm text-primary uppercase tracking-wider mb-2">
                  Phân loại & Giá trị
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Loại thành phần <span className="text-destructive">*</span>
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn loại thành phần" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(COMPONENT_TYPE_LABELS).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="valueType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Kiểu giá trị <span className="text-destructive">*</span>
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn kiểu giá trị" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(COMPONENT_VALUE_TYPE_LABELS).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Group: Cấu hình tính toán */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold text-sm text-primary uppercase tracking-wider">
                    Công thức tính toán
                  </div>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs text-muted-foreground gap-1 px-2"
                      >
                        <Info className="h-3 w-3" /> Hướng dẫn
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 text-sm space-y-3" align="end" side="left">
                      <div className="font-medium">Hướng dẫn gõ công thức</div>
                      <div className="space-y-2 text-muted-foreground">
                        <p>
                          <strong className="text-foreground">Giá trị tĩnh:</strong> Nhập số nguyên
                          hoặc thập phân (VD: 500000, 0.1).
                        </p>
                        <p>
                          <strong className="text-foreground">Toán tử:</strong> Hỗ trợ các phép toán
                          cơ bản như +, -, *, /.
                        </p>
                        <p>
                          <strong className="text-foreground">Biến số:</strong>
                          <ul className="list-disc pl-5 mt-1 space-y-1">
                            <li>
                              <code>baseSalary</code> (Lương cơ bản)
                            </li>
                            <li>
                              <code>workingDays</code> (Ngày công)
                            </li>
                            <li>
                              <code>overtimeMinutes</code> (Phút tăng ca)
                            </li>
                            {variables &&
                              variables.map((v) => (
                                <li key={v.id}>
                                  <code>{v.code}</code> ({v.name})
                                </li>
                              ))}
                          </ul>
                        </p>
                        <p className="text-xs italic bg-muted p-2 rounded mt-2">
                          Gợi ý: Nếu nhập giá trị tĩnh, hãy đảm bảo chọn đúng Kiểu giá trị.
                        </p>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                <FormField
                  control={form.control}
                  name="formula"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Công thức / Giá trị <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="VD: baseSalary * 0.1 hoặc 500000"
                          className="font-mono text-sm"
                          {...field}
                        />
                      </FormControl>

                      <div className="text-xs mt-1 h-4 flex items-center">
                        {formulaStatus === "validating" && (
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Loader2 className="h-3 w-3 animate-spin" /> Đang kiểm tra công thức...
                          </span>
                        )}
                        {formulaStatus === "valid" && (
                          <span className="text-success">✔ Công thức hợp lệ</span>
                        )}
                        {formulaStatus === "invalid" && (
                          <span className="text-destructive">✖ Lỗi cú pháp công thức</span>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <SheetFooter className="mt-auto pt-6 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Hủy bỏ
              </Button>
              <Button type="submit" disabled={isPending || formulaStatus === "invalid"}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {initialData ? "Cập nhật" : "Tạo mới"}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}

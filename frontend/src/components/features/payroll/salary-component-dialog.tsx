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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  COMPONENT_TYPE,
  COMPONENT_TYPE_LABELS,
  SALARY_COMPONENT_TYPES,
} from "@/config/entities/payroll.config"
import {
  useCreateSalaryComponent,
  useUpdateSalaryComponent,
} from "@/hooks/payroll/use-salary-components"
import type { ISalaryComponent } from "@/types/payroll.types"

import { useEffect, useMemo, useState } from "react"

import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { useForm, useWatch } from "react-hook-form"
import { z } from "zod"

const formSchema = z.object({
  name: z.string().min(2, "Tên thành phần phải từ 2 ký tự trở lên"),
  type: z.enum(SALARY_COMPONENT_TYPES),
  formula: z.string().min(1, "Vui lòng nhập công thức hoặc giá trị tĩnh"),
  description: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: ISalaryComponent | null
}

export default function SalaryComponentDialog({ open, onOpenChange, initialData }: Props) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: COMPONENT_TYPE.ADDITION,
      formula: "",
      description: "",
    },
  })

  const { reset, control } = form
  const formulaValue = useWatch({ control, name: "formula" })

  const [debouncedFormula, setDebouncedFormula] = useState("")

  // Update debounced value after a delay, or immediately if empty to avoid synchronous updates inside effect body
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
          name: initialData.name,
          type: initialData.type,
          formula: initialData.formula,
          description: initialData.description || "",
        })
      } else {
        reset({
          name: "",
          type: COMPONENT_TYPE.ADDITION,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Chỉnh sửa thành phần lương" : "Thêm thành phần lương mới"}
          </DialogTitle>
          <DialogDescription>
            {initialData
              ? "Cập nhật công thức hoặc thông tin chi tiết."
              : "Thêm một thành phần mới vào thư viện cấu hình lương."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên thành phần</FormLabel>
                  <FormControl>
                    <Input placeholder="Vd: Phụ cấp đi lại" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loại thành phần</FormLabel>
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
              name="formula"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Công thức / Giá trị tĩnh</FormLabel>
                  <FormControl>
                    <Input placeholder="Vd: baseSalary * 0.1 hoặc 500000" {...field} />
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
                  <FormDescription className="text-xs">
                    Sử dụng các biến có sẵn: <code>baseSalary</code>, <code>workingDays</code>,{" "}
                    <code>overtimeMinutes</code>...
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mô tả chi tiết</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Mô tả điều kiện áp dụng thành phần này..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={isPending || formulaStatus === "invalid"}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {initialData ? "Lưu thay đổi" : "Thêm mới"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

import {
  COMPONENT_TYPE,
  COMPONENT_VALUE_TYPE,
  SALARY_COMPONENT_TYPES,
  SALARY_COMPONENT_VALUE_TYPES,
} from "@/config/entities/payroll.config"
import {
  useCreateSalaryComponent,
  useUpdateSalaryComponent,
} from "@/hooks/payroll/use-salary-components"
import type { ISalaryComponent } from "@/types/payroll.types"

import { useEffect, useMemo, useState } from "react"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

const formSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(2, "Tên thành phần phải từ 2 ký tự trở lên"),
  type: z.enum(SALARY_COMPONENT_TYPES),
  valueType: z.enum(SALARY_COMPONENT_VALUE_TYPES),
  formula: z.string().min(1, "Vui lòng nhập công thức hoặc giá trị tĩnh"),
  description: z.string().optional(),
})

export type SalaryComponentFormValues = z.infer<typeof formSchema>

interface UseSalaryComponentFormProps {
  initialData?: ISalaryComponent | null
  onSuccess?: () => void
}

export function useSalaryComponentForm({
  initialData,
  onSuccess,
}: UseSalaryComponentFormProps = {}) {
  const form = useForm<SalaryComponentFormValues>({
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

  const { reset, control, setValue, getValues } = form
  const formulaValue = useWatch({ control, name: "formula" })
  const nameValue = useWatch({ control, name: "name" })

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

  // Reset form when initialData changes
  useEffect(() => {
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
  }, [initialData, reset])

  const createMutation = useCreateSalaryComponent()
  const updateMutation = useUpdateSalaryComponent()

  const isPending = createMutation.isPending || updateMutation.isPending

  const onSubmit = async (values: SalaryComponentFormValues) => {
    try {
      if (initialData) {
        await updateMutation.mutateAsync({ id: initialData.id, ...values })
        toast.success("Cập nhật thành phần lương thành công.")
      } else {
        await createMutation.mutateAsync({ ...values, isActive: true })
        toast.success("Tạo thành phần lương thành công.")
      }
      onSuccess?.()
    } catch {
      toast.error("Có lỗi xảy ra khi lưu thành phần lương. Vui lòng thử lại.")
    }
  }

  // Helper to generate code from name if empty
  const handleAutoGenerateCode = () => {
    if (nameValue && !getValues("code")) {
      const generatedCode = nameValue
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase()
        .replace(/\s+/g, "_")
        .replace(/[^A-Z0-9_]/g, "")
      setValue("code", generatedCode, { shouldValidate: true })
    }
  }

  // Insert a variable into the formula at current cursor or end
  const appendToFormula = (variableCode: string) => {
    const current = getValues("formula") || ""
    // Simple append for now, can be upgraded to insert at cursor position via ref if needed
    const separator = current && !current.endsWith(" ") ? " " : ""
    setValue("formula", `${current}${separator}${variableCode}`, {
      shouldValidate: true,
      shouldDirty: true,
    })
  }

  return {
    form,
    isPending,
    formulaStatus,
    onSubmit: form.handleSubmit(onSubmit),
    handleAutoGenerateCode,
    appendToFormula,
  }
}

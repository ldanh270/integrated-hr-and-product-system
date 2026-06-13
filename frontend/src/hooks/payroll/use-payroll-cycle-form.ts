import { useUpdatePayrollSettings } from "@/hooks/payroll/use-payroll-settings"
import type { IPayrollSettings } from "@/types/payroll.types"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

export const settingsSchema = z.object({
  triggerDay: z.number().min(1).max(31, "Ngày chạy phải từ 1 đến 31"),
  triggerHour: z.number().min(0).max(23),
  triggerMinute: z.number().min(0).max(59),
})

export type SettingsFormValues = z.infer<typeof settingsSchema>

export function usePayrollCycleForm({
  initialData,
  onSuccess,
}: {
  initialData: IPayrollSettings
  onSuccess?: () => void
}) {
  const { mutateAsync: updateSettings, isPending } = useUpdatePayrollSettings()

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      triggerDay: initialData?.triggerDay || 5,
      triggerHour: initialData?.triggerHour || 0,
      triggerMinute: initialData?.triggerMinute || 0,
    },
  })

  const onSubmit = async (values: SettingsFormValues) => {
    try {
      await updateSettings(values)
      toast.success("Cập nhật cấu hình thành công")
      // Update default values to new ones to reset isDirty state
      form.reset(values)
      if (onSuccess) onSuccess()
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } }
      toast.error(error.response?.data?.message || "Có lỗi xảy ra khi cập nhật")
    }
  }

  return { form, isPending, onSubmit: form.handleSubmit(onSubmit) }
}

import { PAYROLL_MESSAGES } from "@/config/messages/payroll.message"
import { useUpdatePayrollSettings } from "@/hooks/payroll/use-payroll-settings"
import type { IPayrollSettings } from "@/types/payroll.types"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

export const settingsSchema = z.object({
  triggerDay: z.number().min(1).max(28, PAYROLL_MESSAGES.VALIDATION.TRIGGER_DAY_RANGE),
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
      toast.success(PAYROLL_MESSAGES.SUCCESS.UPDATE_PAYROLL_CYCLE)
      // Update default values to new ones to reset isDirty state
      form.reset(values)
      if (onSuccess) onSuccess()
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } }
      toast.error(error.response?.data?.message || PAYROLL_MESSAGES.ERRORS.UPDATE_PAYROLL_CYCLE)
    }
  }

  return { form, isPending, onSubmit: form.handleSubmit(onSubmit) }
}

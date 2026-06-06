import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form-ui"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { usePayrollSettings, useUpdatePayrollSettings } from "@/hooks/payroll/use-payroll-settings"
import { zodResolver } from "@hookform/resolvers/zod"
import { CalendarDays, Coins, Loader2, Save } from "lucide-react"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

const settingsSchema = z.object({
  triggerDay: z.number().min(1).max(31, "Ngày chạy phải từ 1 đến 31"),
})

type SettingsFormValues = z.infer<typeof settingsSchema>

export default function PayrollCycle() {
  const { data: settings, isLoading: isSettingsLoading } = usePayrollSettings()
  const { mutateAsync: updateSettings, isPending: isUpdatingSettings } = useUpdatePayrollSettings()

  const settingsForm = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      triggerDay: 5,
    },
  })

  useEffect(() => {
    if (settings) {
      settingsForm.reset({
        triggerDay: settings.triggerDay,
      })
    }
  }, [settings, settingsForm])

  const onSettingsSubmit = async (values: SettingsFormValues) => {
    try {
      await updateSettings(values)
      toast.success("Cập nhật cấu hình chu kỳ lương thành công")
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } }
      toast.error(error.response?.data?.message || "Có lỗi xảy ra khi cập nhật")
    }
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-card">
        <div className="flex items-center gap-2 text-primary font-semibold">
          <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center text-primary">
            <CalendarDays className="h-3.5 w-3.5" />
          </div>
          Chu kỳ lương
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        <div className="max-w-xl bg-card border rounded-xl shadow-sm p-6">
          <div className="mb-5 border-b pb-4">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Coins className="h-4 w-4 text-primary" /> Thiết lập chu kỳ tự động
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Thiết lập ngày thanh toán lương tự động hàng tháng.
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
      </div>
    </div>
  )
}

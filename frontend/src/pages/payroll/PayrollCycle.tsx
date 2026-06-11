import { PageCard, PageHeader } from "@/components/common"
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
import type { IPayrollSettings } from "@/types/payroll.types"

import { zodResolver } from "@hookform/resolvers/zod"
import { CalendarClock, Loader2, Settings2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

const settingsSchema = z.object({
  triggerDay: z.number().min(1).max(31, "Ngày chạy phải từ 1 đến 31"),
  triggerHour: z.number().min(0).max(23),
  triggerMinute: z.number().min(0).max(59),
})

type SettingsFormValues = z.infer<typeof settingsSchema>

function PayrollCycleForm({ settings }: { settings: IPayrollSettings }) {
  const { mutateAsync: updateSettings, isPending: isUpdatingSettings } = useUpdatePayrollSettings()

  const settingsForm = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      triggerDay: settings.triggerDay || 5,
      triggerHour: settings.triggerHour || 0,
      triggerMinute: settings.triggerMinute || 0,
    },
  })

  const onSettingsSubmit = async (values: SettingsFormValues) => {
    try {
      await updateSettings(values)
      toast.success("Cập nhật cấu hình thành công")
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } }
      toast.error(error.response?.data?.message || "Có lỗi xảy ra khi cập nhật")
    }
  }

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm text-foreground overflow-hidden">
      <div className="flex flex-col md:flex-row">
        {/* Left Side: Context & Info */}
        <div className="p-8 md:p-10 border-b md:border-b-0 md:border-r border-border bg-muted/20 md:w-1/3 flex flex-col gap-6">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Settings2 className="h-4 w-4 text-primary" strokeWidth={2} />
              </div>
              <h3 className="text-lg font-medium tracking-tight">Cấu hình hệ thống</h3>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Thiết lập thời điểm chính xác để hệ thống tự động khóa bảng công và khởi tạo bảng
              lương nháp hằng tháng.
            </p>
          </div>

          <div className="pt-6 border-t border-border/50">
            <div className="flex items-start gap-3">
              <CalendarClock className="h-4 w-4 text-muted-foreground mt-0.5" strokeWidth={2} />
              <div>
                <h4 className="text-sm font-medium text-foreground mb-1">Tự động hóa</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Đảm bảo quy trình vận hành nhất quán, loại bỏ rủi ro sai lệch thời gian do thao
                  tác thủ công.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Configuration Form */}
        <div className="p-8 md:p-10 md:w-2/3 bg-background">
          <Form {...settingsForm}>
            <form
              onSubmit={settingsForm.handleSubmit(onSettingsSubmit)}
              className="flex flex-col h-full justify-between"
            >
              <div className="max-w-2xl space-y-8">
                {/* Ngày chạy */}
                <FormField
                  control={settingsForm.control}
                  name="triggerDay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-foreground">
                        Ngày kích hoạt hằng tháng
                      </FormLabel>
                      <Select
                        onValueChange={(val) => field.onChange(Number(val))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full md:w-72 border-border h-10 shadow-sm">
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
                      <FormDescription className="text-xs text-muted-foreground mt-2">
                        Ngày mà hệ thống sẽ chốt công của tháng liền trước.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Khung giờ chạy */}
                <div className="space-y-4">
                  <FormLabel className="text-sm font-medium text-foreground block">
                    Thời gian chính xác
                  </FormLabel>
                  <div className="flex flex-wrap items-center gap-4">
                    <FormField
                      control={settingsForm.control}
                      name="triggerHour"
                      render={({ field }) => (
                        <FormItem className="flex-1 min-w-30">
                          <Select
                            onValueChange={(val) => field.onChange(Number(val))}
                            value={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger className="border-border h-10 shadow-sm">
                                <SelectValue placeholder="Giờ" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="max-h-62.5">
                              {Array.from({ length: 24 }).map((_, i) => (
                                <SelectItem key={i} value={i.toString()}>
                                  {i.toString().padStart(2, "0")} Giờ
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <span className="text-muted-foreground font-medium">:</span>
                    <FormField
                      control={settingsForm.control}
                      name="triggerMinute"
                      render={({ field }) => (
                        <FormItem className="flex-1 min-w-30">
                          <Select
                            onValueChange={(val) => field.onChange(Number(val))}
                            value={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger className="border-border h-10 shadow-sm">
                                <SelectValue placeholder="Phút" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="max-h-62.5">
                              {Array.from({ length: 60 }).map((_, i) => (
                                <SelectItem key={i} value={i.toString()}>
                                  {i.toString().padStart(2, "0")} Phút
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
              </div>

              {/* Action Area */}
              <div className="pt-8 mt-8 border-t border-border flex items-center justify-start">
                <Button
                  type="submit"
                  disabled={isUpdatingSettings}
                  className="h-10 px-6 text-sm font-medium shadow-sm"
                >
                  {isUpdatingSettings && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Lưu thay đổi
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  )
}

export default function PayrollCycle() {
  const { data: settings, isLoading: isSettingsLoading } = usePayrollSettings()

  return (
    <div className="container px-6 py-6 max-w-5xl">
      <PageHeader
        title="Chu kỳ lương"
        description="Quản lý lịch trình tổng hợp và xử lý lương của doanh nghiệp."
      />

      <div className="mt-6">
        {isSettingsLoading || !settings ? (
          <PageCard className="p-12 flex flex-col items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </PageCard>
        ) : (
          <PayrollCycleForm settings={settings} />
        )}
      </div>
    </div>
  )
}

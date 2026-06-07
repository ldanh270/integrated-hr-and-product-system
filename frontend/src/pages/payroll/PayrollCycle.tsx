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
import { Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import type { IPayrollSettings } from "@/types/payroll.types"

const settingsSchema = z.object({
  triggerDay: z.number().min(1).max(31, "Ngày chạy phải từ 1 đến 31"),
})

type SettingsFormValues = z.infer<typeof settingsSchema>

function PayrollCycleForm({ settings }: { settings: IPayrollSettings }) {
  const { mutateAsync: updateSettings, isPending: isUpdatingSettings } = useUpdatePayrollSettings()

  const settingsForm = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      triggerDay: settings.triggerDay || 5,
    },
  })

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
    <div className="bg-card border border-border rounded-2xl shadow-sm text-foreground overflow-hidden">
      <div className="flex flex-col md:flex-row">
        {/* Left Side: Info */}
        <div className="p-8 md:p-10 border-b md:border-b-0 md:border-r border-border bg-muted/30 md:w-2/5 flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-medium tracking-tight mb-3">Thiết lập tự động</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Thiết lập ngày cụ thể trong tháng để hệ thống tự động khóa bảng công và tạo bảng lương nháp.
              Đảm bảo quy trình vận hành nhất quán và đúng hạn.
            </p>
          </div>
          
          <div className="mt-8 pt-6 border-t border-border">
            <div className="flex items-center gap-2 mb-2">
               <div className="h-2 w-2 rounded-full bg-primary"></div>
               <span className="text-xs font-semibold tracking-wider uppercase text-primary">
                 Tự động hóa
               </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
               Dữ liệu sẽ tự động nội suy từ bảng chấm công, cách ly khỏi các lỗi do thao tác thủ công.
            </p>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="p-8 md:p-10 md:w-3/5 bg-background">
          <Form {...settingsForm}>
            <form
              onSubmit={settingsForm.handleSubmit(onSettingsSubmit)}
              className="h-full flex flex-col justify-between"
            >
              <div className="space-y-6">
                <FormField
                  control={settingsForm.control}
                  name="triggerDay"
                  render={({ field }) => (
                    <FormItem className="max-w-sm">
                      <FormLabel className="text-sm font-medium text-foreground">
                        Ngày chạy hệ thống
                      </FormLabel>
                      <Select
                        onValueChange={(val) => field.onChange(Number(val))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger className="rounded-full border-border h-11 bg-card shadow-none focus:ring-1 focus:ring-primary">
                            <SelectValue placeholder="Chọn ngày" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="border-border rounded-md shadow-sm">
                          {Array.from({ length: 31 }).map((_, i) => (
                            <SelectItem key={i + 1} value={(i + 1).toString()} className="rounded-sm cursor-pointer focus:bg-muted">
                              Ngày {i + 1}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-xs text-muted-foreground mt-3 leading-relaxed">
                        Ví dụ: Chọn ngày 5, hệ thống sẽ tự động tổng hợp công từ ngày 1 đến ngày cuối của tháng trước đó, và tạo bản nháp vào ngày 5 tháng này.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="pt-8 mt-8 border-t border-border">
                <Button
                  type="submit"
                  disabled={isUpdatingSettings}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full h-10 px-6 text-sm font-medium shadow-none transition-transform hover:scale-[0.99] active:scale-[0.98]"
                >
                  {isUpdatingSettings ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
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
    <div className="min-h-full bg-muted/20 flex flex-col font-sans">
      <div className="px-8 md:px-16 py-12 md:py-20 border-b border-border bg-background">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-medium text-foreground tracking-tight mb-4">
            Chu kỳ lương
          </h1>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl">
            Quản lý nhịp độ xử lý lương của tổ chức. Xây dựng một lịch trình tài chính dễ dự đoán và chính xác.
          </p>
        </div>
      </div>

      <div className="flex-1 p-8 md:p-16">
        <div className="max-w-5xl mx-auto">
          {isSettingsLoading || !settings ? (
            <div className="border border-border rounded-2xl bg-card p-12 flex flex-col items-center justify-center shadow-sm">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <PayrollCycleForm settings={settings} />
          )}
        </div>
      </div>
    </div>
  )
}

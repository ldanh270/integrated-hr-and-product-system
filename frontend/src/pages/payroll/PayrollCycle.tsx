import { PageHeader } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
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
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { usePayrollSettings, useUpdatePayrollSettings } from "@/hooks/payroll/use-payroll-settings"
import type { IPayrollSettings } from "@/types/payroll.types"

import { zodResolver } from "@hookform/resolvers/zod"
import { CalendarClock, Info, Loader2, Settings2 } from "lucide-react"
import { useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

const settingsSchema = z.object({
  triggerDay: z.number().min(1).max(31, "Ngày chạy phải từ 1 đến 31"),
  triggerHour: z.number().min(0).max(23),
  triggerMinute: z.number().min(0).max(59),
})

type SettingsFormValues = z.infer<typeof settingsSchema>

// --- Sub-components (SOLID Principles) ---

function CycleContextPanel() {
  return (
    <div className="p-8 md:p-10 border-b md:border-b-0 md:border-r border-border bg-muted/20 md:w-1/3 flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Settings2 className="h-4 w-4 text-primary" strokeWidth={2} />
          </div>
          <h3 className="text-lg font-medium tracking-tight">Cấu hình hệ thống</h3>
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Thiết lập thời điểm chính xác để hệ thống tự động khóa bảng công và khởi tạo bảng lương
          nháp hằng tháng.
        </p>
      </div>

      <Separator className="bg-border/50" />

      <div className="flex items-start gap-3">
        <CalendarClock className="h-4 w-4 text-muted-foreground mt-0.5" strokeWidth={2} />
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <h4 className="text-sm font-medium text-foreground">Tự động hóa</h4>
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-62.5 text-xs">
                  Quy trình này sẽ chạy background job để chốt dữ liệu, bạn không cần thao tác tay.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Đảm bảo quy trình vận hành nhất quán, loại bỏ rủi ro sai lệch thời gian do thao tác thủ
            công.
          </p>
        </div>
      </div>
    </div>
  )
}

function SchedulePreviewBadge({ control }: { control: any }) {
  const triggerDay = useWatch({
    control,
    name: "triggerDay",
  })
  const triggerHour = useWatch({ control, name: "triggerHour" })
  const triggerMinute = useWatch({ control, name: "triggerMinute" })

  return (
    <Badge
      variant="secondary"
      className="font-normal text-xs px-3 py-1 bg-primary/5 text-primary border-primary/10"
    >
      Kích hoạt ngày {triggerDay || "..."} hàng tháng lúc{" "}
      {triggerHour?.toString().padStart(2, "0") || "00"}:
      {triggerMinute?.toString().padStart(2, "0") || "00"}
    </Badge>
  )
}

function TriggerTimeField({ control }: { control: any }) {
  return (
    <div className="space-y-4">
      <FormLabel className="text-sm font-medium text-foreground block">
        Thời gian chính xác
      </FormLabel>
      <div className="flex items-center gap-3">
        <FormField
          control={control}
          name="triggerHour"
          render={({ field }) => (
            <FormItem>
              <Select
                onValueChange={(val) => field.onChange(Number(val))}
                value={field.value?.toString()}
              >
                <FormControl>
                  <SelectTrigger className="w-28 border-border h-10 shadow-sm transition-shadow hover:shadow-md focus:shadow-md">
                    <SelectValue placeholder="Giờ" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent position="popper" className="max-h-64!">
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
        <span className="text-muted-foreground font-medium pb-2">:</span>
        <FormField
          control={control}
          name="triggerMinute"
          render={({ field }) => (
            <FormItem>
              <Select
                onValueChange={(val) => field.onChange(Number(val))}
                value={field.value?.toString()}
              >
                <FormControl>
                  <SelectTrigger className="w-28 border-border h-10 shadow-sm transition-shadow hover:shadow-md focus:shadow-md">
                    <SelectValue placeholder="Phút" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent position="popper" className="max-h-64!">
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
  )
}

function TriggerDayField({ control }: { control: any }) {
  return (
    <FormField
      control={control}
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
              <SelectTrigger className="w-full sm:w-48 border-border h-10 shadow-sm transition-shadow hover:shadow-md focus:shadow-md">
                <SelectValue placeholder="Chọn ngày" />
              </SelectTrigger>
            </FormControl>
            <SelectContent position="popper" className="max-h-64!">
              {Array.from({ length: 31 }).map((_, i) => (
                <SelectItem key={i + 1} value={(i + 1).toString()}>
                  Ngày {i + 1}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormDescription className="text-xs text-muted-foreground mt-2">
            Hệ thống sẽ chốt công của tháng liền trước vào ngày này.
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

function PayrollCycleSkeleton() {
  return (
    <Card className="rounded-xl shadow-sm border-border overflow-hidden p-0">
      <div className="flex flex-col md:flex-row">
        <div className="p-8 md:p-10 border-b md:border-b-0 md:border-r border-border bg-muted/20 md:w-1/3 flex flex-col gap-6">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-20 w-full" />
          <Separator className="bg-border/50" />
          <Skeleton className="h-16 w-full" />
        </div>
        <div className="p-8 md:p-10 md:w-2/3 bg-background flex flex-col justify-between min-h-100">
          <div className="space-y-8">
            <div className="space-y-3">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-10 w-72" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-5 w-1/4" />
              <Skeleton className="h-10 w-40" />
            </div>
          </div>
          <div className="pt-8 mt-8">
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </div>
    </Card>
  )
}

// --- Main Components ---

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
    <Card className="rounded-xl shadow-sm border-border overflow-hidden p-0">
      <div className="flex flex-col md:flex-row">
        <CycleContextPanel />

        <div className="p-8 md:p-10 md:w-2/3 bg-background">
          <Form {...settingsForm}>
            <form
              onSubmit={settingsForm.handleSubmit(onSettingsSubmit)}
              className="flex flex-col h-full justify-between"
            >
              <div className="space-y-8">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <h3 className="text-lg font-medium tracking-tight">Thiết lập chu kỳ</h3>
                  <SchedulePreviewBadge control={settingsForm.control} />
                </div>

                <Separator className="bg-border/50" />

                <div className="max-w-2xl space-y-8">
                  <TriggerDayField control={settingsForm.control} />
                  <TriggerTimeField control={settingsForm.control} />
                </div>
              </div>

              <div className="pt-8 mt-8 border-t border-border flex items-center justify-start">
                <Button
                  type="submit"
                  disabled={isUpdatingSettings}
                  className="h-10 px-6 text-sm font-medium shadow-sm transition-all hover:-translate-y-px active:translate-y-0"
                >
                  {isUpdatingSettings && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Lưu thay đổi
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </Card>
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
          <PayrollCycleSkeleton />
        ) : (
          <PayrollCycleForm settings={settings} />
        )}
      </div>
    </div>
  )
}

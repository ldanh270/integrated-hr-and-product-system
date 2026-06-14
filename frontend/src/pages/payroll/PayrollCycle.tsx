import { EntityFormPage, PageHeader } from "@/components/common"
import { Badge } from "@/components/ui/badge"
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
import {
  type SettingsFormValues,
  usePayrollCycleForm,
} from "@/hooks/payroll/use-payroll-cycle-form"
import { usePayrollSettings } from "@/hooks/payroll/use-payroll-settings"
import type { IPayrollSettings } from "@/types/payroll.types"

import { CalendarClock, Info, Settings2 } from "lucide-react"
import { type Control, useWatch } from "react-hook-form"
import { useNavigate } from "react-router-dom"

// --- Sub-components ---

function CycleContextPanel() {
  return (
    <div className="p-8 md:p-10 border-b md:border-b-0 md:border-r border-border bg-muted/20 md:w-1/3 flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
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

function SchedulePreviewBadge({ control }: { control: Control<SettingsFormValues> }) {
  const triggerDay = useWatch({ control, name: "triggerDay" })
  const triggerHour = useWatch({ control, name: "triggerHour" })
  const triggerMinute = useWatch({ control, name: "triggerMinute" })

  return (
    <Badge
      variant="secondary"
      className="font-normal text-xs px-3 py-1 bg-primary/5 text-primary border-primary/10 rounded-full"
    >
      Kích hoạt ngày {triggerDay || "..."} hàng tháng lúc{" "}
      {triggerHour?.toString().padStart(2, "0") || "00"}:
      {triggerMinute?.toString().padStart(2, "0") || "00"}
    </Badge>
  )
}

function TriggerTimeField({ control }: { control: Control<SettingsFormValues> }) {
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
                  <SelectTrigger className="w-24 sm:w-28 rounded-full border-border h-10 shadow-sm transition-shadow hover:shadow-md focus:shadow-md">
                    <SelectValue placeholder="Giờ" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent position="popper" className="max-h-64 rounded-xl">
                  {Array.from({ length: 24 }).map((_, i) => (
                    <SelectItem key={i} value={i.toString()} className="rounded-lg">
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
                  <SelectTrigger className="w-24 sm:w-28 rounded-full border-border h-10 shadow-sm transition-shadow hover:shadow-md focus:shadow-md">
                    <SelectValue placeholder="Phút" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent position="popper" className="max-h-64 rounded-xl">
                  {Array.from({ length: 60 }).map((_, i) => (
                    <SelectItem key={i} value={i.toString()} className="rounded-lg">
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
      <FormDescription className="text-xs max-w-sm mt-1.5 leading-relaxed">
        Nên chọn thời điểm ngoài giờ hành chính (ví dụ 00:00 hoặc 02:00 sáng) để không làm gián đoạn
        trải nghiệm của nhân sự.
      </FormDescription>
    </div>
  )
}

function TriggerDayField({ control }: { control: Control<SettingsFormValues> }) {
  return (
    <FormField
      control={control}
      name="triggerDay"
      render={({ field }) => (
        <FormItem className="space-y-4">
          <div className="space-y-1">
            <FormLabel className="text-sm font-medium text-foreground">Ngày kích hoạt</FormLabel>
            <FormDescription className="text-xs leading-relaxed max-w-md">
              Ngày trong tháng mà hệ thống sẽ chốt công và tạo bảng lương. Thường là ngày 1 hoặc 5
              hằng tháng.
            </FormDescription>
          </div>
          <Select
            onValueChange={(val) => field.onChange(Number(val))}
            value={field.value?.toString()}
          >
            <FormControl>
              <SelectTrigger className="w-full max-w-xs rounded-full border-border h-10 shadow-sm transition-shadow hover:shadow-md focus:shadow-md">
                <SelectValue placeholder="Chọn ngày chạy (1-28)" />
              </SelectTrigger>
            </FormControl>
            <SelectContent position="popper" className="max-h-64 rounded-xl">
              {Array.from({ length: 28 }).map((_, i) => (
                <SelectItem key={i + 1} value={(i + 1).toString()} className="rounded-lg">
                  Ngày {i + 1} hàng tháng
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

function PayrollCycleSkeleton() {
  return (
    <div className="container px-3 sm:px-6 py-4 sm:py-6 max-w-5xl">
      <PageHeader
        title="Chu kỳ lương"
        description="Quản lý lịch trình tổng hợp và xử lý lương của doanh nghiệp."
      />
      <Card className="rounded-xl border-border overflow-hidden p-0 mt-6">
        <div className="flex flex-col md:flex-row">
          <div className="p-8 md:w-1/3 border-b md:border-b-0 md:border-r border-border">
            <Skeleton className="h-6 w-3/4 mb-4 rounded-lg" />
            <Skeleton className="h-4 w-full mb-2 rounded-lg" />
            <Skeleton className="h-4 w-5/6 rounded-lg" />
          </div>
          <div className="p-8 md:w-2/3">
            <Skeleton className="h-8 w-1/3 mb-8 rounded-lg" />
            <Skeleton className="h-10 w-full max-w-xs mb-8 rounded-full" />
            <Skeleton className="h-10 w-full max-w-sm rounded-full" />
          </div>
        </div>
      </Card>
    </div>
  )
}

// --- Main Components ---

function PayrollCycleForm({ settings }: { settings: IPayrollSettings }) {
  const navigate = useNavigate()
  const { form, isPending, onSubmit } = usePayrollCycleForm({
    initialData: settings,
  })

  return (
    <EntityFormPage
      title="Thiết lập Chu kỳ lương"
      formId="payroll-cycle-form"
      isReadOnly={false}
      onBack={() => navigate(-1)}
      isPending={isPending}
      isDirty={form.formState.isDirty}
      submitLabel="Lưu thay đổi"
    >
      <Form {...form}>
        <form id="payroll-cycle-form" onSubmit={onSubmit} className="h-full">
          <Card className="rounded-xl shadow-sm border-border overflow-hidden p-0">
            <div className="flex flex-col md:flex-row">
              <CycleContextPanel />

              <div className="p-8 md:p-10 md:w-2/3 bg-background">
                <div className="space-y-8">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <h3 className="text-lg font-medium tracking-tight">Chi tiết lịch trình</h3>
                    <SchedulePreviewBadge control={form.control} />
                  </div>

                  <Separator className="bg-border/50" />

                  <div className="max-w-2xl space-y-8">
                    <TriggerDayField control={form.control} />
                    <TriggerTimeField control={form.control} />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </form>
      </Form>
    </EntityFormPage>
  )
}

export default function PayrollCycle() {
  const { data: settings, isLoading: isSettingsLoading } = usePayrollSettings()

  if (isSettingsLoading || !settings) {
    return <PayrollCycleSkeleton />
  }

  return <PayrollCycleForm settings={settings} />
}

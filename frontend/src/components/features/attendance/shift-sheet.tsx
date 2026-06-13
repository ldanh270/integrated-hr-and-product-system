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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form-ui"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { useCreateShift, useUpdateShift } from "@/hooks/attendance/use-shifts"
import { minutesToTime, timeToMinutes } from "@/lib/utils"
import type { IWorkingShift } from "@/types/attendance.types"

import { useEffect } from "react"

import { zodResolver } from "@hookform/resolvers/zod"
import { Clock, Info, Loader2, MapPin } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"

const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/

const formSchema = z.object({
  name: z.string().min(2, "Tên ca phải từ 2 ký tự"),
  startTime: z.string().regex(timeRegex, "Định dạng HH:MM"),
  endTime: z.string().regex(timeRegex, "Định dạng HH:MM"),
  gracePeriodMinutes: z.string(),
  gpsLat: z.number({ message: "Vĩ độ phải là số" }).optional(),
  gpsLng: z.number({ message: "Kinh độ phải là số" }).optional(),
  gpsRadiusMeters: z
    .number({ message: "Bán kính phải là số" })
    .min(1, "Bán kính tối thiểu 1m")
    .optional(),
  isActive: z.boolean(),
})

type FormValues = z.infer<typeof formSchema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: IWorkingShift | null
}

export default function ShiftSheet({ open, onOpenChange, initialData }: Props) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      startTime: "08:00",
      endTime: "17:00",
      gracePeriodMinutes: "15",
      gpsLat: undefined,
      gpsLng: undefined,
      gpsRadiusMeters: undefined,
      isActive: true,
    },
  })

  const createMutation = useCreateShift()
  const updateMutation = useUpdateShift()
  const isPending = createMutation.isPending || updateMutation.isPending

  useEffect(() => {
    if (!open) return
    if (initialData) {
      form.reset({
        name: initialData.name,
        startTime: minutesToTime(initialData.startTime),
        endTime: minutesToTime(initialData.endTime),
        gracePeriodMinutes: String(initialData.gracePeriodMinutes),
        gpsLat: initialData.gpsLat ?? undefined,
        gpsLng: initialData.gpsLng ?? undefined,
        gpsRadiusMeters: initialData.gpsRadiusMeters ?? undefined,
        isActive: initialData.isActive,
      })
    } else {
      form.reset({
        name: "",
        startTime: "08:00",
        endTime: "17:00",
        gracePeriodMinutes: "15",
        gpsLat: undefined,
        gpsLng: undefined,
        gpsRadiusMeters: undefined,
        isActive: true,
      })
    }
  }, [open, initialData, form])

  const onSubmit = (values: FormValues) => {
    if (
      values.startTime &&
      values.endTime &&
      timeToMinutes(values.endTime) <= timeToMinutes(values.startTime)
    ) {
      form.setError("endTime", { message: "Giờ kết thúc phải sau giờ bắt đầu" })
      return
    }

    const gps =
      values.gpsLat != null && values.gpsLng != null && values.gpsRadiusMeters != null
        ? {
            lat: values.gpsLat,
            lng: values.gpsLng,
            radiusMeters: values.gpsRadiusMeters,
          }
        : undefined

    const payload = {
      name: values.name,
      startTime: values.startTime,
      endTime: values.endTime,
      gracePeriodMinutes: parseInt(values.gracePeriodMinutes, 10) || 0,
      isActive: values.isActive,
      gps,
    }

    if (initialData) {
      updateMutation.mutate(
        { id: initialData.id, ...payload },
        { onSuccess: () => onOpenChange(false) },
      )
    } else {
      createMutation.mutate(payload, { onSuccess: () => onOpenChange(false) })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-popover rounded-4xl">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {initialData ? "Cập nhật ca làm việc" : "Tạo ca làm việc mới"}
          </DialogTitle>
          <DialogDescription>
            {initialData
              ? "Chỉnh sửa thông tin ca và áp dụng thay đổi hệ thống."
              : "Định nghĩa ca làm việc mới với quy định giờ giấc và vị trí GPS."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-2">
            {/* Basic Info Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary font-semibold text-sm uppercase tracking-wider">
                <Info size={16} />
                <span>Thông tin cơ bản</span>
              </div>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tên ca làm việc <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="VD: Ca sáng, Ca hành chính..." className="h-11" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Clock size={14} className="text-muted-foreground" />
                        Giờ bắt đầu <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input type="time" className="h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Clock size={14} className="text-muted-foreground" />
                        Giờ kết thúc <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input type="time" className="h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                <FormField
                  control={form.control}
                  name="gracePeriodMinutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Thời gian ân hạn (phút)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} max={120} className="h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-3 bg-muted/30 p-3 rounded-2xl border border-border/50 h-11">
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel className="!mt-0 cursor-pointer">Kích hoạt ca</FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* GPS Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary font-semibold text-sm uppercase tracking-wider">
                <MapPin size={16} />
                <span>Cấu hình vị trí GPS (Tùy chọn)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="gpsLat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vĩ độ (Latitude)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="any"
                          placeholder="10.7769"
                          className="h-11"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(e.target.value === "" ? undefined : Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gpsLng"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kinh độ (Longitude)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="any"
                          placeholder="106.7009"
                          className="h-11"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(e.target.value === "" ? undefined : Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="gpsRadiusMeters"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bán kính chấm công cho phép (mét)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="VD: 100, 200..."
                        className="h-11"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(e.target.value === "" ? undefined : Number(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" className="rounded-full" onClick={() => onOpenChange(false)}>
                Hủy bỏ
              </Button>
              <Button type="submit" className="rounded-full px-8 bg-primary hover:bg-primary/90 shadow-md" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {initialData ? "Lưu thay đổi" : "Tạo ca làm việc"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

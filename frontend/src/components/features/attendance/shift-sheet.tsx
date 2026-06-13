import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form-ui"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { useCreateShift, useUpdateShift } from "@/hooks/attendance/use-shifts"
import { minutesToTime, timeToMinutes } from "@/lib/utils"
import type { IWorkingShift } from "@/types/attendance.types"

import { useEffect } from "react"

import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"

const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/

/**
 * formSchema — Zod validation schema for Creating/Updating Working Shifts.
 * Uses numeric types for GPS coordinates and radius.
 */
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

/**
 * ShiftSheet — Side sheet form for defining a Working Shift's basic info and GPS configuration.
 * Handles both Creation and Modification modes.
 */
export default function ShiftSheet({ open, onOpenChange, initialData }: Props) {
  /**
   * useForm — Initializes form management with Zod schema.
   */
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

  // useCreateShift, useUpdateShift: Mutation hooks for persistence
  const createMutation = useCreateShift()
  const updateMutation = useUpdateShift()
  const isPending = createMutation.isPending || updateMutation.isPending

  /**
   * useEffect — Syncs form state with initialData when the sheet opens.
   * Triggered by: [open, initialData, form]
   */
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

  /**
   * onSubmit — Handler for form submission.
   * 1. Performs manual validation for time range.
   * 2. Construct GPS object if all coordinates are provided.
   * 3. Calls either update or create mutation based on initialData existence.
   * @param {FormValues} values 
   */
  const onSubmit = (values: FormValues) => {
    // Validate endTime > startTime manually (avoids zod .refine TS issues)
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto flex flex-col h-full bg-background border-l">
        <SheetHeader className="mb-6">
          <SheetTitle>{initialData ? "Cập nhật ca làm việc" : "Tạo ca làm việc mới"}</SheetTitle>
          <SheetDescription>
            {initialData
              ? "Chỉnh sửa thông tin ca và áp dụng thay đổi."
              : "Định nghĩa ca mới với giờ vào/ra và cài đặt GPS."}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col space-y-6">
            <div className="flex-1 space-y-5">
              {/* Basic info section */}
              <div className="space-y-4">
                <p className="font-semibold text-sm text-primary uppercase tracking-wider">
                  Thông tin cơ bản
                </p>

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Tên ca <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="VD: Ca sáng" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Giờ bắt đầu <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
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
                        <FormLabel>
                          Giờ kết thúc <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="gracePeriodMinutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Thời gian ân hạn (phút)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} max={120} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-3">
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel className="!mt-0">Kích hoạt ca này</FormLabel>
                    </FormItem>
                  )}
                />
              </div>

              {/* GPS config section — used for location-based check-in validation */}
              <div className="space-y-4 pt-4 border-t">
                <p className="font-semibold text-sm text-primary uppercase tracking-wider">
                  Vị trí GPS (tuỳ chọn)
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="gpsLat"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vĩ độ</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="any"
                            placeholder="10.7769"
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
                        <FormLabel>Kinh độ</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="any"
                            placeholder="106.7009"
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
                      <FormLabel>Bán kính (m)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="100"
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
            </div>

            <SheetFooter className="pt-6 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {initialData ? "Cập nhật" : "Tạo mới"}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}

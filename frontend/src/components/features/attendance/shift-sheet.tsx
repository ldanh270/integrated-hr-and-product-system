import { FormActionFooter } from "@/components/common/form-action-footer"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form } from "@/components/ui/form-ui"
import { Separator } from "@/components/ui/separator"
import { useCreateShift, useUpdateShift } from "@/hooks/attendance/use-shifts"
import { minutesToTime, timeToMinutes } from "@/lib/utils"
import type { IWorkingShift } from "@/types/attendance.types"

import { useCallback, useEffect } from "react"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"

import { ShiftBasicInfoFields } from "./shifts/shift-basic-info-fields"
import { DEFAULT_SHIFT_FORM_VALUES, shiftFormSchema, type ShiftFormValues } from "./shifts/shift-form-schema"
import { ShiftGpsFields } from "./shifts/shift-gps-fields"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: IWorkingShift | null
}

export function ShiftDialog({ open, onOpenChange, initialData }: Props) {
  const form = useForm<ShiftFormValues>({
    resolver: zodResolver(shiftFormSchema),
    defaultValues: DEFAULT_SHIFT_FORM_VALUES,
  })

  const createMutation = useCreateShift()
  const updateMutation = useUpdateShift()
  const isPending = createMutation.isPending || updateMutation.isPending
  const gpsLat = useWatch({ control: form.control, name: "gpsLat" })
  const gpsLng = useWatch({ control: form.control, name: "gpsLng" })
  const gpsRadiusMeters = useWatch({ control: form.control, name: "gpsRadiusMeters" })

  const handleMapLocationChange = useCallback(
    (location: { lat: number; lng: number }) => {
      form.setValue("gpsLat", location.lat, { shouldDirty: true, shouldValidate: true })
      form.setValue("gpsLng", location.lng, { shouldDirty: true, shouldValidate: true })
    },
    [form],
  )

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
      return
    }

    form.reset(DEFAULT_SHIFT_FORM_VALUES)
  }, [open, initialData, form])

  const onSubmit = (values: ShiftFormValues) => {
    if (
      values.startTime &&
      values.endTime &&
      timeToMinutes(values.endTime) <= timeToMinutes(values.startTime)
    ) {
      form.setError("endTime", { message: "End time must be after start time" })
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
        {
          onSuccess: () => {
            onOpenChange(false)
          },
        },
      )
      return
    }

    createMutation.mutate(payload, {
      onSuccess: () => {
        onOpenChange(false)
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] max-w-2xl overflow-y-auto bg-popover rounded-4xl">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {initialData ? "Update Working Shift" : "Create New Shift"}
          </DialogTitle>
          <DialogDescription>
            {initialData
              ? "Edit shift details and apply system changes."
              : "Define a new working shift with timing and GPS rules."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-2">
            <ShiftBasicInfoFields control={form.control} />

            <Separator />

            <ShiftGpsFields
              control={form.control}
              gpsLat={gpsLat}
              gpsLng={gpsLng}
              gpsRadiusMeters={gpsRadiusMeters}
              onMapLocationChange={handleMapLocationChange}
            />

            <FormActionFooter
              onCancel={() => {
                onOpenChange(false)
              }}
              submitLabel={initialData ? "Save Changes" : "Create Shift"}
              isPending={isPending}
            />
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default ShiftDialog

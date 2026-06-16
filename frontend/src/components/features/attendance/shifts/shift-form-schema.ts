import { z } from "zod"

const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/

export const shiftFormSchema = z.object({
  name: z.string().min(2, "Shift name must be at least 2 characters"),
  startTime: z.string().regex(timeRegex, "Format HH:MM"),
  endTime: z.string().regex(timeRegex, "Format HH:MM"),
  gracePeriodMinutes: z.string(),
  gpsLat: z.number({ message: "Latitude must be a number" }).optional(),
  gpsLng: z.number({ message: "Longitude must be a number" }).optional(),
  gpsRadiusMeters: z
    .number({ message: "Radius must be a number" })
    .min(1, "Minimum radius is 1m")
    .optional(),
  isActive: z.boolean(),
})

export type ShiftFormValues = z.infer<typeof shiftFormSchema>

export const DEFAULT_SHIFT_FORM_VALUES: ShiftFormValues = {
  name: "",
  startTime: "08:00",
  endTime: "17:00",
  gracePeriodMinutes: "15",
  gpsLat: undefined,
  gpsLng: undefined,
  gpsRadiusMeters: undefined,
  isActive: true,
}

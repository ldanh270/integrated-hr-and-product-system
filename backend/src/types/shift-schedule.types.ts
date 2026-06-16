import type { Prisma } from "@prisma/client"

export const shiftScheduleWithDaysInclude = {
  days: {
    include: { shift: true },
  },
} as const satisfies Prisma.ShiftScheduleInclude

export const shiftScheduleWithTemplateInclude = {
  days: {
    include: { shift: true },
  },
  template: true,
} as const satisfies Prisma.ShiftScheduleInclude

export type IShiftScheduleWithDays = Prisma.ShiftScheduleGetPayload<{
  include: typeof shiftScheduleWithDaysInclude
}>

export type IShiftScheduleWithTemplate = Prisma.ShiftScheduleGetPayload<{
  include: typeof shiftScheduleWithTemplateInclude
}>

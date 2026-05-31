import { HOLIDAY_TYPES } from "@/configs/constants/entities.config.ts"

import mongoose, { Document, InferSchemaType, Model } from "mongoose"

/**
 * HolidayCalendar Entity
 * 
 * Manages holidays globally across the system. 
 * Holidays can be "national" (applies to everyone) or "company" (custom company days off).
 * 
 * - During auto-generation of EmployeeShift records, national holidays will be skipped entirely.
 * - Company holidays will generate an EmployeeShift with "holiday_pending" status, requiring HR review.
 * - Also used by Payroll to calculate holiday pay.
 */
const holidayCalendarSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
      unique: true,
      set: (value: Date) => {
        const date = new Date(value)
        date.setHours(0, 0, 0, 0)
        return date
      },
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: HOLIDAY_TYPES,
      required: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
  },
  { timestamps: true },
)

holidayCalendarSchema.index({ type: 1, date: 1 })

const HolidayCalendar = mongoose.model("HolidayCalendar", holidayCalendarSchema)

export default HolidayCalendar
export type HolidayCalendarType = InferSchemaType<typeof holidayCalendarSchema>
export type HolidayCalendarDocument = Document & HolidayCalendarType
export type HolidayCalendarModel = Model<HolidayCalendarDocument>

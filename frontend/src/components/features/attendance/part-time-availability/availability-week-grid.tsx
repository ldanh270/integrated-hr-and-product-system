import {

  DAY_OF_WEEK_FULL_LABELS,

  WORK_WEEK_DISPLAY_DAY_ORDER,

} from "@/config/entities/attendance.config"

import { cn } from "@/lib/utils"

import type { IPartTimeAvailabilityDayForm } from "@/types/part-time-availability.types"

import { formatDateParam } from "@/utils/attendance/format-date-param"

import { getWeekDates } from "@/utils/attendance/get-week-dates"

import type { WeekDay } from "@/utils/attendance/get-week-dates"



import { AvailabilityDayColumn } from "./availability-day-column"



interface AvailabilityWeekGridProps {

  weekStart: Date

  days: IPartTimeAvailabilityDayForm[]

  disabled?: boolean

  onDayChange: (dayOfWeek: number, day: IPartTimeAvailabilityDayForm) => void

}



interface AvailabilityWeekSegmentProps {

  segmentDays: WeekDay[]

  days: IPartTimeAvailabilityDayForm[]

  todayKey: string

  disabled?: boolean

  onDayChange: (dayOfWeek: number, day: IPartTimeAvailabilityDayForm) => void

}



function AvailabilityWeekSegment({

  segmentDays,

  days,

  todayKey,

  disabled,

  onDayChange,

}: AvailabilityWeekSegmentProps) {

  const columnCount = segmentDays.length



  return (

    <div className="overflow-hidden rounded-xl border border-border/70">

      <div className="overflow-x-auto">

        <div

          className="grid divide-x divide-border/60 border-b border-border/60 bg-secondary/40 text-center text-xs font-semibold text-muted-foreground"

          style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(140px, 1fr))` }}

        >

          {segmentDays.map((weekDay) => (

            <div

              key={weekDay.dayOfWeek}

              className={cn(

                "px-2 py-2.5",

                weekDay.dateKey === todayKey && "bg-primary/5 text-primary",

              )}

            >

              <div className="truncate uppercase tracking-wide opacity-80">{weekDay.label}</div>

              <div className="mt-0.5 text-[11px] font-medium text-foreground">{weekDay.shortDate}</div>

              {weekDay.dateKey === todayKey ? (

                <span className="mt-1 inline-block rounded-full bg-primary px-2 py-0.5 text-[9px] font-semibold text-primary-foreground">

                  Hôm nay

                </span>

              ) : null}

            </div>

          ))}

        </div>



        <div

          className="grid divide-x divide-border/60 bg-card"

          style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(140px, 1fr))` }}

        >

          {segmentDays.map((weekDay) => {

            const day = days.find((entry) => entry.dayOfWeek === weekDay.dayOfWeek)

            if (!day) return null



            return (

              <AvailabilityDayColumn

                key={weekDay.dayOfWeek}

                embedded

                day={day}

                disabled={disabled}

                onChange={(next) => onDayChange(weekDay.dayOfWeek, next)}

              />

            )

          })}

        </div>

      </div>

    </div>

  )

}



export function AvailabilityWeekGrid({

  weekStart,

  days,

  disabled,

  onDayChange,

}: AvailabilityWeekGridProps) {

  const weekDates = getWeekDates(weekStart, (dayOfWeek) => DAY_OF_WEEK_FULL_LABELS.get(dayOfWeek) ?? "")

  const todayKey = formatDateParam(new Date())

  // Mon–Sun display order (may differ from Date.getDay() indexing).
  const orderedWeekDays = WORK_WEEK_DISPLAY_DAY_ORDER.map((dayOfWeek) =>

    weekDates.find((entry) => entry.dayOfWeek === dayOfWeek),

  ).filter((entry): entry is WeekDay => Boolean(entry))



  const segmentProps = { days, todayKey, disabled, onDayChange }
  // Mobile: Mon–Thu and Fri–Sun rows; desktop shows full week in one grid.
  const compactSegments = [orderedWeekDays.slice(0, 4), orderedWeekDays.slice(4)]



  return (

    <div className="space-y-4">

      <div className="hidden xl:block">

        <AvailabilityWeekSegment segmentDays={orderedWeekDays} {...segmentProps} />

      </div>



      <div className="space-y-4 xl:hidden">

        {compactSegments.map((segmentDays, index) => (

          <AvailabilityWeekSegment

            key={index}

            segmentDays={segmentDays}

            {...segmentProps}

          />

        ))}

      </div>

    </div>

  )

}



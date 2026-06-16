import type { IHoliday } from "@/types/attendance.types"

interface HolidayBlockProps {
  holiday: IHoliday
}

export function HolidayBlock({ holiday }: HolidayBlockProps) {
  return (
    <div className="absolute inset-x-1 top-1 bottom-1 z-30 flex flex-col justify-center rounded-lg border-l-4 border-success bg-success/10 px-2.5 py-2 shadow-sm">
      <p className="text-xs font-bold leading-tight text-success">Nhân viên được nghỉ lễ</p>
      <p className="mt-1 text-xs font-semibold text-success/80">{holiday.name}</p>
    </div>
  )
}

import { PageCard, PageHeader, SectionHeader, StatusPill } from "@/components/common"
import { AvailabilityWeekGrid } from "@/components/features/attendance/part-time-availability/availability-week-grid"
import { WeekPickerActions } from "@/components/features/attendance/calendar/week-picker-actions"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import {
  PART_TIME_AVAILABILITY_ACTION_LABELS,
  PART_TIME_AVAILABILITY_STATUS,
  getPartTimeAvailabilityStatusLabel,
  getPartTimeAvailabilityStatusVariant,
} from "@/config/entities/part-time-availability.config"
import {
  useMyPartTimeAvailability,
  useUpsertMyPartTimeAvailability,
} from "@/hooks/attendance/use-part-time-availability"
import { cn } from "@/lib/utils"
import type {
  IPartTimeAvailabilityDayForm,
  IPartTimeWeeklyAvailability,
} from "@/types/part-time-availability.types"
import {
  clampToEarliestRequestableWeek,
  getEarliestRequestableWeekStart,
  mapAvailabilityToForm,
} from "@/utils/attendance/part-time-availability.util"
import { formatDateParam } from "@/utils/attendance/format-date-param"
import { getWeekDates } from "@/utils/attendance/get-week-dates"
import { getWeekRangeLabel } from "@/utils/attendance/get-week-range-label"
import { AlertCircle, ChevronLeft, ChevronRight, Info, Save, Send } from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"

interface EmployeePartTimeAvailabilityFormProps {
  availability: IPartTimeWeeklyAvailability | null | undefined
  weekStart: Date
  weekStartKey: string
  weekRangeLabel: string
  earliestWeekStart: Date
  earliestWeekStartKey: string
  canGoToPreviousWeek: boolean
  onWeekStartChange: (nextWeekStart: Date) => void
  onShiftWeek: (offset: number) => void
}

function EmployeePartTimeAvailabilityForm({
  availability,
  weekStart,
  weekStartKey,
  weekRangeLabel,
  earliestWeekStart,
  earliestWeekStartKey,
  canGoToPreviousWeek,
  onWeekStartChange,
  onShiftWeek,
}: EmployeePartTimeAvailabilityFormProps) {
  const upsertMutation = useUpsertMyPartTimeAvailability(weekStartKey)
  const [days, setDays] = useState<IPartTimeAvailabilityDayForm[]>(() =>
    mapAvailabilityToForm(availability),
  )
  const [note, setNote] = useState(() => availability?.note ?? "")

  const isUpdate = Boolean(availability)
  const submitLabel = isUpdate
    ? PART_TIME_AVAILABILITY_ACTION_LABELS.UPDATE
    : PART_TIME_AVAILABILITY_ACTION_LABELS.SUBMIT
  const SubmitIcon = isUpdate ? Save : Send

  const handleDayChange = (dayOfWeek: number, day: IPartTimeAvailabilityDayForm) => {
    setDays((current) => current.map((entry) => (entry.dayOfWeek === dayOfWeek ? day : entry)))
  }

  const handleSubmit = async () => {
    try {
      await upsertMutation.mutateAsync({
        weekStart: weekStartKey,
        note: note.trim() || null,
        status: PART_TIME_AVAILABILITY_STATUS.SUBMITTED,
        days,
      })
      toast.success(
        isUpdate
          ? PART_TIME_AVAILABILITY_ACTION_LABELS.UPDATE_SUCCESS
          : PART_TIME_AVAILABILITY_ACTION_LABELS.SUBMIT_SUCCESS,
      )
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể lưu lịch rảnh")
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lịch rảnh tuần"
        description="Khai báo khung giờ rảnh hoặc bận để quản lý xếp ca linh hoạt."
        actions={
          <Button
            type="button"
            size="lg"
            className="rounded-full px-6"
            disabled={upsertMutation.isPending}
            onClick={() => {
              void handleSubmit()
            }}
          >
            <SubmitIcon className="mr-2 h-4 w-4" />
            {submitLabel}
          </Button>
        }
      />

      {availability?.status === PART_TIME_AVAILABILITY_STATUS.SUBMITTED ? (
        <div className="flex items-start gap-3 rounded-xl border border-border/70 bg-muted/30 px-4 py-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-medium text-foreground">Lịch rảnh đã gửi</p>
            <p className="text-xs text-muted-foreground">
              Bạn có thể chỉnh sửa và cập nhật nhiều lần trước khi quản lý xếp ca.
            </p>
          </div>
        </div>
      ) : null}

      {availability?.rejectReason ? (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <div>
            <p className="text-sm font-medium text-destructive">Lịch rảnh bị từ chối</p>
            <p className="text-xs text-destructive/90">{availability.rejectReason}</p>
          </div>
        </div>
      ) : null}

      <PageCard padding="lg" className="space-y-5">
        <SectionHeader
          title="Thời khóa biểu tuần"
          action={
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full"
                disabled={!canGoToPreviousWeek}
                onClick={() => { onShiftWeek(-1); }}
                
                aria-label="Tuần trước"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <WeekPickerActions
                weekStartIso={weekStartKey}
                weekRangeLabel={weekRangeLabel}
                minWeekStartIso={earliestWeekStartKey}
                defaultWeekStart={earliestWeekStart}
                defaultWeekLabel="Tuần kế tiếp"
                onWeekStartChange={onWeekStartChange}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => { onShiftWeek(1); }}
                
                aria-label="Tuần sau"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          }
        />

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/30 px-4 py-2.5">
          <p className="text-xs text-muted-foreground">
            Chọn <span className="font-medium text-foreground">Rảnh</span> và khai báo khung giờ, hoặc
            chọn <span className="font-medium text-foreground">Bận</span> nếu không làm.
          </p>
          {availability ? (
            <StatusPill
              label={getPartTimeAvailabilityStatusLabel(availability.status)}
              variant={getPartTimeAvailabilityStatusVariant(availability.status)}
            />
          ) : (
            <span className="text-xs font-medium text-muted-foreground">Chưa gửi</span>
          )}
        </div>

        {/* Form stays editable after submit — admin assigns from submitted rows without approval gate. */}
        <AvailabilityWeekGrid
          weekStart={weekStart}
          days={days}
          onDayChange={handleDayChange}
        />
      </PageCard>

      <PageCard padding="lg" className="space-y-3">
        <SectionHeader title="Ghi chú cho quản lý" />
        <Textarea
          id="availability-note"
          value={note}
          placeholder="Ví dụ: Thứ 5 chỉ rảnh buổi chiều nếu ca ngắn."
          className={cn(
            "min-h-24 rounded-xl border-border/70 bg-secondary/20 px-4 py-3 text-sm",
            "focus-visible:ring-primary",
          )}
          onChange={(event) => {
            setNote(event.target.value)
          }}
        />
      </PageCard>
    </div>
  )
}

export function EmployeePartTimeAvailabilityView() {
  const earliestWeekStart = useMemo(() => getEarliestRequestableWeekStart(), [])
  const earliestWeekStartKey = formatDateParam(earliestWeekStart)

  const [weekStart, setWeekStart] = useState(() => getEarliestRequestableWeekStart())
  const weekStartKey = formatDateParam(weekStart)
  const weekDays = useMemo(() => getWeekDates(weekStart), [weekStart])
  const weekRangeLabel = useMemo(() => getWeekRangeLabel(weekDays), [weekDays])

  const { data: availability, isLoading } = useMyPartTimeAvailability(weekStartKey)

  const canGoToPreviousWeek = weekStart.getTime() > earliestWeekStart.getTime()

  const handleWeekStartChange = (nextWeekStart: Date) => {
    setWeekStart(clampToEarliestRequestableWeek(nextWeekStart))
  }

  const shiftWeek = (offset: number) => {
    const next = new Date(weekStart)
    next.setDate(next.getDate() + offset * 7)
    handleWeekStartChange(next)
  }

  if (isLoading) {
    return <Skeleton className="h-40 w-full rounded-xl" />
  }

  return (
    <EmployeePartTimeAvailabilityForm
      // Remount local form state when week or saved record changes — avoids stale days/note.
      key={`${weekStartKey}-${availability?.id ?? "new"}`}
      availability={availability}
      weekStart={weekStart}
      weekStartKey={weekStartKey}
      weekRangeLabel={weekRangeLabel}
      earliestWeekStart={earliestWeekStart}
      earliestWeekStartKey={earliestWeekStartKey}
      canGoToPreviousWeek={canGoToPreviousWeek}
      onWeekStartChange={handleWeekStartChange}
      onShiftWeek={shiftWeek}
    />
  )
}

import { PageCard } from "@/components/common"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  SCHEDULE_INSIGHTS_UI,
  WORK_WEEK_DISPLAY_DAY_ORDER,
} from "@/config/entities/attendance.config"
import {
  useScheduleInsights,
  useSimulateWeeklyTemplate,
  useSuggestWeeklyTemplates,
} from "@/hooks/attendance/use-schedule-insights"
import { useCreateWeeklyScheduleTemplate } from "@/hooks/attendance/use-weekly-schedule-templates"
import type {
  IScheduleInsightDayBucket,
  ISuggestedWeeklyTemplateCandidate,
} from "@/types/attendance.types"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import {
  AlertTriangle,
  FlaskConical,
  Loader2,
  Sparkles,
  Users,
} from "lucide-react"

function DayRateBar({ day }: { day: IScheduleInsightDayBucket }) {
  const latePct = Math.round(day.lateRate * 100)
  const absentPct = Math.round(day.absentRate * 100)

  return (
    <div className="rounded-xl border border-border/60 bg-card/80 p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">{day.label}</p>
        <p className="text-[10px] text-muted-foreground">{day.total} bản ghi</p>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>Muộn</span>
          <span>{latePct}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-warning transition-[width]"
            style={{ width: `${Math.min(100, latePct)}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>Vắng</span>
          <span>{absentPct}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-destructive/80 transition-[width]"
            style={{ width: `${Math.min(100, absentPct)}%` }}
          />
        </div>
      </div>
    </div>
  )
}

function formatCandidateDays(candidate: ISuggestedWeeklyTemplateCandidate): string {
  const week = candidate.weeks[0]
  if (!week) return "—"
  return WORK_WEEK_DISPLAY_DAY_ORDER.map((dayOfWeek) => {
    const day = week.days.find((entry) => entry.dayOfWeek === dayOfWeek)
    if (!day?.shiftId) return `${dayOfWeek === 0 ? "CN" : `T${dayOfWeek}`}:Nghỉ`
    return `${dayOfWeek === 0 ? "CN" : `T${dayOfWeek}`}:${day.shiftName ?? "Ca"}`
  }).join(" · ")
}

/** Weekly Schedule Copilot — Insights + Suggest + What-if (no LLM). */
export function ScheduleInsightsPanel() {
  const [lookbackDays, setLookbackDays] = useState<
    (typeof SCHEDULE_INSIGHTS_UI.LOOKBACK_OPTIONS)[number]
  >(SCHEDULE_INSIGHTS_UI.DEFAULT_LOOKBACK_DAYS)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null)

  const { data, isLoading, isError, isFetching } = useScheduleInsights(lookbackDays)
  const suggestQuery = useSuggestWeeklyTemplates(lookbackDays, showSuggestions)
  const simulateMutation = useSimulateWeeklyTemplate()
  const createMutation = useCreateWeeklyScheduleTemplate()

  const orderedDays = useMemo(() => {
    if (!data) return []
    const byDay = new Map(data.byDayOfWeek.map((day) => [day.dayOfWeek, day]))
    return WORK_WEEK_DISPLAY_DAY_ORDER.map((dayOfWeek) => byDay.get(dayOfWeek)).filter(
      (day): day is IScheduleInsightDayBucket => Boolean(day),
    )
  }, [data])

  const selectedCandidate = useMemo(
    () =>
      suggestQuery.data?.candidates.find((candidate) => candidate.id === selectedCandidateId) ??
      suggestQuery.data?.candidates[0] ??
      null,
    [selectedCandidateId, suggestQuery.data],
  )

  const handleCreateFromCandidate = (candidate: ISuggestedWeeklyTemplateCandidate) => {
    createMutation.mutate(
      {
        name: candidate.name,
        description: candidate.description,
        cycleWeeks: candidate.cycleWeeks,
        isActive: true,
        weeks: candidate.weeks.map((week) => ({
          weekIndex: week.weekIndex,
          days: week.days.map((day) => ({
            dayOfWeek: day.dayOfWeek,
            shiftId: day.shiftId,
          })),
        })),
      },
      {
        onSuccess: () => toast.success(`Đã tạo template "${candidate.name}"`),
        onError: (error) =>
          toast.error(error instanceof Error ? error.message : "Không tạo được template"),
      },
    )
  }

  const handleSimulate = (candidate: ISuggestedWeeklyTemplateCandidate) => {
    setSelectedCandidateId(candidate.id)
    simulateMutation.mutate(
      {
        cycleWeeks: candidate.cycleWeeks,
        weeks: candidate.weeks.map((week) => ({
          weekIndex: week.weekIndex,
          days: week.days.map((day) => ({
            dayOfWeek: day.dayOfWeek,
            shiftId: day.shiftId,
          })),
        })),
        lookbackDays,
        simulateWeeks: SCHEDULE_INSIGHTS_UI.DEFAULT_SIMULATION_WEEKS,
      },
      {
        onSuccess: () =>
          toast.success(
            `Đã mô phỏng what-if ${SCHEDULE_INSIGHTS_UI.DEFAULT_SIMULATION_WEEKS} tuần`,
          ),
        onError: (error) =>
          toast.error(error instanceof Error ? error.message : "Không mô phỏng được"),
      },
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">Insights lịch tuần</p>
          <p className="text-xs text-muted-foreground">
            Pattern đi muộn / vắng · gợi ý template · what-if — NV FT gắn template.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {SCHEDULE_INSIGHTS_UI.LOOKBACK_OPTIONS.map((days) => (
            <Button
              key={days}
              type="button"
              size="sm"
              variant={lookbackDays === days ? "default" : "outline"}
              className="rounded-full"
              onClick={() => {
                setLookbackDays(days)
                setShowSuggestions(false)
                simulateMutation.reset()
              }}
            >
              {days} ngày
            </Button>
          ))}
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="rounded-full"
            disabled={!data || suggestQuery.isFetching}
            onClick={() => {
              setShowSuggestions(true)
            }}
          >
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            Gợi ý template
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-48 w-full rounded-xl" />
      ) : isError ? (
        <PageCard className="p-6 text-sm text-destructive">
          Không tải được insights. Thử lại sau.
        </PageCard>
      ) : !data ? null : (
        <>
          <div className="flex items-center gap-2 rounded-lg bg-secondary/30 px-4 py-3 text-xs text-muted-foreground">
            <Users className="h-4 w-4 text-primary" />
            <span>
              {data.employeeCount} NV FT · {data.periodStart} → {data.periodEnd}
              {isFetching ? <Loader2 className="ml-2 inline h-3 w-3 animate-spin" /> : null}
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <PageCard className="p-4">
              <p className="text-xs text-muted-foreground">Đúng giờ / OT</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">{data.totals.onTime}</p>
            </PageCard>
            <PageCard className="p-4">
              <p className="text-xs text-muted-foreground">Đi muộn</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">{data.totals.late}</p>
            </PageCard>
            <PageCard className="p-4">
              <p className="text-xs text-muted-foreground">Vắng</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">{data.totals.absent}</p>
            </PageCard>
            <PageCard className="p-4">
              <p className="text-xs text-muted-foreground">TB phút muộn</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">
                {data.totals.avgLateMinutes}
              </p>
            </PageCard>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            {orderedDays.map((day) => (
              <DayRateBar key={day.dayOfWeek} day={day} />
            ))}
          </div>

          <PageCard className="space-y-3 p-5">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <p className="text-sm font-medium text-foreground">Điểm nóng</p>
            </div>
            {data.hotspots.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Không có điểm nóng trong khoảng thời gian này.
              </p>
            ) : (
              <ul className="space-y-2">
                {data.hotspots.map((hotspot) => (
                  <li
                    key={`${hotspot.dayOfWeek}-${hotspot.issue}`}
                    className="rounded-lg border border-border/60 bg-secondary/20 px-3 py-2 text-xs text-foreground"
                  >
                    {hotspot.message}
                  </li>
                ))}
              </ul>
            )}
          </PageCard>

          {showSuggestions ? (
            <PageCard className="space-y-4 p-5">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium text-foreground">Gợi ý template</p>
              </div>
              {suggestQuery.isLoading ? (
                <Skeleton className="h-24 w-full rounded-xl" />
              ) : suggestQuery.isError ? (
                <p className="text-xs text-destructive">Không tải được gợi ý template.</p>
              ) : !suggestQuery.data || suggestQuery.data.candidates.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Chưa có ca active trong catalog — tạo WorkingShift trước.
                </p>
              ) : (
                <div className="space-y-3">
                  {suggestQuery.data.candidates.map((candidate) => (
                    <div
                      key={candidate.id}
                      className="rounded-xl border border-border/60 bg-secondary/10 p-4 space-y-2"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{candidate.name}</p>
                          <p className="text-xs text-muted-foreground">{candidate.description}</p>
                        </div>
                        <p className="text-xs font-medium text-primary">
                          Score {candidate.predictedCoverageScore}
                        </p>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {formatCandidateDays(candidate)}
                      </p>
                      <ul className="list-disc pl-4 text-[11px] text-muted-foreground">
                        {candidate.tradeOffs.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="rounded-full"
                          disabled={simulateMutation.isPending}
                          onClick={() => {
                            handleSimulate(candidate)
                          }}
                        >
                          <FlaskConical className="mr-1.5 h-3.5 w-3.5" />
                          What-if 4 tuần
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          className="rounded-full"
                          disabled={createMutation.isPending}
                          onClick={() => {
                            handleCreateFromCandidate(candidate)
                          }}
                        >
                          {createMutation.isPending ? (
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          ) : null}
                          Tạo template
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </PageCard>
          ) : null}

          {simulateMutation.data ? (
            <PageCard className="space-y-3 p-5">
              <div className="flex items-center gap-2">
                <FlaskConical className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium text-foreground">
                  What-if
                  {selectedCandidate ? ` — ${selectedCandidate.name}` : ""}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 text-xs">
                <div className="rounded-lg border border-border/50 p-3">
                  <p className="text-muted-foreground">Ô ca (mô phỏng)</p>
                  <p className="mt-1 text-lg font-semibold">
                    {simulateMutation.data.summary.totalAssignedSlots}
                  </p>
                </div>
                <div className="rounded-lg border border-border/50 p-3">
                  <p className="text-muted-foreground">Ô nghỉ</p>
                  <p className="mt-1 text-lg font-semibold">
                    {simulateMutation.data.summary.offSlots}
                  </p>
                </div>
                <div className="rounded-lg border border-border/50 p-3">
                  <p className="text-muted-foreground">TB rủi ro muộn</p>
                  <p className="mt-1 text-lg font-semibold">
                    {Math.round(simulateMutation.data.summary.avgProjectedLateRisk * 100)}%
                  </p>
                </div>
                <div className="rounded-lg border border-border/50 p-3">
                  <p className="text-muted-foreground">TB rủi ro vắng</p>
                  <p className="mt-1 text-lg font-semibold">
                    {Math.round(simulateMutation.data.summary.avgProjectedAbsentRisk * 100)}%
                  </p>
                </div>
              </div>
              <ul className="space-y-2">
                {simulateMutation.data.messages.map((message) => (
                  <li
                    key={message}
                    className="rounded-lg border border-border/60 bg-secondary/20 px-3 py-2 text-xs text-foreground"
                  >
                    {message}
                  </li>
                ))}
              </ul>
            </PageCard>
          ) : null}
        </>
      )}
    </div>
  )
}

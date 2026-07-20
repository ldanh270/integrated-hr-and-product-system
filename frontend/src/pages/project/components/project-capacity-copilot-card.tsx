import { PageCard } from "@/components/common"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CAPACITY_COPILOT_RULES } from "@/config/rules/capacity-copilot.config"
import { capacityCopilotApi } from "@/lib/api/capacity-copilot.api"
import type { CapacityForecastResult } from "@/types/capacity-copilot.types"
import type { ProjectMember } from "@/types/project.types"
import { extractErrorMessage } from "@/utils/error-helper"

/**
 * Project Overview card that lets PM/Admin run advisory capacity forecasts.
 */
import { useMemo, useState } from "react"

import { useMutation } from "@tanstack/react-query"
import { AlertTriangle, Brain, CheckCircle2, RefreshCw } from "lucide-react"
import { toast } from "sonner"

interface ProjectCapacityCopilotCardProps {
  projectId: string
  members: ProjectMember[]
}

const getCurrentWeekStart = (): string => {
  const date = new Date()
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  date.setHours(0, 0, 0, 0)
  return date.toISOString().slice(0, 10)
}

export function ProjectCapacityCopilotCard({
  projectId,
  members,
}: ProjectCapacityCopilotCardProps) {
  const roleOptions = useMemo(() => {
    const roleByCode = new Map<string, string>()
    for (const member of members) {
      const code = member.role?.code || CAPACITY_COPILOT_RULES.UNKNOWN_ROLE_CODE
      const name = member.role?.name || CAPACITY_COPILOT_RULES.UNKNOWN_ROLE_NAME
      roleByCode.set(code, name)
    }
    return Array.from(roleByCode.entries()).map(([roleCode, roleName]) => ({ roleCode, roleName }))
  }, [members])

  const [weekStart, setWeekStart] = useState(getCurrentWeekStart)
  const [forecast, setForecast] = useState<CapacityForecastResult | null>(null)

  const mutation = useMutation({
    mutationFn: () =>
      capacityCopilotApi.forecastProject(projectId, {
        weekStart,
        lookbackWeeks: CAPACITY_COPILOT_RULES.DEFAULT_LOOKBACK_WEEKS,
      }),
    onSuccess: (data) => {
      setForecast(data)
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error))
    },
  })

  const riskIcon =
    forecast?.riskLevel === "low" ? (
      <CheckCircle2 className="size-4 text-primary" />
    ) : (
      <AlertTriangle className="size-4 text-destructive" />
    )

  return (
    <PageCard className="p-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-base text-foreground flex items-center gap-1.5">
              <Brain className="size-4 text-primary" />
              Part-time Capacity Copilot
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Dự đoán % hoàn thành tuần này từ lịch sử delivery, lịch rảnh (availability), hiệu suất
              (velocity) và giờ đã log (spent time).
            </p>
          </div>
          <Input
            type="date"
            value={weekStart}
            onChange={(event) => setWeekStart(event.target.value)}
            className="w-40 rounded-full"
          />
        </div>

        <div className="rounded-xl border border-border p-3 bg-muted/20 max-w-sm text-xs text-muted-foreground">
          {/* Target stays on project deal so Admin cannot silently alter forecast assumptions at runtime. */}
          Mục tiêu tuần này (Target milestone %) được lấy từ deal khi tạo/chỉnh sửa dự án.
        </div>

        <Button
          className="rounded-full w-fit gap-2"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || roleOptions.length === 0}
        >
          <RefreshCw className={`size-4 ${mutation.isPending ? "animate-spin" : ""}`} />
          Dự đoán năng lực (Forecast capacity)
        </Button>

        {forecast && (
          <div className="space-y-4 border-t border-border pt-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-border p-3 bg-muted/20">
                <span className="text-xs text-muted-foreground">Cam kết (Target)</span>
                <div className="text-lg font-black">{forecast.targetPercent}%</div>
              </div>
              <div className="rounded-xl border border-border p-3 bg-muted/20">
                <span className="text-xs text-muted-foreground">Dự đoán (Predicted)</span>
                <div className="text-lg font-black">{forecast.predictedPercent}%</div>
              </div>
              <div className="rounded-xl border border-border p-3 bg-muted/20">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  {riskIcon}
                  Chênh lệch (Gap)
                </span>
                <div className="text-lg font-black">{forecast.percentGap}%</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="rounded-xl border border-border p-3 bg-muted/20">
                <span className="text-muted-foreground">Capacity tuần này (This week)</span>
                <div className="text-base font-black">
                  {forecast.totalEffectiveHours} effective hours
                </div>
              </div>
              <div className="rounded-xl border border-border p-3 bg-muted/20">
                <span className="text-muted-foreground">Năng suất lịch sử (Productivity)</span>
                <div className="text-base font-black">{forecast.productivityRate}% / hour</div>
              </div>
              <div className="rounded-xl border border-border p-3 bg-muted/20">
                <span className="text-muted-foreground">Cần thêm (Needed)</span>
                <div className="text-base font-black">
                  {forecast.productivityRate > 0
                    ? `${forecast.neededEffectiveHours} effective hours`
                    : "Chưa đủ dữ liệu"}
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border overflow-hidden">
              {forecast.roles.map((role) => (
                <div
                  key={role.roleCode}
                  className="grid grid-cols-2 gap-2 px-3 py-2 border-b border-border last:border-b-0 text-xs"
                >
                  <span className="font-semibold text-foreground">{role.roleName}</span>
                  <span>Dự đoán năng lực (Role forecast) {role.effectiveHours}h</span>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              {forecast.recommendations.map((recommendation) => (
                <p
                  key={recommendation}
                  className="rounded-xl bg-muted/20 border border-border px-3 py-2 text-xs text-muted-foreground"
                >
                  {recommendation}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageCard>
  )
}

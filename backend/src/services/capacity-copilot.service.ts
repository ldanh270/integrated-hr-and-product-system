/**
 * Service layer for converting project staffing data into capacity forecast inputs.
 */
import { WORK_SCHEDULE_TYPE } from "@/configs/entities/employee.config.ts"
import { CAPACITY_COPILOT_RULES } from "@/configs/rules/capacity-copilot.config.ts"
import { ErrorLayer } from "@/configs/system/error-code.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import {
  ForecastProjectCapacityDto,
  ICapacityCopilotRepository,
} from "@/types/capacity-copilot.types.ts"
import { AppError } from "@/utils/error.util.ts"
import {
  CapacityForecastResult,
  CapacityMemberInput,
  buildCapacityForecast,
} from "@/utils/project-capacity-copilot.util.ts"

export class CapacityCopilotService {
  constructor(private repository: ICapacityCopilotRepository) {}

  async forecastProjectCapacity(
    projectId: string,
    input: ForecastProjectCapacityDto,
  ): Promise<CapacityForecastResult> {
    const dealTargetPercent = await this.repository.getProjectDealTargetPercent(projectId)
    if (dealTargetPercent === undefined) {
      throw new AppError("Project not found", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE)
    }
    if (dealTargetPercent == null) {
      throw new AppError(
        "Project chưa có target % trong deal",
        HttpStatusCode.UNPROCESSABLE_ENTITY,
        ErrorLayer.SERVICE,
      )
    }

    const weekStart = this.normalizeWeekStart(input.weekStart)

    const [members, availabilities] = await Promise.all([
      this.repository.listProjectMembers(projectId),
      this.repository.listWeeklyAvailabilities(weekStart),
    ])
    // The target is fixed by the project deal; runtime input only controls the forecast week/window.
    const history = await this.repository.listDeliveryHistory(
      projectId,
      weekStart,
      input.lookbackWeeks ?? CAPACITY_COPILOT_RULES.DEFAULT_LOOKBACK_WEEKS,
    )
    const availabilityByEmployeeId = new Map(
      availabilities.map((availability) => [availability.employeeId, availability]),
    )

    const memberInputs: CapacityMemberInput[] = []
    for (const member of members) {
      const velocity = await this.repository.getEmployeeVelocity(member.employeeId)

      memberInputs.push({
        employeeId: member.employeeId,
        fullName: member.fullName,
        roleCode: member.roleCode,
        roleName: member.roleName,
        availableHours: this.getAvailableHours(
          member.workScheduleType,
          availabilityByEmployeeId.get(member.employeeId),
        ),
        estimatedHours: velocity.estimatedHours,
        spentHours: velocity.spentHours,
        skillMatchFactor: CAPACITY_COPILOT_RULES.DEFAULT_SKILL_MATCH_FACTOR,
      })
    }

    return buildCapacityForecast(memberInputs, dealTargetPercent, history)
  }

  private getAvailableHours(
    workScheduleType: string,
    availability:
      | Awaited<ReturnType<ICapacityCopilotRepository["listWeeklyAvailabilities"]>>[number]
      | undefined,
  ): number {
    if (workScheduleType === WORK_SCHEDULE_TYPE.FULL_TIME) {
      return CAPACITY_COPILOT_RULES.FULL_TIME_WEEKLY_HOURS
    }
    if (!availability) return 0

    return availability.days.reduce((weekTotal, day) => {
      if (day.isBusyAllDay) return weekTotal
      const dayMinutes = day.slots.reduce(
        (sum, slot) => sum + Math.max(0, slot.endTime - slot.startTime),
        0,
      )
      return weekTotal + dayMinutes / CAPACITY_COPILOT_RULES.MINUTES_PER_HOUR
    }, 0)
  }

  private normalizeWeekStart(value: string): Date {
    const date = new Date(value)
    const day = date.getDay()
    const diff = day === 0 ? -CAPACITY_COPILOT_RULES.DAYS_PER_WEEK + 1 : 1 - day
    date.setDate(date.getDate() + diff)
    date.setHours(0, 0, 0, 0)
    return date
  }
}

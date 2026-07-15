import { HOLIDAY_SCOPE } from "@/configs/entities/attendance.config.ts"
import { EMPLOYEE_STATUS } from "@/configs/entities/employee.config.ts"
import { ErrorLayer } from "@/configs/system/error-code.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { prisma } from "@/libs/database.ts"
import {
  ICreateHolidayDTO,
  IHolidayRepository,
  IHolidayService,
  IListHolidaysQueryDTO,
  IUpdateHolidayDTO,
} from "@/types/attendance.types.ts"
import { AppError } from "@/utils/error.util.ts"

/**
 * Service for holiday calendar operations used by attendance scheduling.
 */
export class HolidayService implements IHolidayService {
  constructor(private holidayRepo: IHolidayRepository) {}

  async listHolidays(query?: IListHolidaysQueryDTO): Promise<any[]> {
    return this.holidayRepo.listHolidays(query)
  }

  async createHoliday(data: ICreateHolidayDTO, createdById: string): Promise<any[]> {
    const start = new Date(data.startDate ?? data.date!)
    const end = new Date(data.endDate ?? data.startDate ?? data.date!)

    if (end < start) {
      throw new AppError(
        "endDate must be greater than or equal to startDate",
        HttpStatusCode.BAD_REQUEST,
        ErrorLayer.SERVICE,
        "INVALID_DATE_RANGE",
      )
    }

    const scope = data.scope ?? HOLIDAY_SCOPE.ALL
    await this.validateScopeTargets(scope, data)

    return this.holidayRepo.createHolidayRange(
      { ...data, scope, startDate: start, endDate: end },
      createdById,
    )
  }

  async updateHoliday(id: string, data: IUpdateHolidayDTO): Promise<any> {
    return this.holidayRepo.updateHoliday(id, data)
  }

  async deleteHoliday(id: string, deleteBatch = true): Promise<void> {
    return this.holidayRepo.deleteHoliday(id, deleteBatch)
  }

  async isHoliday(date: string | Date): Promise<boolean> {
    return this.holidayRepo.checkIsHoliday(date)
  }

  private async validateScopeTargets(
    scope: string,
    data: ICreateHolidayDTO,
  ): Promise<void> {
    if (scope === HOLIDAY_SCOPE.POSITION) {
      const position = await prisma.position.findFirst({
        where: { id: data.positionId!, deletedAt: null },
        select: { id: true },
      })
      if (!position) {
        throw new AppError(
          "Position not found",
          HttpStatusCode.NOT_FOUND,
          ErrorLayer.SERVICE,
          "POSITION_NOT_FOUND",
        )
      }
      return
    }

    if (scope === HOLIDAY_SCOPE.EMPLOYEES) {
      const ids = [...new Set(data.employeeIds ?? [])]
      const count = await prisma.employee.count({
        where: {
          id: { in: ids },
          deletedAt: null,
          status: { in: [EMPLOYEE_STATUS.ACTIVE, EMPLOYEE_STATUS.ON_LEAVE] },
        },
      })
      if (count === 0) {
        throw new AppError(
          "No active employees found for the provided ids",
          HttpStatusCode.UNPROCESSABLE_ENTITY,
          ErrorLayer.SERVICE,
          "NO_TARGET_EMPLOYEES",
        )
      }
    }
  }
}

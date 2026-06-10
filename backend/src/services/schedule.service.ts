import {
  IAssignShiftScheduleDTO,
  IEmployeeShiftRepository,
  IOverrideEmployeeShiftDTO,
  IScheduleService,
  IShiftScheduleRepository,
} from "@/types/shift.types.ts"
import { AppError } from "@/utils/error.util.ts"

export class ScheduleService implements IScheduleService {
  constructor(
    private scheduleRepo: IShiftScheduleRepository,
    private employeeShiftRepo: IEmployeeShiftRepository,
  ) {}

  async assignSchedule(data: IAssignShiftScheduleDTO): Promise<any> {
    return this.scheduleRepo.assignSchedule(data)
  }

  async getScheduleForEmployee(employeeId: string, date: string | Date): Promise<any | null> {
    return this.scheduleRepo.getScheduleByEmployee(employeeId, date)
  }

  async listSchedulesForEmployee(employeeId: string): Promise<any[]> {
    return this.scheduleRepo.listSchedulesByEmployee(employeeId)
  }

  async overrideEmployeeShift(data: IOverrideEmployeeShiftDTO): Promise<any> {
    return this.employeeShiftRepo.overrideShift(data)
  }
}

import {
  IAssignShiftScheduleDTO,
  IEmployeeShiftRepository,
  IOverrideEmployeeShiftDTO,
  IScheduleService,
  IShiftScheduleRepository,
} from "@/types/shift.types.ts"
import { AppError } from "@/utils/error.util.ts"

/**
 * Service for managing employee shift schedules and overrides.
 */
export class ScheduleService implements IScheduleService {
  /**
   * Creates a new ScheduleService instance.
   * @param scheduleRepo - Repository for shift schedules.
   * @param employeeShiftRepo - Repository for employee shift assignments.
   */
  constructor(
    private scheduleRepo: IShiftScheduleRepository,
    private employeeShiftRepo: IEmployeeShiftRepository,
  ) {}

  /**
   * Assigns a recurring shift schedule to an employee.
   * @param data - The schedule assignment data.
   * @returns The created shift schedule.
   */
  async assignSchedule(data: IAssignShiftScheduleDTO): Promise<any> {
    return this.scheduleRepo.assignSchedule(data)
  }

  /**
   * Gets the active shift schedule for an employee on a specific date.
   * @param employeeId - The employee ID.
   * @param date - The target date.
   * @returns The active shift schedule or null if not found.
   */
  async getScheduleForEmployee(employeeId: string, date: string | Date): Promise<any | null> {
    return this.scheduleRepo.getScheduleByEmployee(employeeId, date)
  }

  /**
   * Lists all shift schedules for a specific employee.
   * @param employeeId - The employee ID.
   * @returns An array of shift schedules.
   */
  async listSchedulesForEmployee(employeeId: string): Promise<any[]> {
    return this.scheduleRepo.listSchedulesByEmployee(employeeId)
  }

  /**
   * Overrides an employee's assigned shift for a specific date.
   * @param data - The override data.
   * @returns The updated or created employee shift override.
   */
  async overrideEmployeeShift(data: IOverrideEmployeeShiftDTO): Promise<any> {
    return this.employeeShiftRepo.overrideShift(data)
  }
}

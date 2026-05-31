import {
  IAttendanceService,
  IAttendanceRepository,
  IAttendanceRecordQueryDTO,
  IHolidayRepository,
} from "@/types/attendance.types.ts"
import {
  IEmployeeShiftRepository,
  IShiftScheduleRepository,
  IWorkingShiftRepository,
} from "@/types/shift.types.ts"
import { AppError } from "@/utils/error.util.ts"

export class AttendanceService implements IAttendanceService {
  constructor(
    private attendanceRepo: IAttendanceRepository,
    private employeeShiftRepo: IEmployeeShiftRepository,
    private scheduleRepo: IShiftScheduleRepository,
    private holidayRepo: IHolidayRepository,
    private workingShiftRepo: IWorkingShiftRepository
  ) {}

  async checkIn(employeeId: string, location: { lat: number; lng: number }): Promise<any> {
    const today = new Date()
    let shiftId: string | undefined = undefined

    // 1. Check for daily override
    const override = await this.employeeShiftRepo.getShiftForEmployeeDate(employeeId, today)
    if (override && override.status === "scheduled") {
      shiftId = override.shiftId?.toString()
    } else {
      // 2. Fallback to weekly schedule
      const schedule = await this.scheduleRepo.getScheduleByEmployee(employeeId, today)
      if (schedule && schedule.weekdays) {
        const days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]
        const dayName = days[today.getDay()] as keyof typeof schedule.weekdays
        const scheduledShiftId = schedule.weekdays[dayName]
        
        if (scheduledShiftId) {
          shiftId = scheduledShiftId.toString()
        }
      }
    }

    // 3. Optional: Validate GPS Location against shift configuration
    if (shiftId) {
      const shift = await this.workingShiftRepo.findById(shiftId)
      if (shift && shift.gps && shift.gps.radiusMeters) {
        // Here we could calculate distance between `location` and `shift.gps`
        // const distance = calculateDistance(location, shift.gps)
        // if (distance > shift.gps.radiusMeters) throw new AppError("Out of valid range", 400)
      }
    }

    // 4. Check if today is a holiday
    const isHoliday = await this.holidayRepo.checkIsHoliday(today)
    if (isHoliday) {
      // Logic for holiday attendance (e.g. counts as overtime automatically)
    }

    return this.attendanceRepo.checkIn(employeeId, location, shiftId)
  }

  async checkOut(employeeId: string, location: { lat: number; lng: number }): Promise<any> {
    return this.attendanceRepo.checkOut(employeeId, location)
  }

  async getAttendanceRecords(query: IAttendanceRecordQueryDTO): Promise<any[]> {
    return this.attendanceRepo.queryRecords(query)
  }
}

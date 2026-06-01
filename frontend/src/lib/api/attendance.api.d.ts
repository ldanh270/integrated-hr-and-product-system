import type { IAttendanceRecord, ICheckInOutRequest } from "../../types/attendance.types"

export declare const attendanceApi: {
  getRecords: (query?: {
    employeeId?: string
    startDate?: string
    endDate?: string
  }) => Promise<IAttendanceRecord[]>
  checkIn: (data: ICheckInOutRequest) => Promise<IAttendanceRecord>
  checkOut: (data: ICheckInOutRequest) => Promise<IAttendanceRecord>
  scan: (data: ICheckInOutRequest) => Promise<IAttendanceRecord>
}

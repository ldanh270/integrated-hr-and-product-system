import type { IShiftSchedule, IWorkingShift } from "../../types/attendance.types"

export declare const shiftApi: {
  getShifts: () => Promise<IWorkingShift[]>
  createShift: (data: Partial<IWorkingShift>) => Promise<IWorkingShift>
  getEmployeeSchedule: (employeeId: string, date?: string) => Promise<IShiftSchedule>
  assignSchedule: (data: any) => Promise<IShiftSchedule>
}

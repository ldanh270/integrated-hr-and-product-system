export interface SeedContext {
  adminId: string
  employees: Array<{ id: string; position: string | null; username: string }>
  workingShiftIds: string[]
  shiftScheduleMap: Record<string, string> // employeeId → scheduleId
  employeeShiftIds: string[]
  salaryComponentIds: string[]
  payslipTemplateIds: string[]
  salaryConfigMap: Record<string, string> // employeeId → configId
  payrollIds: string[]
  projectIds: string[]
}

export function createEmptyContext(): SeedContext {
  return {
    adminId: "",
    employees: [],
    workingShiftIds: [],
    shiftScheduleMap: {},
    employeeShiftIds: [],
    salaryComponentIds: [],
    payslipTemplateIds: [],
    salaryConfigMap: {},
    payrollIds: [],
    projectIds: [],
  }
}

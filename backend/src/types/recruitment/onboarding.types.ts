import { Employee } from "@prisma/client";

export interface IOnboardingService {
  convertCandidateToEmployee(applicationId: string, employeeData: ConvertToEmployeeDTO): Promise<Employee>;
}

export type ConvertToEmployeeDTO = {
  departmentId?: string;
  position?: string;
  startDate: Date;
};

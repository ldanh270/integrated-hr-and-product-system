import { Employee, IEmployeeRepository, IEmployeeService } from "@/types"

export class EmployeeService implements IEmployeeService {
  constructor(private repository: IEmployeeRepository) {}

  async listEmployees(): Promise<Employee[]> {
    return this.repository.listEmployees()
  }
}

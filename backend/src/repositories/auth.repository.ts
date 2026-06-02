import Employee from "@/entities/Employee.ts"
import ActivityLog from "@/entities/auth/ActivityLog.ts"
import { AuthEmployeeDocument, IAuthRepository } from "@/types/auth.types.ts"

import { BaseRepository } from "./base.repository.ts"

/**
 * MongoDB implementation of the Authentication Repository
 * Follows the Repository Pattern to decouple business logic from the database
 */
export class MongoAuthRepository extends BaseRepository<any> implements IAuthRepository {
  constructor() {
    super(Employee)
  }

  /**
   * Finds an employee by username and explicitly selects the passwordHash field
   * Returns an AuthEmployeeDocument which includes Mongoose methods like .save()
   */
  async findAuthByUsername(username: string): Promise<AuthEmployeeDocument | null> {
    // We cast to any first and then to AuthEmployeeDocument to satisfy TypeScript
    // while keeping access to Mongoose document methods
    const employee = await this.model.findOne({ username }).select("+passwordHash")
    return employee as unknown as AuthEmployeeDocument
  }

  /**
   * Records an authentication-related activity in the ActivityLog collection
   */
  async logActivity(data: {
    empId?: any
    actionType: "login" | "logout" | "failed-login"
    ipAddress?: string
    timestamp: Date
    details?: string
  }): Promise<void> {
    const { empId, timestamp, ...rest } = data
    await ActivityLog.create({
      employeeId: empId,
      ...rest,
    })
  }
}

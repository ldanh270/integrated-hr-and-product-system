import Employee from "@/entities/Employee.ts"
import type {
  IProfileRepository,
  ProfileEmployeeDocument,
  ProfileEmployeeDocumentWithPassword,
  UpdateProfileDto,
} from "@/types/profile.types.ts"

import { BaseRepository } from "./base.repository.ts"

/**
 * MongoDB implementation of the Profile Repository
 * Follows the Repository Pattern to isolate all DB operations
 */
export class MongoProfileRepository
  extends BaseRepository<any, ProfileEmployeeDocument>
  implements IProfileRepository
{
  constructor() {
    super(Employee)
  }

  /**
   * Finds an employee by their MongoDB ObjectId and explicitly selects the passwordHash field
   * Returns a Mongoose Document (lean = false) so that we can call .save() on it
   */
  async findAuthById(empId: string): Promise<ProfileEmployeeDocumentWithPassword | null> {
    const employee = await this.model.findById(empId).select("+passwordHash")
    return employee as unknown as ProfileEmployeeDocumentWithPassword | null
  }

  /**
   * Updates only the user-editable profile fields and returns the updated document
   */
  async updateProfile(
    empId: string,
    data: UpdateProfileDto,
  ): Promise<ProfileEmployeeDocument | null> {
    // Build an update object filtering out undefined values
    const updateFields: Record<string, unknown> = {}

    if (data.fullName !== undefined) updateFields.fullName = data.fullName
    if (data.phone !== undefined) updateFields.phone = data.phone
    if (data.dateOfBirth !== undefined) updateFields.dateOfBirth = new Date(data.dateOfBirth)
    if (data.nationalId !== undefined) updateFields.nationalId = data.nationalId
    if (data.address !== undefined) updateFields.address = data.address

    const employee = await this.model.findByIdAndUpdate(
      empId,
      { $set: updateFields },
      { new: true, runValidators: true },
    )

    return employee as unknown as ProfileEmployeeDocument | null
  }

  /**
   * Updates only the avatar sub-document for a given employee
   */
  async updateAvatar(
    empId: string,
    avatar: { url: string; id: string },
  ): Promise<ProfileEmployeeDocument | null> {
    const employee = await this.model.findByIdAndUpdate(empId, { $set: { avatar } }, { new: true })

    return employee as unknown as ProfileEmployeeDocument | null
  }
}

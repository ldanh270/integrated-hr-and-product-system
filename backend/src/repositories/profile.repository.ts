import Employee from "@/entities/Employee.ts"
import type {
  IProfileRepository,
  ProfileEmployeeDocument,
  ProfileEmployeeDocumentWithPassword,
  UpdateProfileDto,
} from "@/types/profile.types.ts"

/**
 * MongoDB implementation of the Profile Repository
 * Follows the Repository Pattern to isolate all DB operations
 */
export class MongoProfileRepository implements IProfileRepository {
  /**
   * Finds an employee by their MongoDB ObjectId for profile read
   */
  async findById(empId: string): Promise<ProfileEmployeeDocument | null> {
    const employee = await Employee.findById(empId)
    return employee as unknown as ProfileEmployeeDocument | null
  }

  /**
   * Finds an employee by their MongoDB ObjectId and explicitly selects the passwordHash field
   */
  async findAuthById(empId: string): Promise<ProfileEmployeeDocumentWithPassword | null> {
    const employee = await Employee.findById(empId).select("+passwordHash")
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

    const employee = await Employee.findByIdAndUpdate(
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
    const employee = await Employee.findByIdAndUpdate(empId, { $set: { avatar } }, { new: true })

    return employee as unknown as ProfileEmployeeDocument | null
  }
}

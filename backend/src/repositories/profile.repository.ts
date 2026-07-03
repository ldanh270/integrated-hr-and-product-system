import type {
  IProfileRepository,
  ProfileEmployeeDocument,
  ProfileEmployeeDocumentWithPassword,
  UpdateProfileDto,
} from "@/types/profile.types.ts"

import { PrismaClient, Employee as PrismaEmployee } from "@prisma/client"

import { BaseRepository } from "./base.repository.ts"

/**
 * Prisma implementation of the Profile Repository
 * Follows the Repository Pattern to isolate all DB operations
 */
export class PrismaProfileRepository extends BaseRepository implements IProfileRepository {
  constructor(prisma: PrismaClient) {
    super(prisma)
  }

  private mapToProfile(
    employee: PrismaEmployee & {
      personalEmployee?: PrismaEmployee | null
    },
  ): ProfileEmployeeDocument {
    return {
      id: employee.id,
      fullName: employee.fullName,
      username: employee.username,
      email: employee.email,
      phone: employee.phone,
      dateOfBirth: employee.dateOfBirth,
      nationalId: employee.nationalId,
      address: employee.address,
      position: employee.position,
      employeeType: employee.employeeType,
      workScheduleType: employee.workScheduleType, // PT vs full-time scheduling model
      status: employee.status,
      startDate: employee.startDate,
      avatarUrl: employee.avatarUrl,
      avatarId: employee.avatarId,
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt,
      personalEmployeeId: employee.personalEmployeeId,
      personalEmployee: employee.personalEmployee
        ? {
            id: employee.personalEmployee.id,
            fullName: employee.personalEmployee.fullName,
            email: employee.personalEmployee.email,
            status: employee.personalEmployee.status,
            deletedAt: employee.personalEmployee.deletedAt,
          }
        : null,
    }
  }

  async findById(empId: string): Promise<ProfileEmployeeDocument | null> {
    const employee = await this.prisma.employee.findFirst({
      where: { id: empId, deletedAt: null },
      include: {
        personalEmployee: true,
      },
    })

    if (!employee) return null

    return this.mapToProfile(employee)
  }

  async findAuthById(empId: string): Promise<ProfileEmployeeDocumentWithPassword | null> {
    const employee = await this.prisma.employee.findFirst({
      where: { id: empId, deletedAt: null },
    })

    if (!employee) return null

    return {
      ...this.mapToProfile(employee),
      passwordHash: employee.passwordHash,
    }
  }

  /**
   * Updates only the user-editable profile fields and returns the updated document
   */
  async updateProfile(
    empId: string,
    data: UpdateProfileDto,
  ): Promise<ProfileEmployeeDocument | null> {
    const updateFields: any = {}

    if (data.fullName !== undefined) updateFields.fullName = data.fullName
    if (data.phone !== undefined) updateFields.phone = data.phone
    if (data.dateOfBirth !== undefined) updateFields.dateOfBirth = new Date(data.dateOfBirth)
    if (data.nationalId !== undefined) updateFields.nationalId = data.nationalId
    if (data.address !== undefined) updateFields.address = data.address

    try {
      const employee = await this.prisma.employee.update({
        where: { id: empId },
        data: updateFields,
      })

      return this.mapToProfile(employee)
    } catch (error) {
      return null
    }
  }

  /**
   * Updates only the avatar for a given employee
   */
  async updateAvatar(
    empId: string,
    avatar: { url: string; id: string },
  ): Promise<ProfileEmployeeDocument | null> {
    try {
      const employee = await this.prisma.employee.update({
        where: { id: empId },
        data: {
          avatarUrl: avatar.url,
          avatarId: avatar.id,
        },
      })

      return this.mapToProfile(employee)
    } catch (error) {
      return null
    }
  }

  /**
   * Updates the password hash for an employee
   */
  async updatePassword(empId: string, newPasswordHash: string): Promise<void> {
    await this.prisma.employee.update({
      where: { id: empId },
      data: { passwordHash: newPasswordHash },
    })
  }

  async updatePersonalEmployeeLink(
    empId: string,
    personalEmployeeId: string | null,
  ): Promise<ProfileEmployeeDocument | null> {
    try {
      const employee = await this.prisma.employee.update({
        where: { id: empId },
        data: { personalEmployeeId },
        include: { personalEmployee: true },
      })

      return this.mapToProfile(employee)
    } catch {
      return null
    }
  }
}

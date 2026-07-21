import { prisma } from "@/libs/database"
import { Prisma, type PrismaClient, type EmployeeType } from "@prisma/client"
import type {
  CreateJobRequisitionInput,
  UpdateJobRequisitionInput,
  ListRequisitionsQuery,
} from "@/types/recruitment.types"
import { generateRequisitionCode } from "@/types/recruitment.types"
import { PERMISSION_CODE } from "@/configs/entities/permission.config"

export class JobRequisitionRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  async create(data: CreateJobRequisitionInput, requestedById: string): Promise<{ id: string }> {
    const year = new Date().getFullYear()
    const count = await this.db.jobRequisition.count({
      where: { code: { startsWith: `REQ-${year}` } },
    })

    return this.db.jobRequisition.create({
      data: {
        ...data,
        code: generateRequisitionCode(year, count + 1),
        requestedById,
        salaryMin: data.salaryMin,
        salaryMax: data.salaryMax,
        headcount: data.headcount ?? 1,
        employmentType: data.employmentType as EmployeeType,
      },
      select: { id: true },
    })
  }

  async findById(id: string) {
    return this.db.jobRequisition.findUnique({
      where: { id },
      include: {
        requestedBy: { select: { id: true, fullName: true } },
        approver: { select: { id: true, fullName: true, position: true } },
        approvedBy: { select: { id: true, fullName: true } },
        position: { select: { id: true, name: true } },
        jobDescriptions: true,
        _count: { select: { applications: true } },
      },
    })
  }

  async findByCode(code: string) {
    return this.db.jobRequisition.findUnique({
      where: { code },
      include: {
        requestedBy: { select: { id: true, fullName: true } },
        approver: { select: { id: true, fullName: true, position: true } },
        approvedBy: { select: { id: true, fullName: true } },
      },
    })
  }

  async list(query: ListRequisitionsQuery) {
    const { status, department, priority, page = 1, pageSize = 20 } = query
    const skip = (page - 1) * pageSize

    const where: Prisma.JobRequisitionWhereInput = {}
    if (status) where.status = status
    if (department) where.department = { contains: department }
    if (priority) where.priority = priority

    const [items, total] = await Promise.all([
      this.db.jobRequisition.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
        include: {
          requestedBy: { select: { id: true, fullName: true } },
          approver: { select: { id: true, fullName: true, position: true } },
          approvedBy: { select: { id: true, fullName: true } },
          _count: { select: { applications: true } },
        },
      }),
      this.db.jobRequisition.count({ where }),
    ])

    return { items, total, page, pageSize }
  }

  async update(id: string, data: UpdateJobRequisitionInput) {
    const updateData: Prisma.JobRequisitionUpdateInput = {}
    if (data.status !== undefined) updateData.status = data.status
    if (data.title !== undefined) updateData.title = data.title
    if (data.department !== undefined) updateData.department = data.department
    if (data.positionLevel !== undefined) updateData.positionLevel = data.positionLevel
    if (data.employmentType !== undefined) updateData.employmentType = data.employmentType as EmployeeType
    if (data.salaryMin !== undefined) updateData.salaryMin = data.salaryMin
    if (data.salaryMax !== undefined) updateData.salaryMax = data.salaryMax
    if (data.headcount !== undefined) updateData.headcount = data.headcount
    if (data.priority !== undefined) updateData.priority = data.priority
    if (data.targetHiringDate !== undefined) updateData.targetHireDate = new Date(data.targetHiringDate)
    if (data.positionId !== undefined) updateData.position = data.positionId ? { connect: { id: data.positionId } } : { disconnect: true }

    return this.db.jobRequisition.update({
      where: { id },
      data: updateData,
      include: {
        requestedBy: { select: { id: true, fullName: true } },
        approver: { select: { id: true, fullName: true, position: true } },
        approvedBy: { select: { id: true, fullName: true } },
      },
    })
  }

  async approve(id: string, approvedById: string, comment?: string) {
    return this.db.jobRequisition.update({
      where: { id },
      data: {
        status: "approved",
        approvedById,
        approvalComment: comment,
        approvedAt: new Date(),
      },
      include: {
        requestedBy: { select: { id: true, fullName: true } },
        approvedBy: { select: { id: true, fullName: true } },
      },
    })
  }

  async reject(id: string, rejectedById: string, reason?: string) {
    return this.db.jobRequisition.update({
      where: { id },
      data: {
        status: "rejected",
        approvedById: rejectedById,
        approvalComment: reason,
        approvedAt: new Date(),
      },
    })
  }

  async close(id: string) {
    return this.db.jobRequisition.update({
      where: { id },
      data: { status: "closed" },
    })
  }

  async incrementFilledCount(id: string) {
    return this.db.jobRequisition.update({
      where: { id },
      data: { filledCount: { increment: 1 } },
    })
  }

  async delete(id: string) {
    return this.db.jobRequisition.delete({ where: { id } })
  }

  async listApprovers() {
    return this.db.employee.findMany({
      where: {
        status: "active",
        deletedAt: null,
        employeeRoles: {
          some: {
            role: {
              isActive: true,
              deletedAt: null,
              permissions: {
                some: {
                  permission: {
                    code: PERMISSION_CODE.RECRUITMENT_REQUISITION_APPROVE,
                    isActive: true,
                    deletedAt: null,
                  },
                },
              },
            },
          },
        },
      },
      select: { id: true, fullName: true, position: true },
      orderBy: { fullName: "asc" },
    })
  }

  async canApprove(employeeId: string) {
    const employee = await this.db.employee.findFirst({
      where: {
        id: employeeId,
        status: "active",
        deletedAt: null,
        employeeRoles: {
          some: {
            role: {
              isActive: true,
              deletedAt: null,
              permissions: {
                some: {
                  permission: {
                    code: PERMISSION_CODE.RECRUITMENT_REQUISITION_APPROVE,
                    isActive: true,
                    deletedAt: null,
                  },
                },
              },
            },
          },
        },
      },
      select: { id: true },
    })
    return Boolean(employee)
  }

  async getStats() {
    const [total, open, pending, approved] = await Promise.all([
      this.db.jobRequisition.count(),
      this.db.jobRequisition.count({ where: { status: "approved" } }),
      this.db.jobRequisition.count({ where: { status: "pending_approval" } }),
      this.db.jobRequisition.count({ where: { status: "approved" } }),
    ])
    return { total, open, pending, approved }
  }
}

export const jobRequisitionRepository = new JobRequisitionRepository()

import { prisma } from "@/libs/database"
import { Prisma, type PrismaClient, $Enums } from "@prisma/client"
import type { CreateBackgroundCheckInput, UpdateBackgroundCheckInput } from "@/types/recruitment.types"
import { BGC_STATUS_TRANSITIONS } from "@/configs/rules/recruitment.config"

export class BackgroundCheckRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  async create(data: CreateBackgroundCheckInput): Promise<{ id: string }> {
    return this.db.backgroundCheck.create({
      data: {
        offerId: data.offerId,
        candidateId: data.candidateId,
        group: data.group,
        status: "pending",
      },
      select: { id: true },
    })
  }

  async findById(id: string) {
    return this.db.backgroundCheck.findUnique({
      where: { id },
      include: {
        offer: {
          include: {
            application: {
              include: {
                candidate: { select: { id: true, fullName: true, email: true } },
              },
            },
          },
        },
        candidate: { select: { id: true, fullName: true, email: true, nationalId: true } },
        checkedBy: { select: { id: true, fullName: true } },
      },
    })
  }

  async findByOffer(offerId: string) {
    return this.db.backgroundCheck.findUnique({
      where: { offerId },
      include: {
        candidate: { select: { id: true, fullName: true, email: true } },
        checkedBy: { select: { id: true, fullName: true } },
      },
    })
  }

  async findByCandidate(candidateId: string) {
    return this.db.backgroundCheck.findMany({
      where: { candidateId },
      orderBy: { createdAt: "desc" },
      include: {
        offer: {
          include: {
            application: {
              include: {
                requisition: { select: { id: true, title: true } },
              },
            },
          },
        },
      },
    })
  }

  async list(query?: { page?: number; pageSize?: number; status?: string }) {
    const { page = 1, pageSize = 20, status } = query ?? {}
    const skip = (page - 1) * pageSize

    const where: Prisma.BackgroundCheckWhereInput = {}
    if (status) where.status = status as $Enums.BgcStatus

    const [items, total] = await Promise.all([
      this.db.backgroundCheck.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          offer: {
            include: {
              application: {
                include: {
                  candidate: { select: { id: true, fullName: true } },
                },
              },
            },
          },
          candidate: { select: { id: true, fullName: true, email: true } },
          checkedBy: { select: { id: true, fullName: true } },
        },
      }),
      this.db.backgroundCheck.count({ where }),
    ])

    return { items, total, page, pageSize }
  }

  async update(id: string, data: UpdateBackgroundCheckInput, checkedById?: string) {
    // Validate status transition
    const existing = await this.db.backgroundCheck.findUnique({ where: { id } })
    if (!existing) throw new Error("Background check not found")

    if (data.status && existing.status !== data.status) {
      const validTransitions = BGC_STATUS_TRANSITIONS[existing.status as keyof typeof BGC_STATUS_TRANSITIONS]
      if (!validTransitions?.includes(data.status)) {
        throw new Error(`Invalid status transition from ${existing.status} to ${data.status}`)
      }
    }

    const updateData: Prisma.BackgroundCheckUpdateInput = {}

    if (data.status !== undefined) updateData.status = data.status
    if (data.idVerified !== undefined) updateData.idVerified = data.idVerified
    if (data.addressVerified !== undefined) updateData.addressVerified = data.addressVerified
    if (data.criminalRecordCheck !== undefined) updateData.criminalRecordCheck = data.criminalRecordCheck
    if (data.legalStatusCheck !== undefined) updateData.legalStatusCheck = data.legalStatusCheck
    if (data.certificationVerified !== undefined) updateData.certificationVerified = data.certificationVerified
    if (data.employmentHistoryVerified !== undefined) updateData.employmentHistoryVerified = data.employmentHistoryVerified
    if (data.financialCheckCompleted !== undefined) updateData.financialCheckCompleted = data.financialCheckCompleted
    if (data.creditScoreCheck !== undefined) updateData.creditScoreCheck = data.creditScoreCheck
    if (data.failReason !== undefined) updateData.failReason = data.failReason
    if (data.documents !== undefined) updateData.documents = (data.documents as unknown) as Prisma.InputJsonValue
    if (checkedById) updateData.checkedBy = { connect: { id: checkedById } }

    // Auto-complete if all checks done
    if (data.status === "in_progress") {
      const checks = [
        data.idVerified,
        data.addressVerified,
        data.criminalRecordCheck,
        data.legalStatusCheck,
        data.certificationVerified,
        data.employmentHistoryVerified,
        data.financialCheckCompleted,
        data.creditScoreCheck,
      ]
      if (checks.every(Boolean)) {
        updateData.status = "completed"
      }
    }

    return this.db.backgroundCheck.update({
      where: { id },
      data: updateData,
      include: {
        candidate: { select: { id: true, fullName: true, email: true } },
        checkedBy: { select: { id: true, fullName: true } },
      },
    })
  }

  async complete(id: string, passed: boolean, completedById: string, failReason?: string) {
    return this.db.backgroundCheck.update({
      where: { id },
      data: {
        status: passed ? "passed" : "failed",
        failReason: passed ? undefined : failReason,
        completedAt: new Date(),
        checkedById: completedById,
      },
      include: {
        offer: {
          include: {
            application: {
              include: {
                candidate: { select: { id: true, fullName: true, email: true } },
              },
            },
          },
        },
      },
    })
  }

  async delete(id: string) {
    return this.db.backgroundCheck.delete({ where: { id } })
  }

  async getStats() {
    const [total, byStatus, byGroup] = await Promise.all([
      this.db.backgroundCheck.count(),
      this.db.backgroundCheck.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
      this.db.backgroundCheck.groupBy({
        by: ["group"],
        _count: { id: true },
      }),
    ])

    return {
      total,
      byStatus: byStatus.reduce(
        (acc, { status, _count }) => ({ ...acc, [status]: _count.id }),
        {} as Record<string, number>
      ),
      byGroup: byGroup.reduce(
        (acc, { group, _count }) => ({ ...acc, [group]: _count.id }),
        {} as Record<string, number>
      ),
    }
  }
}

export const backgroundCheckRepository = new BackgroundCheckRepository()

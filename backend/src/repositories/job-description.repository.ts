import { prisma } from "@/libs/database"
import { Prisma, type PrismaClient } from "@prisma/client"
import type {
  CreateJobDescriptionInput,
  UpdateJobDescriptionInput,
} from "@/schemas/recruitment.schema"

export interface ListJobDescriptionsQuery {
  requisitionId?: string
  search?: string
  page: number
  pageSize: number
}

export class JobDescriptionRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  create(data: CreateJobDescriptionInput) {
    return this.db.jobDescription.create({
      data,
      include: this.relations,
    })
  }

  findById(id: string) {
    return this.db.jobDescription.findUnique({
      where: { id },
      include: this.relations,
    })
  }

  async list(query: ListJobDescriptionsQuery) {
    const { page, pageSize, requisitionId, search } = query
    const where: Prisma.JobDescriptionWhereInput = {
      ...(requisitionId ? { requisitionId } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { summary: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    }
    const [items, total] = await this.db.$transaction([
      this.db.jobDescription.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { updatedAt: "desc" },
        include: this.relations,
      }),
      this.db.jobDescription.count({ where }),
    ])
    return { items, total, page, pageSize }
  }

  update(id: string, data: UpdateJobDescriptionInput) {
    return this.db.jobDescription.update({
      where: { id },
      data,
      include: this.relations,
    })
  }

  private readonly relations = {
    requisition: {
      select: {
        id: true,
        code: true,
        title: true,
        department: true,
        positionLevel: true,
        headcount: true,
        status: true,
      },
    },
    postings: { orderBy: { createdAt: "desc" as const } },
  }
}

export const jobDescriptionRepository = new JobDescriptionRepository()

import { prisma } from "@/libs/database"
import { Prisma, type PostingStatus, type PrismaClient, type RecruitmentChannel } from "@prisma/client"
import type {
  UpdateJobPostingInput,
} from "@/schemas/recruitment.schema"

export interface ListJobPostingsQuery {
  jobDescriptionId?: string
  channel?: RecruitmentChannel
  status?: PostingStatus
  page: number
  pageSize: number
}

export class JobPostingRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  create(data: Prisma.JobPostingUncheckedCreateInput) {
    return this.db.jobPosting.create({ data, include: this.relations })
  }

  findById(id: string) {
    return this.db.jobPosting.findUnique({
      where: { id },
      include: this.relations,
    })
  }

  findBySourceCode(sourceCode: string) {
    return this.db.jobPosting.findUnique({ where: { sourceCode }, select: { id: true } })
  }

  async list(query: ListJobPostingsQuery) {
    const { page, pageSize, jobDescriptionId, channel, status } = query
    const where: Prisma.JobPostingWhereInput = {
      ...(jobDescriptionId ? { jobDescriptionId } : {}),
      ...(channel ? { channel } : {}),
      ...(status ? { status } : {}),
    }
    const [items, total] = await this.db.$transaction([
      this.db.jobPosting.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: this.relations,
      }),
      this.db.jobPosting.count({ where }),
    ])
    return { items, total, page, pageSize }
  }

  update(id: string, data: UpdateJobPostingInput) {
    return this.db.jobPosting.update({
      where: { id },
      data,
      include: this.relations,
    })
  }

  markConnectorPublished(id: string, externalId: string, postingUrl: string) {
    return this.db.jobPosting.update({
      where: { id },
      data: {
        externalId,
        postingUrl,
        status: "open",
        connectorStatus: "ready",
        publishedAt: new Date(),
      },
      include: this.relations,
    })
  }

  storeConnectorExternalId(id: string, externalId: string) {
    return this.db.jobPosting.update({
      where: { id },
      data: { externalId },
      include: this.relations,
    })
  }

  markConnectorError(id: string) {
    return this.db.jobPosting.update({
      where: { id },
      data: { connectorStatus: "error" },
      include: this.relations,
    })
  }

  markSynced(id: string) {
    return this.db.jobPosting.update({
      where: { id },
      data: { lastSyncedAt: new Date(), connectorStatus: "ready" },
      include: this.relations,
    })
  }

  private readonly relations = {
    jobDescription: {
      include: {
        requisition: { select: { id: true, code: true, title: true, status: true } },
      },
    },
    oauthAccount: true,
  }
}

export const jobPostingRepository = new JobPostingRepository()

import { prisma } from "@/libs/database"
import { RecruitmentChannel } from "@prisma/client"

export class RecruitmentOAuthAccountRepository {
  create(userId: string, data: {
    channel: string
    name: string
    clientId: string
    clientSecret: string
    refreshToken: string
  }) {
    return prisma.recruitmentOAuthAccount.create({
      data: {
        userId,
        channel: data.channel as RecruitmentChannel,
        name: data.name,
        clientId: data.clientId,
        clientSecret: data.clientSecret,
        refreshToken: data.refreshToken,
      },
    })
  }

  async upsert(userId: string, data: {
    channel: string
    name: string
    clientId: string
    clientSecret: string
    refreshToken: string
  }, accountId?: string) {
    if (accountId) {
      const existing = await this.findById(accountId)
      if (existing && existing.userId === userId) {
        return prisma.recruitmentOAuthAccount.update({
          where: { id: accountId },
          data: {
            name: data.name,
            channel: data.channel as RecruitmentChannel,
            clientId: data.clientId,
            clientSecret: data.clientSecret,
            refreshToken: data.refreshToken,
          },
        })
      }
    }
    return this.create(userId, data)
  }

  findById(id: string) {
    return prisma.recruitmentOAuthAccount.findUnique({
      where: { id },
    })
  }

  findByIdForUser(id: string, userId: string) {
    return prisma.recruitmentOAuthAccount.findFirst({
      where: { id, userId },
    })
  }

  findByUserAndChannel(userId: string, channel: string) {
    return prisma.recruitmentOAuthAccount.findFirst({
      where: {
        userId,
        channel: channel as RecruitmentChannel,
      },
      orderBy: { createdAt: "desc" },
    })
  }

  findFirstByChannel(channel: string) {
    return prisma.recruitmentOAuthAccount.findFirst({
      where: {
        channel: channel as RecruitmentChannel,
      },
      orderBy: { createdAt: "desc" },
    })
  }

  listByUser(userId: string) {
    return prisma.recruitmentOAuthAccount.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    })
  }

  list() {
    return prisma.recruitmentOAuthAccount.findMany({
      orderBy: { createdAt: "desc" },
    })
  }

  delete(userId: string, id: string) {
    return prisma.recruitmentOAuthAccount.deleteMany({
      where: {
        userId,
        id,
      },
    })
  }
}

export const recruitmentOAuthAccountRepository = new RecruitmentOAuthAccountRepository()

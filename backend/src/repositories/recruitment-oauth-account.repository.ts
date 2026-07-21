import { prisma } from "@/libs/database"
import { RecruitmentChannel } from "@prisma/client"

export class RecruitmentOAuthAccountRepository {
  upsert(userId: string, data: {
    channel: string
    name: string
    clientId: string
    clientSecret: string
    refreshToken: string
  }) {
    return prisma.recruitmentOAuthAccount.upsert({
      where: {
        userId_channel: {
          userId,
          channel: data.channel as RecruitmentChannel,
        },
      },
      update: {
        name: data.name,
        clientId: data.clientId,
        clientSecret: data.clientSecret,
        refreshToken: data.refreshToken,
      },
      create: {
        userId,
        channel: data.channel as RecruitmentChannel,
        name: data.name,
        clientId: data.clientId,
        clientSecret: data.clientSecret,
        refreshToken: data.refreshToken,
      },
    })
  }

  findByUserAndChannel(userId: string, channel: string) {
    return prisma.recruitmentOAuthAccount.findUnique({
      where: {
        userId_channel: {
          userId,
          channel: channel as RecruitmentChannel,
        },
      },
    })
  }

  listByUser(userId: string) {
    return prisma.recruitmentOAuthAccount.findMany({
      where: { userId },
      orderBy: { channel: "asc" },
    })
  }

  list() {
    return prisma.recruitmentOAuthAccount.findMany({
      orderBy: { channel: "asc" },
    })
  }

  delete(userId: string, channel: string) {
    return prisma.recruitmentOAuthAccount.delete({
      where: {
        userId_channel: {
          userId,
          channel: channel as RecruitmentChannel,
        },
      },
    })
  }
}

export const recruitmentOAuthAccountRepository = new RecruitmentOAuthAccountRepository()

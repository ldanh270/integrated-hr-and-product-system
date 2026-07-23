import { HttpStatusCode } from "@/configs/system/http.config"
import { recruitmentOAuthAccountRepository } from "@/repositories/recruitment-oauth-account.repository"
import { AppError } from "@/utils/error.util"

const LAYER = "RecruitmentOAuthAccountService"

export class RecruitmentOAuthAccountService {
  async upsert(userId: string, input: {
    channel: string
    name: string
    clientId: string
    clientSecret: string
    refreshToken: string
  }) {
    return recruitmentOAuthAccountRepository.upsert(userId, input)
  }

  async list(userId?: string) {
    if (userId) {
      return recruitmentOAuthAccountRepository.listByUser(userId)
    }
    return recruitmentOAuthAccountRepository.list()
  }

  async getByChannel(userId: string, channel: string) {
    const account = await recruitmentOAuthAccountRepository.findByUserAndChannel(userId, channel)
    if (!account) {
      throw new AppError(
        `Tài khoản OAuth cho kênh ${channel} chưa được cấu hình`,
        HttpStatusCode.NOT_FOUND,
        LAYER,
      )
    }
    return account
  }

  async delete(userId: string, idOrChannel: string) {
    return recruitmentOAuthAccountRepository.delete(userId, idOrChannel)
  }

  async getCredentials(userId: string, channel: string) {
    const account = await recruitmentOAuthAccountRepository.findByUserAndChannel(userId, channel)
    if (!account) return null
    return {
      clientId: account.clientId,
      clientSecret: account.clientSecret,
      refreshToken: account.refreshToken,
    }
  }

  async saveFromOAuthFlow(userId: string, channel: string, name: string, tokens: {
    clientId: string
    clientSecret: string
    refreshToken: string
  }) {
    return recruitmentOAuthAccountRepository.upsert(userId, {
      channel,
      name,
      ...tokens,
    })
  }
}

export const recruitmentOAuthAccountService = new RecruitmentOAuthAccountService()

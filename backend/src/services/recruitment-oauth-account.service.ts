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
  }, accountId?: string) {
    return recruitmentOAuthAccountRepository.upsert(userId, input, accountId)
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

  async delete(userId: string, id: string) {
    const result = await recruitmentOAuthAccountRepository.delete(userId, id)
    if (result.count === 0) {
      throw new AppError(
        "Không tìm thấy tài khoản OAuth để xóa",
        HttpStatusCode.NOT_FOUND,
        LAYER,
      )
    }
    return result
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
  }, accountId?: string) {
    return recruitmentOAuthAccountRepository.upsert(userId, {
      channel,
      name,
      ...tokens,
    }, accountId)
  }
}

export const recruitmentOAuthAccountService = new RecruitmentOAuthAccountService()

import { Response, NextFunction } from "express"
import { z } from "zod"
import { randomUUID } from "node:crypto"
import { jobRequisitionService } from "@/services/job-requisition.service"
import { candidateService } from "@/services/candidate.service"
import { recruitmentApplicationService } from "@/services/recruitment-application.service"
import { interviewRoundService } from "@/services/interview-round.service"
import { scorecardService } from "@/services/scorecard.service"
import { recruitmentOfferService } from "@/services/recruitment-offer.service"
import { backgroundCheckService } from "@/services/background-check.service"
import { jobDescriptionService } from "@/services/job-description.service"
import { jobPostingService } from "@/services/job-posting.service"
import { recruitmentIntakeService } from "@/services/recruitment-intake.service"
import { recruitmentOAuthAccountService } from "@/services/recruitment-oauth-account.service"
import { buildGoogleAuthUrl, exchangeGoogleCode, getGoogleOAuthConfig } from "@/configs/system/oauth-google.config"
import { HttpStatusCode } from "@/configs/system/http.config"
import { AppError } from "@/utils/error.util"
import type { AuthRequest } from "@/middlewares/auth.middleware"
import type { ApiResponse } from "@/types"
import {
  createJobRequisitionSchema,
  updateJobRequisitionSchema,
  approveRequisitionSchema,
  listRequisitionsQuerySchema,
  createCandidateSchema,
  updateCandidateSchema,
  listCandidatesQuerySchema,
  createApplicationSchema,
  updateApplicationStatusSchema,
  moveKanbanSchema,
  createInterviewRoundSchema,
  updateInterviewRoundSchema,
  createScorecardSchema,
  updateScorecardSchema,
  createOfferSchema,
  respondToOfferSchema,
  createBackgroundCheckSchema,
  updateBackgroundCheckSchema,
  listApplicationsQuerySchema,
  createJobDescriptionSchema,
  updateJobDescriptionSchema,
  listJobDescriptionsQuerySchema,
  createJobPostingSchema,
  updateJobPostingSchema,
  listJobPostingsQuerySchema,
  publishJobPostingSchema,
  importRecruitmentIntakeSchema,
} from "@/schemas/recruitment.schema"

export class RecruitmentController {
  private parseQuery = <T>(schema: z.ZodSchema<T>, query: Record<string, unknown>) => {
    const result = schema.safeParse(query)
    if (!result.success) {
      throw result.error
    }
    return result.data
  }

  private parseBody = <T>(schema: z.ZodSchema<T>, body: unknown) => {
    const result = schema.safeParse(body)
    if (!result.success) {
      throw result.error
    }
    return result.data
  }

  private sendSuccess<T>(res: Response, data: T, status = 200) {
    const response: ApiResponse<T> = { data, error: null }
    res.status(status).json(response)
  }

  private sendCreated<T>(res: Response, data: T) {
    this.sendSuccess(res, data, 201)
  }

  // ── Job Requisition ─────────────────────────────────────────────────────────

  createRequisition = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const body = this.parseBody(createJobRequisitionSchema, req.body)
      const result = await jobRequisitionService.create(body, req.user!.empId)
      this.sendCreated(res, result)
    } catch (e) { next(e) }
  }

  getRequisition = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await jobRequisitionService.findById(req.params.id as string)
      this.sendSuccess(res, result)
    } catch (e) { next(e) }
  }

  listRequisitionApprovers = async (_req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await jobRequisitionService.listApprovers()
      this.sendSuccess(res, result)
    } catch (e) { next(e) }
  }

  listRequisitions = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const query = this.parseQuery(listRequisitionsQuerySchema, req.query)
      const result = await jobRequisitionService.list(query)
      this.sendSuccess(res, result)
    } catch (e) { next(e) }
  }

  updateRequisition = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const body = this.parseBody(updateJobRequisitionSchema, req.body)
      const result = await jobRequisitionService.update(req.params.id as string, body)
      this.sendSuccess(res, result)
    } catch (e) { next(e) }
  }

  submitRequisitionForApproval = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await jobRequisitionService.submitForApproval(req.params.id as string)
      this.sendSuccess(res, result)
    } catch (e) { next(e) }
  }

  approveRequisition = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const body = this.parseBody(approveRequisitionSchema, req.body)
      const result = await jobRequisitionService.approve(req.params.id as string, body, req.user!.empId)
      this.sendSuccess(res, result)
    } catch (e) { next(e) }
  }

  closeRequisition = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await jobRequisitionService.close(req.params.id as string)
      this.sendSuccess(res, result)
    } catch (e) { next(e) }
  }

  deleteRequisition = async (_req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      res.status(204).send()
    } catch (e) { next(e) }
  }

  getRequisitionStats = async (_req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await jobRequisitionService.getStats()
      this.sendSuccess(res, result)
    } catch (e) { next(e) }
  }

  // ── Job descriptions, postings and intake ────────────────────────────────

  createJobDescription = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const body = this.parseBody(createJobDescriptionSchema, req.body)
      this.sendCreated(res, await jobDescriptionService.create(body))
    } catch (e) { next(e) }
  }

  listJobDescriptions = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const query = this.parseQuery(listJobDescriptionsQuerySchema, req.query)
      this.sendSuccess(res, await jobDescriptionService.list(query))
    } catch (e) { next(e) }
  }

  getJobDescription = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      this.sendSuccess(res, await jobDescriptionService.findById(req.params.id as string))
    } catch (e) { next(e) }
  }

  updateJobDescription = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const body = this.parseBody(updateJobDescriptionSchema, req.body)
      this.sendSuccess(res, await jobDescriptionService.update(req.params.id as string, body))
    } catch (e) { next(e) }
  }

  createJobPosting = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const body = this.parseBody(createJobPostingSchema, req.body)
      this.sendCreated(res, await jobPostingService.create(body))
    } catch (e) { next(e) }
  }

  listJobPostings = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const query = this.parseQuery(listJobPostingsQuerySchema, req.query)
      this.sendSuccess(res, await jobPostingService.list(query))
    } catch (e) { next(e) }
  }

  getJobPosting = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      this.sendSuccess(res, await jobPostingService.findById(req.params.id as string))
    } catch (e) { next(e) }
  }

  updateJobPosting = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const body = this.parseBody(updateJobPostingSchema, req.body)
      this.sendSuccess(res, await jobPostingService.update(req.params.id as string, body))
    } catch (e) { next(e) }
  }

  publishJobPosting = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const body = this.parseBody(publishJobPostingSchema, req.body)
      this.sendSuccess(res, await jobPostingService.publish(req.params.id as string, body))
    } catch (e) { next(e) }
  }

  syncJobPosting = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      this.sendSuccess(res, await jobPostingService.sync(req.params.id as string))
    } catch (e) { next(e) }
  }

  importRecruitmentIntake = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const body = this.parseBody(importRecruitmentIntakeSchema, req.body)
      this.sendSuccess(res, await recruitmentIntakeService.import(body))
    } catch (e) { next(e) }
  }

  // ── Candidate ──────────────────────────────────────────────────────────────

  createCandidate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const body = this.parseBody(createCandidateSchema, req.body)
      const result = await candidateService.create(body)
      this.sendCreated(res, result)
    } catch (e) { next(e) }
  }

  getCandidate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await candidateService.findById(req.params.id as string)
      this.sendSuccess(res, result)
    } catch (e) { next(e) }
  }

  listCandidates = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const query = this.parseQuery(listCandidatesQuerySchema, req.query)
      const result = await candidateService.list(query)
      this.sendSuccess(res, result)
    } catch (e) { next(e) }
  }

  updateCandidate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const body = this.parseBody(updateCandidateSchema, req.body)
      const result = await candidateService.update(req.params.id as string, body)
      this.sendSuccess(res, result)
    } catch (e) { next(e) }
  }

  deleteCandidate = async (_req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      res.status(204).send()
    } catch (e) { next(e) }
  }

  // ── Application ────────────────────────────────────────────────────────────

  createApplication = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const body = this.parseBody(createApplicationSchema, req.body)
      const result = await recruitmentApplicationService.create(body)
      this.sendCreated(res, result)
    } catch (e) { next(e) }
  }

  getApplication = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await recruitmentApplicationService.findById(req.params.id as string)
      this.sendSuccess(res, result)
    } catch (e) { next(e) }
  }

  listApplications = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const query = this.parseQuery(listApplicationsQuerySchema, req.query)
      const result = await recruitmentApplicationService.list(query)
      this.sendSuccess(res, result)
    } catch (e) { next(e) }
  }

  listKanban = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const query = this.parseQuery(listApplicationsQuerySchema, req.query)
      const result = await recruitmentApplicationService.listKanban(query)
      this.sendSuccess(res, result)
    } catch (e) { next(e) }
  }

  updateApplicationStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const body = this.parseBody(updateApplicationStatusSchema, req.body)
      const result = await recruitmentApplicationService.updateStatus(req.params.id as string, body)
      this.sendSuccess(res, result)
    } catch (e) { next(e) }
  }

  moveKanban = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const body = this.parseBody(moveKanbanSchema, req.body)
      const result = await recruitmentApplicationService.moveKanban(body.applicationId, body.targetStatus)
      this.sendSuccess(res, result)
    } catch (e) { next(e) }
  }

  assignRecruiter = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const assignedToId = req.body.assignedToId as string
      const result = await recruitmentApplicationService.assignRecruiter(req.params.id as string, assignedToId)
      this.sendSuccess(res, result)
    } catch (e) { next(e) }
  }

  addApplicationNote = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const note = req.body.note as string
      const result = await recruitmentApplicationService.addNote(req.params.id as string, note, req.user!.empId)
      this.sendCreated(res, result)
    } catch (e) { next(e) }
  }

  getApplicationNotes = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await recruitmentApplicationService.getNotes(req.params.id as string)
      this.sendSuccess(res, result)
    } catch (e) { next(e) }
  }

  getApplicationStats = async (_req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await recruitmentApplicationService.getStats()
      this.sendSuccess(res, result)
    } catch (e) { next(e) }
  }

  // ── Interview ──────────────────────────────────────────────────────────────

  createInterviewRound = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const body = this.parseBody(createInterviewRoundSchema, req.body)
      const result = await interviewRoundService.create(body)
      this.sendCreated(res, result)
    } catch (e) { next(e) }
  }

  getInterviewRound = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await interviewRoundService.findById(req.params.id as string)
      this.sendSuccess(res, result)
    } catch (e) { next(e) }
  }

  listInterviewsByApplication = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await interviewRoundService.listByApplication(req.params.applicationId as string)
      this.sendSuccess(res, result)
    } catch (e) { next(e) }
  }

  updateInterviewRound = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const body = this.parseBody(updateInterviewRoundSchema, req.body)
      const result = await interviewRoundService.update(req.params.id as string, body)
      this.sendSuccess(res, result)
    } catch (e) { next(e) }
  }

  completeInterview = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = req.body.result as string | undefined
      const feedback = req.body.feedback as string | undefined
      const result2 = await interviewRoundService.markCompleted(req.params.id as string, result, feedback)
      this.sendSuccess(res, result2)
    } catch (e) { next(e) }
  }

  cancelInterview = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await interviewRoundService.cancel(req.params.id as string)
      this.sendSuccess(res, result)
    } catch (e) { next(e) }
  }

  markNoShow = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await interviewRoundService.markNoShow(req.params.id as string)
      this.sendSuccess(res, result)
    } catch (e) { next(e) }
  }

  getUpcomingInterviews = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : 7
      const result = await interviewRoundService.getUpcoming(req.user!.empId, days)
      this.sendSuccess(res, result)
    } catch (e) { next(e) }
  }

  // ── Scorecard ─────────────────────────────────────────────────────────

  createScorecard = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const body = this.parseBody(createScorecardSchema, req.body)
      const result = await scorecardService.create(body)
      this.sendCreated(res, result)
    } catch (e) { next(e) }
  }

  getScorecard = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await scorecardService.findById(req.params.id as string)
      this.sendSuccess(res, result)
    } catch (e) { next(e) }
  }

  listScorecardsByInterview = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await scorecardService.findByInterview(req.params.interviewId as string)
      this.sendSuccess(res, result)
    } catch (e) { next(e) }
  }

  updateScorecard = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const body = this.parseBody(updateScorecardSchema, req.body)
      const result = await scorecardService.update(req.params.id as string, body)
      this.sendSuccess(res, result)
    } catch (e) { next(e) }
  }

  deleteScorecard = async (_req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      res.status(204).send()
    } catch (e) { next(e) }
  }

  // ── Offer ─────────────────────────────────────────────────────────────────

  createOffer = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const body = this.parseBody(createOfferSchema, req.body)
      const result = await recruitmentOfferService.create(body, req.user!.empId)
      this.sendCreated(res, result)
    } catch (e) { next(e) }
  }

  getOffer = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await recruitmentOfferService.findById(req.params.id as string)
      this.sendSuccess(res, result)
    } catch (e) { next(e) }
  }

  listOffers = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : undefined
      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string) : undefined
      const result = await recruitmentOfferService.list({ page, pageSize })
      this.sendSuccess(res, result)
    } catch (e) { next(e) }
  }

  updateOffer = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const body = this.parseBody(createOfferSchema.partial(), req.body)
      const result = await recruitmentOfferService.update(req.params.id as string, body)
      this.sendSuccess(res, result)
    } catch (e) { next(e) }
  }

  sendOffer = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await recruitmentOfferService.send(req.params.id as string)
      this.sendSuccess(res, result)
    } catch (e) { next(e) }
  }

  respondToOffer = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const body = this.parseBody(respondToOfferSchema, req.body)
      const result = await recruitmentOfferService.respond(body.offerId, body.response, body.responseNote)
      this.sendSuccess(res, result)
    } catch (e) { next(e) }
  }

  rescindOffer = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const reason = req.body.reason as string | undefined
      const result = await recruitmentOfferService.rescind(req.params.id as string, reason)
      this.sendSuccess(res, result)
    } catch (e) { next(e) }
  }

  expireOffer = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await recruitmentOfferService.expire(req.params.id as string)
      this.sendSuccess(res, result)
    } catch (e) { next(e) }
  }

  getOfferVersions = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await recruitmentOfferService.getVersions(req.params.id as string)
      this.sendSuccess(res, result)
    } catch (e) { next(e) }
  }

  getOfferStats = async (_req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await recruitmentOfferService.getStats()
      this.sendSuccess(res, result)
    } catch (e) { next(e) }
  }

  // ── Background Check ───────────────────────────────────────────────────────

  createBackgroundCheck = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const body = this.parseBody(createBackgroundCheckSchema, req.body)
      const result = await backgroundCheckService.create(body)
      this.sendCreated(res, result)
    } catch (e) { next(e) }
  }

  getBackgroundCheck = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await backgroundCheckService.findById(req.params.id as string)
      this.sendSuccess(res, result)
    } catch (e) { next(e) }
  }

  getBackgroundCheckByOffer = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await backgroundCheckService.findByOffer(req.params.offerId as string)
      this.sendSuccess(res, result)
    } catch (e) { next(e) }
  }

  listBackgroundChecks = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : undefined
      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string) : undefined
      const status = req.query.status as string | undefined
      const result = await backgroundCheckService.list({ page, pageSize, status })
      this.sendSuccess(res, result)
    } catch (e) { next(e) }
  }

  updateBackgroundCheck = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const body = this.parseBody(updateBackgroundCheckSchema, req.body)
      const result = await backgroundCheckService.update(req.params.id as string, body, req.user!.empId)
      this.sendSuccess(res, result)
    } catch (e) { next(e) }
  }

  startBackgroundCheck = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await backgroundCheckService.start(req.params.id as string)
      this.sendSuccess(res, result)
    } catch (e) { next(e) }
  }

  completeBackgroundCheck = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const passed = req.body.passed as boolean
      const failReason = req.body.failReason as string | undefined
      const result = await backgroundCheckService.complete(req.params.id as string, passed, req.user!.empId, failReason)
      this.sendSuccess(res, result)
    } catch (e) { next(e) }
  }

  deleteBackgroundCheck = async (_req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      res.status(204).send()
    } catch (e) { next(e) }
  }

  getBackgroundCheckStats = async (_req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await backgroundCheckService.getStats()
      this.sendSuccess(res, result)
    } catch (e) { next(e) }
  }

  // ── OAuth Accounts ─────────────────────────────────────────────────────────

  listOAuthAccounts = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.empId
      const result = await recruitmentOAuthAccountService.list(userId)
      this.sendSuccess(res, result)
    } catch (e) { next(e) }
  }

  upsertOAuthAccount = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.empId
      const { channel, name, clientId, clientSecret, refreshToken } = req.body
      const result = await recruitmentOAuthAccountService.upsert(userId, { channel, name, clientId, clientSecret, refreshToken })
      this.sendSuccess(res, result)
    } catch (e) { next(e) }
  }

  deleteOAuthAccount = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.empId
      await recruitmentOAuthAccountService.delete(userId, req.params.channel as string)
      res.status(204).send()
    } catch (e) { next(e) }
  }

  // ── Google OAuth Flow ─────────────────────────────────────────────────────

  /**
   * Initiate Google OAuth flow. Returns redirect URL for frontend to navigate to.
   * State param contains userId + channel + name to persist after callback.
   */
  initiateGoogleOAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const config = getGoogleOAuthConfig()
      if (!config) {
        throw new AppError(
          "Google OAuth chưa được cấu hình phía server. Vui lòng thiết lập GOOGLE_OAUTH_CLIENT_ID và GOOGLE_OAUTH_CLIENT_SECRET.",
          HttpStatusCode.CONFLICT,
          "OAuthController",
        )
      }

      const userId = req.user!.empId
      const { channel, name } = req.query as { channel?: string; name?: string }
      if (!channel || !name) {
        throw new AppError("Thiếu channel hoặc name", HttpStatusCode.BAD_REQUEST, "OAuthController")
      }

      // Encode userId + channel + name in state
      const state = Buffer.from(JSON.stringify({ userId, channel, name })).toString("base64")
      const authUrl = buildGoogleAuthUrl(state)

      this.sendSuccess(res, { authUrl })
    } catch (e) { next(e) }
  }

  /**
   * Handle Google OAuth callback. Exchange code for tokens and save to DB.
   * Redirects to frontend with success/error status.
   */
  handleGoogleOAuthCallback = async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { code, state, error } = req.query as {
      code?: string
      state?: string
      error?: string
    }
    const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:5173"

    if (error) {
      return res.redirect(`${frontendUrl}/recruitment/oauth-accounts?error=${encodeURIComponent(error)}`)
    }

    if (!code || !state) {
      return res.redirect(`${frontendUrl}/recruitment/oauth-accounts?error=missing_params`)
    }

    try {
      // Decode state to get userId + channel + name
      const { userId, channel, name } = JSON.parse(Buffer.from(state, "base64").toString("utf8"))
      const config = getGoogleOAuthConfig()

      // Exchange code for tokens
      const tokens = await exchangeGoogleCode(code)

      // Save to database with userId
      await recruitmentOAuthAccountService.saveFromOAuthFlow(userId, channel, name, {
        clientId: config!.clientId,
        clientSecret: config!.clientSecret,
        refreshToken: tokens.refreshToken,
      })

      return res.redirect(`${frontendUrl}/recruitment/oauth-accounts?success=connected`)
    } catch (err) {
      console.error("Google OAuth callback error:", err)
      return res.redirect(`${frontendUrl}/recruitment/oauth-accounts?error=token_exchange_failed`)
    }
  }
}

import { interviewRoundRepository } from "@/repositories/interview-round.repository"
import { scorecardRepository } from "@/repositories/scorecard.repository"
import type { CreateInterviewRoundInput, UpdateInterviewRoundInput } from "@/types/recruitment.types"
import { recruitmentApplicationService } from "./recruitment-application.service"

export class InterviewRoundService {
  async create(input: CreateInterviewRoundInput) {
    // Validate application exists and is in valid state
    const application = await recruitmentApplicationService.findById(input.applicationId)
    if (!["shortlisted", "interviewing"].includes(application.status)) {
      throw new Error("Application must be in shortlisted or interviewing status to schedule interviews")
    }

    // Validate scheduled time is in the future
    const scheduledAt = new Date(input.scheduledAt)
    if (scheduledAt <= new Date()) {
      throw new Error("Interview must be scheduled in the future")
    }

    return interviewRoundRepository.create(input)
  }

  async findById(id: string) {
    const interview = await interviewRoundRepository.findById(id)
    if (!interview) {
      throw new Error("Interview round not found")
    }
    return interview
  }

  async listByApplication(applicationId: string) {
    return interviewRoundRepository.listByApplication(applicationId)
  }

  async update(id: string, input: UpdateInterviewRoundInput) {
    const existing = await this.findById(id)

    // Cannot update completed or cancelled interviews
    if (existing.status === "completed" || existing.status === "cancelled") {
      throw new Error("Cannot update completed or cancelled interviews")
    }

    // Validate scheduled time if being updated
    if (input.scheduledAt) {
      const scheduledAt = new Date(input.scheduledAt)
      if (scheduledAt <= new Date()) {
        throw new Error("Interview must be scheduled in the future")
      }
    }

    return interviewRoundRepository.update(id, input)
  }

  async markCompleted(id: string, result?: string, feedback?: string) {
    const existing = await this.findById(id)

    if (existing.status === "cancelled") {
      throw new Error("Cannot complete a cancelled interview")
    }

    const interview = await interviewRoundRepository.markCompleted(id, result, feedback)

    // Calculate average rating from scorecards
    const avgRating = await scorecardRepository.getAverageRating(id)

    // Auto-update application status based on interview results
    if (result === "pass") {
      // Check if there are more rounds planned
      const rounds = await interviewRoundRepository.listByApplication(existing.applicationId)
      const currentRound = rounds.find((r) => r.id === id)
      const hasMoreRounds = rounds.some((r) => r.roundNumber > currentRound!.roundNumber)

      if (!hasMoreRounds) {
        // Move to final review if no more rounds
        await recruitmentApplicationService.updateStatus(existing.applicationId, {
          status: "final_review",
        })
      }
      // Otherwise stays in interviewing for next round
    } else if (result === "fail") {
      // Reject application
      await recruitmentApplicationService.updateStatus(existing.applicationId, {
        status: "rejected",
        rejectReason: "Failed interview",
      })
    }

    return { ...interview, averageRating: avgRating }
  }

  async cancel(id: string) {
    const existing = await this.findById(id)

    if (existing.status === "completed") {
      throw new Error("Cannot cancel a completed interview")
    }

    return interviewRoundRepository.cancel(id)
  }

  async markNoShow(id: string) {
    const existing = await this.findById(id)

    if (existing.status === "completed" || existing.status === "cancelled") {
      throw new Error("Cannot mark as no-show for completed or cancelled interviews")
    }

    const interview = await interviewRoundRepository.markNoShow(id)

    // Auto-reject on no-show
    await recruitmentApplicationService.updateStatus(existing.applicationId, {
      status: "rejected",
      rejectReason: "Candidate no-show for interview",
    })

    return interview
  }

  async delete(id: string) {
    const existing = await this.findById(id)

    if (existing.status === "completed") {
      throw new Error("Cannot delete completed interviews")
    }

    return interviewRoundRepository.delete(id)
  }

  async getUpcoming(interviewerId: string, days?: number) {
    return interviewRoundRepository.getUpcoming(interviewerId, days)
  }
}

export const interviewRoundService = new InterviewRoundService()

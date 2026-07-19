import { scorecardRepository } from "@/repositories/scorecard.repository"
import { interviewRoundRepository } from "@/repositories/interview-round.repository"
import type { CreateScorecardInput, UpdateScorecardInput } from "@/types/recruitment.types"

export class ScorecardService {
  async create(input: CreateScorecardInput) {
    // Validate interview exists
    const interview = await interviewRoundRepository.findById(input.interviewId)
    if (!interview) {
      throw new Error("Interview round not found")
    }

    // Check if evaluator already submitted scorecard
    const existing = await scorecardRepository.findByInterview(input.interviewId)
    const alreadySubmitted = existing.some((s) => s.evaluator?.id === input.evaluatorId)
    if (alreadySubmitted) {
      throw new Error("Evaluator has already submitted a scorecard for this interview")
    }

    return scorecardRepository.create(input)
  }

  async findById(id: string) {
    const scorecard = await scorecardRepository.findById(id)
    if (!scorecard) {
      throw new Error("Scorecard not found")
    }
    return scorecard
  }

  async findByInterview(interviewId: string) {
    return scorecardRepository.findByInterview(interviewId)
  }

  async findByEvaluator(evaluatorId: string) {
    return scorecardRepository.findByEvaluator(evaluatorId)
  }

  async update(id: string, input: UpdateScorecardInput) {
    const existing = await this.findById(id)
    return scorecardRepository.update(id, input)
  }

  async delete(id: string) {
    const existing = await this.findById(id)
    return scorecardRepository.delete(id)
  }

  async getAverageRating(interviewId: string) {
    return scorecardRepository.getAverageRating(interviewId)
  }

  async getRecommendationSummary(interviewId: string) {
    return scorecardRepository.getRecommendationSummary(interviewId)
  }
}

export const scorecardService = new ScorecardService()

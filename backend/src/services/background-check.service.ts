import { backgroundCheckRepository } from "@/repositories/background-check.repository"
import { recruitmentOfferRepository } from "@/repositories/recruitment-offer.repository"
import type { CreateBackgroundCheckInput, UpdateBackgroundCheckInput } from "@/types/recruitment.types"
import { recruitmentApplicationService } from "./recruitment-application.service"
import { BGC_CHECKS } from "@/configs/rules/recruitment.config"

export class BackgroundCheckService {
  async create(input: CreateBackgroundCheckInput) {
    // Validate offer exists
    const offer = await recruitmentOfferRepository.findById(input.offerId)
    if (!offer) {
      throw new Error("Offer not found")
    }

    // Only accepted offers need background checks
    if (offer.status !== "accepted") {
      throw new Error("Background check can only be created for accepted offers")
    }

    return backgroundCheckRepository.create(input)
  }

  async findById(id: string) {
    const bgc = await backgroundCheckRepository.findById(id)
    if (!bgc) {
      throw new Error("Background check not found")
    }
    return bgc
  }

  async findByOffer(offerId: string) {
    return backgroundCheckRepository.findByOffer(offerId)
  }

  async findByCandidate(candidateId: string) {
    return backgroundCheckRepository.findByCandidate(candidateId)
  }

  async list(query?: { page?: number; pageSize?: number; status?: string }) {
    return backgroundCheckRepository.list(query)
  }

  async update(id: string, input: UpdateBackgroundCheckInput, checkedById?: string) {
    const existing = await this.findById(id)

    // Cannot update completed checks
    if (existing.status === "completed" || existing.status === "passed" || existing.status === "failed") {
      throw new Error("Cannot update completed background checks")
    }

    // Validate that required checks for this group are being performed
    const requiredChecks = BGC_CHECKS[existing.group as keyof typeof BGC_CHECKS] ?? []

    // Start progress if not already started
    if (existing.status === "pending" && input.status === undefined) {
      input.status = "in_progress"
    }

    return backgroundCheckRepository.update(id, input, checkedById)
  }

  async start(id: string) {
    const existing = await this.findById(id)

    if (existing.status !== "pending") {
      throw new Error("Background check has already been started")
    }

    return backgroundCheckRepository.update(id, { status: "in_progress" })
  }

  async complete(id: string, passed: boolean, completedById: string, failReason?: string) {
    const existing = await this.findById(id)

    if (existing.status !== "in_progress") {
      throw new Error("Background check must be in progress to complete")
    }

    // Validate that all required checks were performed
    const requiredChecks = BGC_CHECKS[existing.group as keyof typeof BGC_CHECKS] ?? []
    const checkFields = requiredChecks.map((c) => c.field)

    // Verify all required checks were done
    const allChecksDone = checkFields.every((field) => {
      const value = (existing as any)[field]
      return value === true
    })

    if (!allChecksDone && passed) {
      throw new Error("Not all required checks have been completed")
    }

    const result = await backgroundCheckRepository.complete(id, passed, completedById, failReason)

    // Auto-update application status based on BGC result
    const offer = await recruitmentOfferRepository.findById(existing.offerId)
    if (!offer) throw new Error("Offer not found")
    if (passed) {
      await recruitmentApplicationService.updateStatus(offer.applicationId, {
        status: "pending_onboarding",
      })
    } else {
      await recruitmentApplicationService.updateStatus(offer.applicationId, {
        status: "offer_rescinded",
        rejectReason: `Background check failed: ${failReason ?? "Unknown reason"}`,
      })
    }

    return result
  }

  async delete(id: string) {
    const existing = await this.findById(id)

    // Cannot delete completed checks
    if (existing.status !== "pending") {
      throw new Error("Only pending background checks can be deleted")
    }

    return backgroundCheckRepository.delete(id)
  }

  async getStats() {
    return backgroundCheckRepository.getStats()
  }
}

export const backgroundCheckService = new BackgroundCheckService()

import { candidateRepository } from "@/repositories/candidate.repository"
import type { CreateCandidateInput, UpdateCandidateInput, ListCandidatesQuery } from "@/types/recruitment.types"

export class CandidateService {
  async create(input: CreateCandidateInput) {
    // Check for duplicate email
    const existing = await candidateRepository.findByEmail(input.email)
    if (existing) {
      throw new Error("A candidate with this email already exists")
    }

    return candidateRepository.create(input)
  }

  async findById(id: string) {
    const candidate = await candidateRepository.findById(id)
    if (!candidate) {
      throw new Error("Candidate not found")
    }
    return candidate
  }

  async findByEmail(email: string) {
    const candidate = await candidateRepository.findByEmail(email)
    if (!candidate) {
      throw new Error("Candidate not found")
    }
    return candidate
  }

  async list(query: ListCandidatesQuery) {
    return candidateRepository.list(query)
  }

  async update(id: string, input: UpdateCandidateInput) {
    const existing = await this.findById(id)

    // Check for duplicate email if email is being changed
    if (input.email && input.email !== existing.email) {
      const duplicate = await candidateRepository.findByEmail(input.email)
      if (duplicate) {
        throw new Error("A candidate with this email already exists")
      }
    }

    return candidateRepository.update(id, { ...input, id })
  }

  async delete(id: string) {
    const existing = await this.findById(id)

    // Prevent deletion if candidate has active applications
    if (existing.applications && existing.applications.length > 0) {
      const activeStatuses = ["new", "reviewing", "shortlisted", "interviewing", "final_review", "offer_sent", "offer_accepted"]
      const hasActive = existing.applications.some((app) => activeStatuses.includes(app.status))
      if (hasActive) {
        throw new Error("Cannot delete candidate with active applications")
      }
    }

    return candidateRepository.delete(id)
  }

  async getStats() {
    return candidateRepository.getStats()
  }
}

export const candidateService = new CandidateService()

import { Candidate, Prisma } from "@prisma/client";
import { prisma } from "../libs/database";
import { CreateCandidateDTO, ICandidateRepository } from "../types/recruitment/job-application.types";

/**
 * Repository class for handling Candidate data operations.
 * Implements the ICandidateRepository interface.
 */
export class CandidateRepository implements ICandidateRepository {
  /**
   * Creates a new candidate or updates an existing one based on their email address.
   * This uses an atomic upsert operation to avoid unique constraint violations.
   * 
   * @param data The candidate data to insert or update.
   * @returns The created or updated Candidate record.
   */
  async upsert(data: CreateCandidateDTO): Promise<Candidate> {
    const { email, ...rest } = data;

    return prisma.candidate.upsert({
      where: { email },
      update: {
        fullName: data.fullName,
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.resumeUrl !== undefined && { resumeUrl: data.resumeUrl }),
        ...(data.linkedinUrl !== undefined && { linkedinUrl: data.linkedinUrl }),
      },
      create: {
        email,
        fullName: data.fullName,
        phone: data.phone,
        resumeUrl: data.resumeUrl,
        linkedinUrl: data.linkedinUrl,
      },
    });
  }

  /**
   * Finds a candidate by their email address or phone number.
   * 
   * @param email The email address to search for.
   * @param phone The phone number to search for (optional).
   * @returns The Candidate record if found, otherwise null.
   */
  async findByEmailOrPhone(email: string, phone?: string): Promise<Candidate | null> {
    const whereClause: Prisma.CandidateWhereInput[] = [{ email }];
    if (phone) {
      whereClause.push({ phone });
    }

    return prisma.candidate.findFirst({
      where: {
        OR: whereClause
      }
    });
  }

  /**
   * Retrieves a candidate by their unique identifier.
   * 
   * @param id The unique ID of the candidate.
   * @returns The Candidate record if found, otherwise null.
   */
  async findById(id: string): Promise<Candidate | null> {
    return prisma.candidate.findUnique({
      where: { id }
    });
  }
}

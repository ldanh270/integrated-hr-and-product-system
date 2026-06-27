import { Candidate, Prisma } from "@prisma/client";
import { prisma } from "../libs/database";
import { CreateCandidateDTO, ICandidateRepository } from "../types/recruitment/job-application.types";

export class CandidateRepository implements ICandidateRepository {
  async upsert(data: CreateCandidateDTO): Promise<Candidate> {
    const { email, ...rest } = data;

    // Use Prisma's atomic upsert to avoid unique constraint violations
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

  async findById(id: string): Promise<Candidate | null> {
    return prisma.candidate.findUnique({
      where: { id }
    });
  }
}

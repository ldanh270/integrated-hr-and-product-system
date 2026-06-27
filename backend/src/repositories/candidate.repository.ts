import { Candidate, Prisma } from "@prisma/client";
import { prisma } from "../libs/database";
import { CreateCandidateDTO, ICandidateRepository } from "../types/recruitment/job-application.types";

export class CandidateRepository implements ICandidateRepository {
  async upsert(data: CreateCandidateDTO): Promise<Candidate> {
    const { email, ...rest } = data;
    
    // Find if exists
    let candidate = await this.findByEmailOrPhone(email, data.phone);

    if (candidate) {
      // Update with new data if provided
      return prisma.candidate.update({
        where: { id: candidate.id },
        data: {
          fullName: data.fullName,
          phone: data.phone || candidate.phone,
          resumeUrl: data.resumeUrl || candidate.resumeUrl,
          linkedinUrl: data.linkedinUrl || candidate.linkedinUrl,
        }
      });
    }

    // Create new
    return prisma.candidate.create({
      data: {
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

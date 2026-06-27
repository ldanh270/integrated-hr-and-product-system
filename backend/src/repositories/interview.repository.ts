import { InterviewRound, InterviewScorecard, InterviewStatus, InterviewResult, InterviewRoundMember, Prisma } from "@prisma/client";
import { prisma } from "../libs/database";
import { CreateInterviewRoundDTO, IInterviewRoundRepository, IInterviewScorecardRepository, SubmitScorecardDTO } from "../types/recruitment/interview.types";
import { INTERVIEW_STATUS } from "@/configs/entities/recruitment.config";


export class InterviewRoundRepository implements IInterviewRoundRepository {
  async create(data: CreateInterviewRoundDTO & { leadInterviewerId: string }): Promise<InterviewRound> {
    return prisma.interviewRound.create({
      data: {
        applicationId: data.applicationId,
        roundNumber: data.roundNumber,
        title: data.title,
        format: data.format,
        scheduledAt: data.scheduledAt,
        leadInterviewerId: data.leadInterviewerId,
      }
    });
  }

  async findById(id: string): Promise<InterviewRound | null> {
    return prisma.interviewRound.findUnique({
      where: { id },
      include: {
        interviewers: {
          include: { employee: { select: { id: true, role: true } } }
        },
        scorecards: true
      }
    });
  }

  async findByApplicationId(applicationId: string): Promise<InterviewRound[]> {
    return prisma.interviewRound.findMany({
      where: { applicationId },
      orderBy: { roundNumber: "asc" },
      include: {
        interviewers: true,
        scorecards: true
      }
    });
  }

  async updateStatus(id: string, status: InterviewStatus, result?: InterviewResult, overallNote?: string): Promise<InterviewRound> {
    const updateData: Prisma.InterviewRoundUpdateInput = { status };
    if (result) updateData.result = result;
    if (overallNote) updateData.overallNote = overallNote;
    if (status === INTERVIEW_STATUS.COMPLETED) updateData.completedAt = new Date();

    return prisma.interviewRound.update({
      where: { id },
      data: updateData
    });
  }

  async addInterviewer(roundId: string, employeeId: string): Promise<InterviewRoundMember> {
    return prisma.interviewRoundMember.create({
      data: {
        roundId,
        employeeId
      }
    });
  }

  async getInterviewers(roundId: string): Promise<InterviewRoundMember[]> {
    return prisma.interviewRoundMember.findMany({
      where: { roundId },
      include: { employee: true }
    });
  }
}

export class InterviewScorecardRepository implements IInterviewScorecardRepository {
  async upsert(data: SubmitScorecardDTO & { interviewerId: string }): Promise<InterviewScorecard> {
    const existing = await this.findByRoundAndInterviewer(data.roundId, data.interviewerId);
    
    if (existing) {
      return prisma.interviewScorecard.update({
        where: { id: existing.id },
        data: {
          scores: data.scores as Prisma.InputJsonValue,
          verdict: data.verdict,
          note: data.note,
          submittedAt: new Date()
        }
      });
    }

    return prisma.interviewScorecard.create({
      data: {
        roundId: data.roundId,
        interviewerId: data.interviewerId,
        scores: (data.scores as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        verdict: data.verdict,
        note: data.note,
        submittedAt: new Date()
      }
    });
  }

  async findByRoundId(roundId: string): Promise<InterviewScorecard[]> {
    return prisma.interviewScorecard.findMany({
      where: { roundId }
    });
  }

  async findByRoundAndInterviewer(roundId: string, interviewerId: string): Promise<InterviewScorecard | null> {
    return prisma.interviewScorecard.findUnique({
      where: {
        roundId_interviewerId: { roundId, interviewerId }
      }
    });
  }
}

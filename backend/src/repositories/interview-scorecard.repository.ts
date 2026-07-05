import { InterviewScorecard, Prisma } from "@prisma/client";
import { prisma } from "../libs/database";
import { SubmitScorecardDTO, IInterviewScorecardRepository } from "../types/recruitment/interview.types";

export class InterviewScorecardRepository implements IInterviewScorecardRepository {
  /**
   * Upserts an interview scorecard (one per interviewer per candidate per round).
   */
  async upsert(data: SubmitScorecardDTO & { interviewerId: string }): Promise<InterviewScorecard> {
    const existing = await prisma.interviewScorecard.findFirst({
      where: {
        roundId: data.roundId,
        applicationId: data.applicationId,
        interviewerId: data.interviewerId,
      },
    });

    if (existing) {
      return prisma.interviewScorecard.update({
        where: { id: existing.id },
        data: {
          scores: (data.scores as Prisma.InputJsonValue) || Prisma.JsonNull,
          verdict: data.verdict,
          note: data.note,
        },
      });
    }

    return prisma.interviewScorecard.create({
      data: {
        roundId: data.roundId,
        applicationId: data.applicationId,
        interviewerId: data.interviewerId,
        scores: (data.scores as Prisma.InputJsonValue) || Prisma.JsonNull,
        verdict: data.verdict,
        note: data.note,
      },
    });
  }

  /**
   * Finds all scorecards for a specific round.
   */
  async findByRoundId(roundId: string): Promise<InterviewScorecard[]> {
    return prisma.interviewScorecard.findMany({
      where: { roundId },
      include: { interviewer: true, application: true },
    });
  }

  /**
   * Finds all scorecards for a specific application in a specific round.
   */
  async findByApplicationAndRound(applicationId: string, roundId: string): Promise<InterviewScorecard[]> {
    return prisma.interviewScorecard.findMany({
      where: { roundId, applicationId },
      include: { interviewer: true },
    });
  }
}

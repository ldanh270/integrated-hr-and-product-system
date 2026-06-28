import { InterviewRound, InterviewScorecard, InterviewStatus, InterviewResult, InterviewRoundMember, Prisma } from "@prisma/client";
import { prisma } from "../libs/database";
import { CreateInterviewRoundDTO, IInterviewRoundRepository, IInterviewScorecardRepository, SubmitScorecardDTO } from "../types/recruitment/interview.types";
import { INTERVIEW_STATUS } from "@/configs/entities/recruitment.config";


export class InterviewRoundRepository implements IInterviewRoundRepository {
  /**
   * Creates a new interview round.
   * @param data - The data to create the interview round.
   * @returns The created interview round.
   */
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

  /**
   * Finds an interview round by its ID.
   * @param id - The ID of the interview round.
   * @returns The interview round with interviewers and scorecards, or null.
   */
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

  /**
   * Finds all interview rounds for a specific job application.
   * @param applicationId - The ID of the application.
   * @returns An array of interview rounds.
   */
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

  /**
   * Updates the status and optional result/note of an interview round.
   * @param id - The ID of the interview round.
   * @param status - The new status.
   * @param result - The optional result (e.g., PASS, FAIL).
   * @param overallNote - An optional overall note.
   * @returns The updated interview round.
   */
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

  /**
   * Adds an interviewer to an interview round.
   * @param roundId - The ID of the interview round.
   * @param employeeId - The ID of the employee acting as an interviewer.
   * @returns The created round member record.
   */
  async addInterviewer(roundId: string, employeeId: string): Promise<InterviewRoundMember> {
    return prisma.interviewRoundMember.create({
      data: {
        roundId,
        employeeId
      }
    });
  }

  /**
   * Retrieves all interviewers assigned to a specific round.
   * @param roundId - The ID of the interview round.
   * @returns An array of interview round members.
   */
  async getInterviewers(roundId: string): Promise<InterviewRoundMember[]> {
    return prisma.interviewRoundMember.findMany({
      where: { roundId },
      include: { employee: true }
    });
  }
}

export class InterviewScorecardRepository implements IInterviewScorecardRepository {
  /**
   * Upserts (creates or updates) an interview scorecard.
   * @param data - The scorecard data.
   * @returns The upserted interview scorecard.
   */
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

  /**
   * Retrieves all scorecards for a specific interview round.
   * @param roundId - The ID of the interview round.
   * @returns An array of interview scorecards.
   */
  async findByRoundId(roundId: string): Promise<InterviewScorecard[]> {
    return prisma.interviewScorecard.findMany({
      where: { roundId }
    });
  }

  /**
   * Finds a scorecard by round ID and interviewer ID.
   * @param roundId - The ID of the interview round.
   * @param interviewerId - The ID of the interviewer.
   * @returns The interview scorecard, or null if not found.
   */
  async findByRoundAndInterviewer(roundId: string, interviewerId: string): Promise<InterviewScorecard | null> {
    return prisma.interviewScorecard.findUnique({
      where: {
        roundId_interviewerId: { roundId, interviewerId }
      }
    });
  }
}

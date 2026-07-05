import { InterviewRound, InterviewStatus, InterviewRoundMember, InterviewRoundCandidate } from "@prisma/client";
import { prisma } from "../libs/database";
import { CreateInterviewRoundDTO, IInterviewRoundRepository, UpdateInterviewRoundDTO } from "../types/recruitment/interview.types";

export class InterviewRoundRepository implements IInterviewRoundRepository {
  /**
   * Creates a new interview round for a requisition.
   */
  async create(data: CreateInterviewRoundDTO): Promise<InterviewRound> {
    return prisma.interviewRound.create({
      data: {
        requisitionId: data.requisitionId,
        roundNumber: data.roundNumber,
        title: data.title,
        leadInterviewerId: data.leadInterviewerId,
        format: data.format,
        scheduledAt: data.scheduledAt,
      },
    });
  }

  /**
   * Finds an interview round by ID.
   */
  async findById(id: string): Promise<InterviewRound | null> {
    return prisma.interviewRound.findUnique({
      where: { id },
      include: {
        interviewers: { include: { employee: true } },
        candidates: { include: { application: true } },
        scorecards: true,
      },
    });
  }

  /**
   * Finds all interview rounds for a requisition.
   */
  async findByRequisitionId(requisitionId: string): Promise<InterviewRound[]> {
    return prisma.interviewRound.findMany({
      where: { requisitionId },
      orderBy: { roundNumber: "asc" },
      include: {
        interviewers: { include: { employee: true } },
        candidates: { include: { application: true } },
      },
    });
  }

  /**
   * Updates an interview round.
   * @param id - The ID of the round
   * @param data - The update data
   * @returns The updated interview round
   */
  async update(id: string, data: UpdateInterviewRoundDTO): Promise<InterviewRound> {
    return prisma.interviewRound.update({
      where: { id },
      data,
    });
  }

  /**
   * Deletes an interview round.
   * @param id - The ID of the round
   */
  async delete(id: string): Promise<void> {
    await prisma.interviewRound.delete({
      where: { id },
    });
  }

  /**
   * Updates the status of an interview round.
   */
  async updateStatus(id: string, status: InterviewStatus): Promise<InterviewRound> {
    return prisma.interviewRound.update({
      where: { id },
      data: { status },
    });
  }

  /**
   * Adds an interviewer to a round.
   */
  async addInterviewer(roundId: string, employeeId: string): Promise<InterviewRoundMember> {
    return prisma.interviewRoundMember.create({
      data: { roundId, employeeId },
    });
  }

  /**
   * Adds a candidate (application) to a round.
   */
  async addCandidate(roundId: string, applicationId: string): Promise<InterviewRoundCandidate> {
    return prisma.interviewRoundCandidate.create({
      data: { roundId, applicationId },
    });
  }

  /**
   * Gets all interviewers for a round.
   */
  async getInterviewers(roundId: string): Promise<InterviewRoundMember[]> {
    return prisma.interviewRoundMember.findMany({
      where: { roundId },
      include: { employee: true },
    });
  }

  /**
   * Gets all candidates for a round.
   */
  async getCandidates(roundId: string): Promise<InterviewRoundCandidate[]> {
    return prisma.interviewRoundCandidate.findMany({
      where: { roundId },
      include: { application: true },
    });
  }
}

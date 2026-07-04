import { HttpStatusCode } from "@/configs/system/http.config";
import { ErrorLayer } from "@/configs/system/error-code.config";
import { InterviewRound, InterviewScorecard, InterviewRoundCandidate } from "@prisma/client";
import { AppError } from "../utils/error.util";
import { CreateInterviewRoundDTO, SubmitScorecardDTO, IInterviewRoundRepository, IInterviewScorecardRepository, IInterviewService } from "../types/recruitment/interview.types";
import { IJobRequisitionRepository } from "../types/recruitment/job-requisition.types";
import { INTERVIEW_STATUS, INTERVIEW_RESULT, JOB_APPLICATION_STATUS } from "@/configs/entities/recruitment.config";
import { prisma } from "../libs/database";

export class InterviewService implements IInterviewService {
  constructor(
    private readonly interviewRoundRepository: IInterviewRoundRepository,
    private readonly interviewScorecardRepository: IInterviewScorecardRepository,
    private readonly jobRequisitionRepository: IJobRequisitionRepository
  ) {}

  /**
   * Schedules a new interview round for a requisition and adds interviewers and candidates.
   */
  async scheduleRound(requisitionId: string, data: CreateInterviewRoundDTO, interviewerIds: string[], applicationIds: string[]): Promise<InterviewRound> {
    const requisition = await this.jobRequisitionRepository.findById(requisitionId);
    if (!requisition) {
      throw new AppError("Job Requisition not found", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE);
    }

    // Use transaction to create round, attach interviewers and candidates
    return prisma.$transaction(async (tx) => {
      const round = await tx.interviewRound.create({
        data: {
          requisitionId,
          roundNumber: data.roundNumber,
          title: data.title,
          leadInterviewerId: interviewerIds[0],
          format: data.format,
          scheduledAt: data.scheduledAt,
        },
      });

      for (const interviewerId of interviewerIds) {
        await tx.interviewRoundMember.create({
          data: { roundId: round.id, employeeId: interviewerId },
        });
      }

      for (const applicationId of applicationIds) {
        await tx.interviewRoundCandidate.create({
          data: { roundId: round.id, applicationId },
        });

        // Update application status to interviewing
        await tx.jobApplication.update({
          where: { id: applicationId },
          data: { status: JOB_APPLICATION_STATUS.INTERVIEWING },
        });
      }

      return round;
    });
  }

  /**
   * Retrieves an interview round by ID.
   */
  async getRoundById(id: string): Promise<InterviewRound | null> {
    return this.interviewRoundRepository.findById(id);
  }

  /**
   * Submits or updates an interview scorecard.
   */
  async submitScorecard(interviewerId: string, data: SubmitScorecardDTO): Promise<InterviewScorecard> {
    const round = await this.interviewRoundRepository.findById(data.roundId);
    if (!round) {
      throw new AppError("Interview Round not found", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE);
    }

    // Verify interviewer is part of this round
    const interviewers = await this.interviewRoundRepository.getInterviewers(data.roundId);
    const isInterviewer = interviewers.some((i) => i.employeeId === interviewerId);
    if (!isInterviewer) {
      throw new AppError("You are not assigned as an interviewer for this round", HttpStatusCode.FORBIDDEN, ErrorLayer.SERVICE);
    }

    // Verify candidate is part of this round
    const candidates = await this.interviewRoundRepository.getCandidates(data.roundId);
    const isCandidate = candidates.some((c) => c.applicationId === data.applicationId);
    if (!isCandidate) {
      throw new AppError("Candidate is not part of this round", HttpStatusCode.BAD_REQUEST, ErrorLayer.SERVICE);
    }

    return this.interviewScorecardRepository.upsert({ ...data, interviewerId });
  }

  /**
   * Adds a candidate to an existing round.
   */
  async addCandidateToRound(roundId: string, applicationId: string): Promise<InterviewRoundCandidate> {
    const round = await this.interviewRoundRepository.findById(roundId);
    if (!round) {
      throw new AppError("Interview Round not found", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE);
    }

    // Check if application belongs to the same requisition
    const application = await prisma.jobApplication.findUnique({ where: { id: applicationId } });
    if (!application || application.requisitionId !== round.requisitionId) {
      throw new AppError("Application does not belong to the round's requisition", HttpStatusCode.BAD_REQUEST, ErrorLayer.SERVICE);
    }

    return this.interviewRoundRepository.addCandidate(roundId, applicationId);
  }
}

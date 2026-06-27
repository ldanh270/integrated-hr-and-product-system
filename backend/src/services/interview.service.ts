import { HttpStatusCode } from "@/configs/system/http.config";
import { ErrorLayer } from "@/configs/system/error-code.config";
import { InterviewRound, InterviewScorecard, InterviewStatus, InterviewResult, Role } from "@prisma/client";
import { AppError } from "../utils/error.util";
import { 
  CreateInterviewRoundDTO, 
  IInterviewRoundRepository, 
  IInterviewScorecardRepository, 
  IInterviewService, 
  SubmitScorecardDTO 
} from "../types/recruitment/interview.types";
import { IJobApplicationRepository } from "../types/recruitment/job-application.types";
import { prisma } from "../libs/database";
import { emailService } from "./email.service";
import { INTERVIEW_STATUS, INTERVIEW_RESULT } from "@/configs/entities/recruitment.config";


/**
 * Service class for handling Interview business logic.
 */
export class InterviewService implements IInterviewService {
  /**
   * Executes the constructor operation.
   * Generated JSDoc documentation.
   */
  constructor(
    private readonly roundRepository: IInterviewRoundRepository,
    private readonly scorecardRepository: IInterviewScorecardRepository,
    private readonly applicationRepository: IJobApplicationRepository
  ) {}

  /**
   * Executes the scheduleRound operation.
   * Generated JSDoc documentation.
   */
  async scheduleRound(leadInterviewerId: string, data: CreateInterviewRoundDTO, interviewerIds: string[]): Promise<InterviewRound> {
    const app = await this.applicationRepository.findById(data.applicationId);
    if (!app) {
      throw new AppError("Application not found", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE);
    }

    // Create the round and assign interviewers in a transaction
    const round = await prisma.$transaction(async (tx) => {
      const createdRound = await tx.interviewRound.create({
        data: {
          ...data,
          leadInterviewerId
        }
      });

      for (const interviewerId of interviewerIds) {
        await tx.interviewRoundMember.create({
          data: {
            roundId: createdRound.id,
            employeeId: interviewerId
          }
        });
      }

      return createdRound;
    });

    // Send email to candidate
    if (app.candidate) {
      await emailService.sendInterviewInvitation(
        app.candidate.email, 
        app.candidate.fullName, 
        `Interview scheduled on ${data.scheduledAt ? new Date(data.scheduledAt).toLocaleString() : 'TBD'}.`
      );
    }

    return this.roundRepository.findById(round.id) as Promise<InterviewRound>;
  }

  /**
   * Executes the getRoundById operation.
   * Generated JSDoc documentation.
   */
  async getRoundById(id: string): Promise<InterviewRound | null> {
    return this.roundRepository.findById(id);
  }

  /**
   * Executes the submitScorecard operation.
   * Generated JSDoc documentation.
   */
  async submitScorecard(interviewerId: string, data: SubmitScorecardDTO): Promise<InterviewScorecard> {
    const round = await this.roundRepository.findById(data.roundId);
    if (!round) {
      throw new AppError("Interview round not found", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE);
    }

    // Verify interviewer is part of this round
    const isAssigned = await prisma.interviewRoundMember.findUnique({
      where: { roundId_employeeId: { roundId: data.roundId, employeeId: interviewerId } }
    });
    
    if (!isAssigned) {
      throw new AppError("You are not assigned to this interview round", HttpStatusCode.FORBIDDEN, ErrorLayer.SERVICE);
    }

    // Submit scorecard
    const scorecard = await this.scorecardRepository.upsert({
      ...data,
      interviewerId
    });

    // Automatically try to evaluate the round
    await this.evaluateRoundResult(data.roundId);

    return scorecard;
  }

  /**
   * Executes the evaluateRoundResult operation.
   * Generated JSDoc documentation.
   */
  async evaluateRoundResult(roundId: string): Promise<InterviewRound> {
    const round = await this.roundRepository.findById(roundId);
    if (!round) {
      throw new AppError("Interview round not found", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE);
    }

    const assignedInterviewers = await this.roundRepository.getInterviewers(roundId);
    const scorecards = await this.scorecardRepository.findByRoundId(roundId);

    // Check if everyone has submitted
    if (scorecards.length < assignedInterviewers.length) {
      // Not everyone has submitted yet
      return round;
    }

    const allVerdicts = scorecards.map(s => s.verdict);
    let finalResult: InterviewResult = INTERVIEW_RESULT.PENDING;

    // VETO logic: If any interviewer fails the candidate, the whole round is a fail
    if (allVerdicts.includes(INTERVIEW_RESULT.FAIL)) {
      finalResult = INTERVIEW_RESULT.FAIL;
    } 
    // CONSENSUS logic: If everyone passes, it's a pass
    else if (allVerdicts.every(v => v === INTERVIEW_RESULT.PASS)) {
      finalResult = INTERVIEW_RESULT.PASS;
    } 
    // MIXED logic: Pass + Borderline means it needs Lead or GM decision (stays borderline overall)
    else if (allVerdicts.includes(INTERVIEW_RESULT.BORDERLINE)) {
      finalResult = INTERVIEW_RESULT.BORDERLINE;
    }

    // Update round status
    return this.roundRepository.updateStatus(
      roundId,
      INTERVIEW_STATUS.COMPLETED,
      finalResult
    );
  }
}

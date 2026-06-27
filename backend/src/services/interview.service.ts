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

  constructor(
    private readonly roundRepository: IInterviewRoundRepository,
    private readonly scorecardRepository: IInterviewScorecardRepository,
    private readonly applicationRepository: IJobApplicationRepository
  ) {}


  /**
   * Schedules a new interview round and assigns interviewers.
   * Sends an email invitation to the candidate.
   *
   * @param leadInterviewerId - ID of the employee leading this round
   * @param data - Details of the interview round including candidate and schedule
   * @param interviewerIds - List of employee IDs assigned as interviewers
   * @returns Returns the scheduled interview round
   * @throws AppError if the application is not found
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
   * Retrieves an interview round by its ID.
   *
   * @param id - The unique identifier of the interview round
   * @returns Returns the interview round if found, otherwise null
   */
  async getRoundById(id: string): Promise<InterviewRound | null> {
    return this.roundRepository.findById(id);
  }


  /**
   * Submits a scorecard for an interview round by an assigned interviewer.
   * Automatically triggers a round evaluation after submission.
   *
   * @param interviewerId - ID of the interviewer submitting the scorecard
   * @param data - The scorecard evaluation data including score and verdict
   * @returns Returns the newly submitted scorecard
   * @throws AppError if the interview round is not found or the interviewer is not assigned to the round
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
   * Evaluates the overall result of an interview round based on all submitted scorecards.
   * Resolves the final result using VETO, CONSENSUS, and MIXED logic.
   *
   * @param roundId - ID of the interview round to evaluate
   * @returns Returns the updated interview round with the final result
   * @throws AppError if the interview round is not found
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

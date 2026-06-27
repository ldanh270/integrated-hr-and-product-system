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

export class InterviewService implements IInterviewService {
  constructor(
    private readonly roundRepository: IInterviewRoundRepository,
    private readonly scorecardRepository: IInterviewScorecardRepository,
    private readonly applicationRepository: IJobApplicationRepository
  ) {}

  async scheduleRound(leadInterviewerId: string, data: CreateInterviewRoundDTO, interviewerIds: string[]): Promise<InterviewRound> {
    const app = await this.applicationRepository.findById(data.applicationId);
    if (!app) {
      throw new AppError("Application not found", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE);
    }

    // Create the round
    const round = await this.roundRepository.create({
      ...data,
      leadInterviewerId
    });

    // Assign interviewers
    for (const interviewerId of interviewerIds) {
      await this.roundRepository.addInterviewer(round.id, interviewerId);
    }

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

  async getRoundById(id: string): Promise<InterviewRound | null> {
    return this.roundRepository.findById(id);
  }

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
    let finalResult: InterviewResult = InterviewResult.pending;

    // VETO logic: If any interviewer fails the candidate, the whole round is a fail
    if (allVerdicts.includes(InterviewResult.fail)) {
      finalResult = InterviewResult.fail;
    } 
    // CONSENSUS logic: If everyone passes, it's a pass
    else if (allVerdicts.every(v => v === InterviewResult.pass)) {
      finalResult = InterviewResult.pass;
    } 
    // MIXED logic: Pass + Borderline means it needs Lead or GM decision (stays borderline overall)
    else if (allVerdicts.includes(InterviewResult.borderline)) {
      finalResult = InterviewResult.borderline;
    }

    // Update round status
    return this.roundRepository.updateStatus(
      roundId,
      InterviewStatus.completed,
      finalResult
    );
  }
}

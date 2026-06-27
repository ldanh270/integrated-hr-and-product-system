import { InterviewRound, InterviewScorecard, InterviewFormat, InterviewStatus, InterviewResult, InterviewRoundMember } from "@prisma/client";

export interface IInterviewRoundRepository {
  create(data: CreateInterviewRoundDTO & { leadInterviewerId: string }): Promise<InterviewRound>;
  findById(id: string): Promise<InterviewRound | null>;
  findByApplicationId(applicationId: string): Promise<InterviewRound[]>;
  updateStatus(id: string, status: InterviewStatus, result?: InterviewResult, overallNote?: string): Promise<InterviewRound>;
  addInterviewer(roundId: string, employeeId: string): Promise<InterviewRoundMember>;
  getInterviewers(roundId: string): Promise<InterviewRoundMember[]>;
}

export interface IInterviewScorecardRepository {
  upsert(data: SubmitScorecardDTO & { interviewerId: string }): Promise<InterviewScorecard>;
  findByRoundId(roundId: string): Promise<InterviewScorecard[]>;
  findByRoundAndInterviewer(roundId: string, interviewerId: string): Promise<InterviewScorecard | null>;
}

export interface IInterviewService {
  scheduleRound(leadInterviewerId: string, data: CreateInterviewRoundDTO, interviewerIds: string[]): Promise<InterviewRound>;
  getRoundById(id: string): Promise<InterviewRound | null>;
  submitScorecard(interviewerId: string, data: SubmitScorecardDTO): Promise<InterviewScorecard>;
  evaluateRoundResult(roundId: string): Promise<InterviewRound>;
}

export type CreateInterviewRoundDTO = {
  applicationId: string;
  roundNumber: number;
  title: string;
  format?: InterviewFormat;
  scheduledAt?: Date;
};

export type SubmitScorecardDTO = {
  roundId: string;
  scores?: Record<string, unknown>; // JSON structure based on role
  verdict: InterviewResult;
  note?: string;
};
